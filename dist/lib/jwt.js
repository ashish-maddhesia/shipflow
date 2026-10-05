import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}
const secret = JWT_SECRET;
export function generateToken(userId) {
    return jwt.sign({ userId }, secret, {
        expiresIn: 60 * 60 * 24 * 7,
    });
}
export function verifyToken(token) {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" ||
        payload === null ||
        typeof payload.userId !== "string") {
        throw new Error("Invalid token payload");
    }
    return {
        userId: payload.userId,
    };
}
