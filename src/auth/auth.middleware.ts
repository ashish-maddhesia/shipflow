import {
  Request,
  Response,
  NextFunction,
} from "express";

import { Role } from "./roles.js";
import { verifyToken } from "../lib/jwt.js";
import { getUserById } from "./auth.service.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const payload = verifyToken(token);

    const user = await getUserById(
      payload.userId
    );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}