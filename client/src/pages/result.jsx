import React, { useState, useContext } from "react";
import { assets } from "../assets/assets";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";

const Result = () => {
  const [image, setImage] = useState(assets.sample_img_1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const { generateImage } = useContext(AppContext);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!generateImage) {
      console.error("generateImage function is not available");
      return;
    }

    if (!input.trim()) {
      alert("Please enter a valid prompt.");
      return;
    }

    setLoading(true);
    try {
      const generatedImage = await generateImage(input);

      if (generatedImage) {
        setIsImageLoaded(true);
        setImage(generatedImage);
      } else {
        alert("Failed to generate image. Please try again.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("An error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <motion.form
      onSubmit={onSubmitHandler}
      className="flex flex-col min-h-[90vh] justify-center items-center"
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div>
        <div className="relative">
          <img src={image} alt="Generated" className="max-w-sm rounded" />
          {loading && (
            <span className="absolute bottom-0 left-0 h-1 bg-blue-500 w-full animate-pulse" />
          )}
        </div>
        {loading && <p className="mt-2 text-gray-500">Loading...</p>}
      </div>

      {!isImageLoaded && (
        <div className="flex w-full max-w-xl bg-neutral-500 text-white text-sm p-0.5 mt-10 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder="Describe what you want to generate"
            className="flex-1 bg-transparent outline-none ml-8 placeholder-gray-300"
          />
          <button
            type="submit"
            disabled={loading}
            className={`px-10 sm:px-16 py-3 rounded-full transition ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-zinc-900"
            }`}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      )}

      {isImageLoaded && (
        <div className="flex gap-2 flex-wrap justify-center text-white text-sm p-0.5 mt-10 rounded-full">
          <button
            onClick={() => {
              setIsImageLoaded(false);
              setInput("");
            }}
            className="bg-transparent border border-zinc-900 text-black px-8 py-3 rounded-full cursor-pointer"
          >
            Generate Another
          </button>
          <a
            href={image}
            download="generated-image.png"
            className="bg-green-700 px-10 py-3 rounded-full cursor-pointer"
          >
            Download
          </a>
        </div>
      )}
    </motion.form>
  );
};

export default Result;
