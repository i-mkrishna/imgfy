import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import dotenv from "dotenv";
import razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";

dotenv.config();

console.log(process.env.RAZORPAY_KEY_ID);
console.log(process.env.RAZORPAY_SECRET_KEY);

// User Registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    const requiredFields = { name, email, password };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).send({
          success: false,
          message: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } is required`,
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists, please log in!",
      });
    }

    // Hash password and create new user
    const hashedPassword = await hashPassword(password);

    const user = await new userModel({
      name,
      email,
      password: hashedPassword,
    }).save();

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).send({
      success: true,
      message: "User registration successful!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred during registration. Please try again later.",
    });
  }
};

// User Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required!",
      });
    }

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found. Please register first!",
      });
    }
    console.log(password, user.password);
    // Check password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({
        success: false,
        message: "Invalid password!",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Token valid for 7 days
    });

    res.status(200).send({
      success: true,
      message: "Login successful!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({
      success: false,
      message: "An error occurred during login. Please try again later.",
    });
  }
};

// User credits
const userCredits = async (req, res) => {
  try {
    const userId = req.userId;
    console.log(req.body);

    // finding user
    const user = await userModel.findById(userId);
    res.status(200).send({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).send({
      success: false,
      message: "error while processing the credits",
    });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const paymentRazorpay = async (req, res) => {
  try {
    console.log("Received from frontend:", req.body);
    const { planId } = req.body;
    const userId = req.userId;

    console.log("User ID:", userId);
    console.log("Plan ID:", planId);

    if (!userId || !planId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Plan ID are required" });
    }

    // 🔹 Define plan-based credits & prices dynamically
    const planCredits = {
      basic: 100,
      standard: 250,
      premium: 500,
    };

    // 🔹 Normalize planId to lowercase for case-insensitive matching
    const normalizedPlanId = planId.toLowerCase();

    if (!planCredits[normalizedPlanId]) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Plan ID" });
    }

    const credits = planCredits[normalizedPlanId]; 
    const amount = credits * 10 * 100;
    const currency = "INR";

    // 🔹 Save transaction before creating Razorpay order
    const transaction = new transactionModel({
      userId,
      plan: normalizedPlanId,
      amount,
      credits,
      payment: false, // Initially false
      date: Date.now(),
    });

    await transaction.save();

    const options = {
      amount,
      currency,
      receipt: transaction._id.toString(), // Tracking payment with transaction ID
    };

    console.log("Creating Razorpay Order with options:", options);

    const order = await razorpayInstance.orders.create(options);

    console.log("Razorpay Order Created:", order);

    res.json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (!orderInfo) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Order ID" });
    }

    console.log("Order Info:", orderInfo);

    const transactionData = await transactionModel.findById(orderInfo.receipt);

    if (!transactionData) {
      return res
        .status(400)
        .json({ success: false, message: "Transaction not found" });
    }

    if (transactionData.payment) {
      return res.json({ success: false, message: "Payment already completed" });
    }

    const userData = await userModel.findById(transactionData.userId);

    if (!userData) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    console.log("verfying the details", userData);

    // Update user credits
    const updatedCreditBalance =
      userData.creditBalance + transactionData.credits;
    await userModel.findByIdAndUpdate(userData._id, {
      creditBalance: updatedCreditBalance,
    });

    await transactionModel.findByIdAndUpdate(transactionData._id, {
      payment: true,
    });

    res.json({
      success: true,
      message: "Credits added to the account",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying payment" });
  }
};

export {
  registerUser,
  loginUser,
  userCredits,
  paymentRazorpay,
  verifyRazorpay,
};
