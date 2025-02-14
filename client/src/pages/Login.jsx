import React, { useEffect, useState, useContext } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";

const Login = () => {
  const [state, setState] = useState("Login");
  const { setShowLogin, backendUrl, setToken, setUser } = useContext(AppContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!email || !password || (state !== "Login" && !name)) {
      return toast.error("All fields are required.");
    }

    try {
      let response;
      if (state === "Login") {
        response = await axios.post(`${backendUrl}/api/user/login`, {
          email,
          password,
        });
      } else {
        response = await axios.post(`${backendUrl}/api/user/register`, {
          name,
          email,
          password,
        });
      }

      const { data } = response;

      if (data.success) {
        console.log("TOken in login", data.token)
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        setShowLogin(false);
        toast.success(`Welcome ${data.user.name || ""}!`);

        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to process request. Please try again."
      );
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-10 backdrop-blur-sm bg-black/30 flex justify-center items-center">
      <motion.form
        className="relative bg-white p-10 rounded-xl text-slate-500"
        onSubmit={onSubmitHandler}
        initial={{ opacity: 0.2, y: 50 }}
        transition={{ duration: 0.3 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h1 className="text-center text-2xl text-neutral-700 font-medium">
          {state}
        </h1>
        <p className="text-sm">Welcome back! Please sign in to continue</p>

        {state !== "Login" && (
          <div className="flex border px-6 py-2 items-center gap-2 rounded-full mt-4">
            <img src={assets.profile_icon} alt="" width={24} />
            <input
              type="text"
              className="outline-none text-sm"
              placeholder="Full Name"
              required
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </div>
        )}

        <div className="flex border px-6 py-2 items-center gap-2 rounded-full mt-5">
          <img src={assets.email_icon} alt="" width={22} />
          <input
            type="email"
            className="outline-none text-sm"
            placeholder="Email id"
            required
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </div>

        <div className="flex border px-6 py-2 items-center gap-2 rounded-full mt-4">
          <img src={assets.lock_icon} alt="" width={22} />
          <input
            type="password"
            className="outline-none text-sm"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </div>

        <p className="text-sm text-blue-600 my-4 cursor-pointer">
          Forgot password
        </p>

        <button className="bg-blue-600 w-full text-white py-2 rounded-full">
          {state === "Login" ? "Login" : "Create Account"}
        </button>

        {state === "Login" ? (
          <p>
            Don't have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setState("Sign Up")}
            >
              Sign Up
            </span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setState("Login")}
            >
              Login
            </span>
          </p>
        )}

        <img
          src={assets.cross_icon}
          alt=""
          className="absolute top-5 right-5 cursor-pointer"
          onClick={() => setShowLogin(false)}
        />
      </motion.form>
    </div>
  );
};

export default Login;
