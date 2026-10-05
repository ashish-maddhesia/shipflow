export const roles = [
  "ADMIN",
  "DEVELOPER",
  "DEVOPS_ENGINEER",
  "MANAGER",
  "VIEWER",
] as const;

export type Role = (typeof roles)[number];