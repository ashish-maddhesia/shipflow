import {
  Response,
  NextFunction,
} from "express";

import {
  AuthRequest,
} from "./auth.middleware.js";

import {
  Permission,
  permissions,
} from "./permissions.js";

export function requirePermission(
  permission: Permission
) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userPermissions =
      permissions[req.user.role] as readonly Permission[];

    if (
      !userPermissions.includes(permission)
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to perform this action",
      });
    }

    next();
  };
}