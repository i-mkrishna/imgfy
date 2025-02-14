import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const userAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - No token provided",
        });
    }
    console.log("header in auth", req.headers.authorization);
    const token = authHeader.split(" ")[1];
    console.log(token);



    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Invalid token",
            });
        }
        console.log("user id in userAuth", decoded)
        console.log("user id in userAuth decoded_id", decoded._id)

        req.userId = decoded._id;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Token verification failed",
        });
    }
};

export default userAuth;
