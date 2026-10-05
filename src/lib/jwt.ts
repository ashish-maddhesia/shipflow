
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

const secret: string = JWT_SECRET;

export interface JwtPayload {
    userId: string;
}

export function generateToken(userId: string): string {
    return jwt.sign(
        { userId },
        secret,
        {
            expiresIn: 60 * 60 * 24 * 7,
        }
    );
}

export function verifyToken(token: string): JwtPayload {
    const payload = jwt.verify(
        token,
        secret
    );

    if (
        typeof payload !== "object" ||
        payload === null ||
        typeof payload.userId !== "string"
    ) {
        throw new Error("Invalid token payload");
    }

    return {
        userId: payload.userId,
    };
}
