import { verifyToken } from "../lib/jwt.js";
import { getUserById } from "./auth.service.js";
export async function requireAuth(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const payload = verifyToken(token);
        const user = await getUserById(payload.userId);
        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }
        req.user = user;
        next();
    }
    catch {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
