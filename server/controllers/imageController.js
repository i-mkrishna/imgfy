import userModel from "../models/userModel.js";
import axios from "axios";

export const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.userId;

    const user = await userModel.findById(userId);
    if (!user || !prompt) {
      return res.json({ success: false, message: "Missing details" });
    }

    if (user.creditBalance <= 0) {
      return res.json({ success: false, message: "No Credit Balance", creditBalance: user.creditBalance });
    }

    const response = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      { prompt },  
      {
        headers: { "x-api-key": process.env.CLIPDROP_API },
        responseType: "arraybuffer",
      }
    );


    const base64Image = `data:image/png;base64,${Buffer.from(response.data, "binary").toString("base64")}`;

    await userModel.findByIdAndUpdate(userId, { creditBalance: user.creditBalance - 1 });

    res.status(200).json({
      success: true,
      message: "Image generated successfully",
      creditBalance: user.creditBalance - 1,
      resultImage: base64Image,
    });

  } catch (error) {
    console.error("Image Generation Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
