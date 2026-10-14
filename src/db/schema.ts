import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  integer,
} from "drizzle-orm/pg-core";

/*
 * =========================================================
 * ENUMS
 * =========================================================
 */

/*
 * User / organization / project roles
 */
export const roleEnum = pgEnum("role", [
  "ADMIN",
  "DEVELOPER",
  "DEVOPS_ENGINEER",
  "MANAGER",
  "VIEWER",
]);


export const serverConnectionStatusEnum = pgEnum(
  "server_connection_status",
  ["PENDING", "READY", "ERROR"]
);

/*
 * Environment types
 */
export const environmentTypeEnum = pgEnum(
  "environment_type",
  [
    "DEVELOPMENT",
    "STAGING",
    "PRODUCTION",
  ]
);

/*
 * Deployment lifecycle
 */
export const deploymentStatusEnum = pgEnum(
  "deployment_status",
  [
    "PENDING",
    "QUEUED",
    "BUILDING",
    "DEPLOYING",
    "SUCCESS",
    "FAILED",
  ]
);

/*
 * Container registry providers
 */
export const registryTypeEnum = pgEnum(
  "registry_type",
  [
    "DOCKER_HUB",
    "GHCR",
    "ECR",
  ]
);

/*
 * =========================================================
 * USERS
 * =========================================================
 */

export const users = pgTable("users", {
  id: text("id")
    .primaryKey(),

  name: text("name")
    .notNull(),

  email: text("email")
    .notNull()
    .unique(),

  passwordHash: text("password_hash")
    .notNull(),

  role: roleEnum("role")
    .notNull()
    .default("DEVELOPER"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/*
 * =========================================================
 * ORGANIZATIONS
 * =========================================================
 */

export const organizations = pgTable(
  "organizations",
  {
    id: text("id")
      .primaryKey(),

    name: text("name")
      .notNull(),

    slug: text("slug")
      .notNull()
      .unique(),

    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);

/*
 * =========================================================
 * ORGANIZATION MEMBERS
 * =========================================================
 */

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: text("id")
      .primaryKey(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),

    userId: text("user_id")
      .notNull()
      .references(() => users.id),

    role: roleEnum("role")
      .notNull()
      .default("VIEWER"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    uniqueMember: unique().on(
      table.organizationId,
      table.userId
    ),
  })
);

/*
 * =========================================================
 * REGISTRIES
 * =========================================================
 *
 * Each organization can configure one or more
 * container registries.
 *
 * Examples:
 *
 * Docker Hub
 * GHCR
 * AWS ECR
 *
 */

export const registries = pgTable(
  "registries",
  {
    id: text("id")
      .primaryKey(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),

    name: text("name")
      .notNull(),

    type: registryTypeEnum("type")
      .notNull(),

    registryUrl: text("registry_url")
      .notNull()
      .default("docker.io"),

    username: text("username")
      .notNull(),

    /*
     * Development implementation.
     *
     * Later we should replace this with
     * encrypted credentials / secret references.
     */
    password: text("password")
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);

/*
 * =========================================================
 * PROJECTS
 * =========================================================
 */

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),

    name: text("name")
      .notNull(),

    description: text("description"),

    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);

/*
 * =========================================================
 * PROJECT MEMBERS
 * =========================================================
 */

export const projectMembers = pgTable(
  "project_members",
  {
    id: text("id")
      .primaryKey(),

    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),

    userId: text("user_id")
      .notNull()
      .references(() => users.id),

    role: roleEnum("role")
      .notNull()
      .default("VIEWER"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    uniqueMember: unique().on(
      table.projectId,
      table.userId
    ),
  })
);

/*
 * =========================================================
 * ENVIRONMENTS
 * =========================================================
 */

export const environments = pgTable(
  "environments",
  {
    id: text("id")
      .primaryKey(),

    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),

    name: text("name")
      .notNull(),

    slug: text("slug")
      .notNull(),

    type: environmentTypeEnum("type")
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);

/*
 * =========================================================
 * SERVICES
 * =========================================================
 */

export const services = pgTable(
  "services",
  {
    id: text("id")
      .primaryKey(),

    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),

    name: text("name")
      .notNull(),

    slug: text("slug")
      .notNull(),

    description: text("description"),

    repositoryUrl: text("repository_url"),

    branch: text("branch")
      .notNull()
      .default("main"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);

/*
 * =========================================================
 * SERVICE ENVIRONMENTS
 * =========================================================
 *
 * Connects a service to an environment.
 *
 * Example:
 *
 * Service
 *    ↓
 * Development
 *
 */

export const serviceEnvironments = pgTable(
  "service_environments",
  {
    id: text("id")
      .primaryKey(),

    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),

    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    uniqueServiceEnvironment: unique().on(
      table.serviceId,
      table.environmentId
    ),
  })
);

/*
 * =========================================================
 * DEPLOYMENTS
 * =========================================================
 *
 * A deployment belongs to a specific
 * service environment.
 *
 * Example:
 *
 * Service
 *    ↓
 * Environment
 *    ↓
 * Deployment
 *
 */

export const deployments = pgTable(
  "deployments",
  {
    id: text("id")
      .primaryKey(),

    serviceEnvironmentId: text(
      "service_environment_id"
    )
      .notNull()
      .references(
        () => serviceEnvironments.id
      ),

    serverId: text("server_id")
      .references(() => servers.id),

    status: deploymentStatusEnum("status")
      .notNull()
      .default("PENDING"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);


/*
 * =========================================================
 * DEPLOYMENT SERVERS
 * =========================================================
 */

export const servers = pgTable("servers", {
  id: text("id")
    .primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),

  name: text("name")
    .notNull(),

  host: text("host")
    .notNull(),

  port: integer("port")
    .notNull()
    .default(22),

  username: text("username")
    .notNull(),

  // AES-256-GCM encrypted SSH private key.
  // Never return this field in API responses.
  encryptedPrivateKey: text("encrypted_private_key")
    .notNull(),

  // Optional encrypted SSH key passphrase.
  encryptedPassphrase: text("encrypted_passphrase"),

  // Fingerprint of the trusted SSH host key.
  // Must be verified before connecting.
  hostKeyFingerprint: text("host_key_fingerprint"),

  status: serverConnectionStatusEnum("status")
    .notNull()
    .default("PENDING"),

  lastConnectedAt: timestamp("last_connected_at"),

  lastError: text("last_error"),

  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});



