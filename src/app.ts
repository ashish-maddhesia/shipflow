import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./auth/auth.routes.js";
import organizationRoutes from "./organization/organization.routes.js";
import memberRoutes from "./organization/member.routes.js";
import projectRoutes from "./project/project.routes.js";
import projectMemberRoutes from "./project/project-member.routes.js";
import environmentRoutes from "./environment/environment.routes.js";
import serviceRoutes from "./project/service.routes.js";
import deploymentRoutes from "./project/deployment.routes.js";
import serviceEnvironmentRoutes from "./project/service-environment.routes.js";
import registryRoutes from "./deployment/registry.routes.js";
import serverRoutes from "./server/server.routes.js";
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  "/api",
  serviceEnvironmentRoutes
);



app.use(
  "/api",
  registryRoutes
);
// Middleware MUST come before routes
app.use(express.json());
app.use(cookieParser());

// Server management
app.use(
  "/api/servers",
  serverRoutes
);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "ShipFlow backend is running",
  });
});

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Organizations
app.use(
  "/api/organizations",
  organizationRoutes
);

// Organization members
app.use(
  "/api/organizations",
  memberRoutes
);

// Projects
app.use(
  "/api",
  projectRoutes
);

app.use(
  "/api",
  projectMemberRoutes
);

app.use(
  "/api",
  environmentRoutes
);
app.use(
  "/api",
  serviceRoutes
);
app.use(
  "/api",
  deploymentRoutes
);
app.use(
  "/api",
  serviceEnvironmentRoutes
);

export default app;