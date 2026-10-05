import { Router } from "express";

import { requireRole } from "./role.middleware.js";
import { requirePermission } from "./permission.middleware.js";


import {
  registerUser,
  loginUser,
} from "./auth.service.js";

import {
  requireAuth,
  AuthRequest,
} from "./auth.middleware.js";

const router = Router();


// ==========================
// REGISTER
// ==========================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters",
      });
    }

    const user = await registerUser(
      name.trim(),
      email.trim().toLowerCase(),
      password
    );

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Registration failed",
    });
  }
});


// ==========================
// LOGIN
// ==========================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const result = await loginUser(
      email.trim().toLowerCase(),
      password
    );

    res.cookie("token", result.token, {
      httpOnly: true,
      path: "/",

      secure:
        process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge:
        1000 * 60 * 60 * 24 * 7,
    });

    return res.json({
      message: "Login successful",
      user: result.user,
    });
  } catch (error) {
    return res.status(401).json({
      message:
        error instanceof Error
          ? error.message
          : "Login failed",
    });
  }
});


// ==========================
// CURRENT USER
// ==========================

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthRequest,
    res
  ) => {
    return res.json({
      user: req.user,
    });
  }
);


// ==========================
// LOGOUT
// ==========================

router.post(
  "/logout",
  requireAuth,
  async (_req, res) => {
    res.clearCookie("token");

    return res.json({
      message: "Logout successful",
    });
  }
);

router.get(
  "/developer-test",
  requireAuth,
  requireRole("DEVELOPER"),
  (_req, res) => {
    res.json({
      message: "Welcome Developer",
    });
  }
);

router.get(
  "/admin-test",
  requireAuth,
  requireRole("ADMIN"),
  (_req, res) => {
    res.json({
      message: "Welcome Admin",
    });
  }
);
router.get(
  "/permission/task-create",
  requireAuth,
  requirePermission("task:create"),
  (_req, res) => {
    return res.json({
      message: "You can create tasks",
    });
  }
);
router.get(
  "/permission/deployment-create",
  requireAuth,
  requirePermission("deployment:create"),
  (_req, res) => {
    return res.json({
      message: "You can create deployments",
    });
  }
);
export default router;