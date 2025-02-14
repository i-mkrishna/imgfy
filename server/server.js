import express from 'express';
import cors from 'cors';
import connectDb from './config/mongodb.js';
import userRouter from './routes/userRoutes.js';
import dotenv from "dotenv";
import imageRouter from './routes/imageRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 8000; // Use default 8000 if PORT is not set

const app = express();
app.use(cors());
app.use(express.json()); // Added missing parentheses

// Connect to the database
connectDb()
    .then(() => {
        console.log("Database connected successfully");
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
    });

app.use('/api/user', userRouter);
app.use('/api/image', imageRouter);

app.get('/', (req, res) => {
    console.log("Request received");
    res.send("Working good");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
