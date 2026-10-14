import { verifyToken } from "../lib/jwt.js";
import { getUserById } from "./auth.service.js";
export async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.token;
        console.log("COOKIE DEBUG:", {
            path: req.path,
            cookies: req.cookies,
            cookieHeader: req.headers.cookie,
        });
        console.log("AUTH DEBUG:", {
            path: req.path,
            method: req.method,
            hasToken: !!token,
        });
        if (!token) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const payload = verifyToken(token);
        console.log("AUTH PAYLOAD:", {
            userId: payload.userId,
        });
        const user = await getUserById(payload.userId);
        if (!user) {
            console.log("AUTH DEBUG: User not found");
            return res.status(401).json({
                message: "User not found",
            });
        }
        req.user = user;
        console.log("AUTH SUCCESS:", {
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        next();
    }
    catch (error) {
        console.error("AUTH DEBUG ERROR:", error);
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
