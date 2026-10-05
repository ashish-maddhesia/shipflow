import { pgEnum, pgTable, text, timestamp, unique, } from "drizzle-orm/pg-core";
/*
 * =========================================================
 * ENUMS
 * =========================================================
 */
export const roleEnum = pgEnum("role", [
    "ADMIN",
    "DEVELOPER",
    "DEVOPS_ENGINEER",
    "MANAGER",
    "VIEWER",
]);
export const environmentTypeEnum = pgEnum("environment_type", [
    "DEVELOPMENT",
    "STAGING",
    "PRODUCTION",
]);
export const deploymentStatusEnum = pgEnum("deployment_status", [
    "PENDING",
    "QUEUED",
    "BUILDING",
    "DEPLOYING",
    "SUCCESS",
    "FAILED",
]);
export const registryTypeEnum = pgEnum("registry_type", [
    "DOCKER_HUB",
    "GHCR",
    "ECR",
]);
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
export const organizations = pgTable("organizations", {
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
});
/*
 * =========================================================
 * ORGANIZATION MEMBERS
 * =========================================================
 */
export const organizationMembers = pgTable("organization_members", {
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
}, (table) => ({
    uniqueMember: unique().on(table.organizationId, table.userId),
}));
/*
 * =========================================================
 * REGISTRIES
 * =========================================================
 *
 * Container registry configuration for an organization.
 *
 * Supported:
 *
 * Docker Hub
 * GHCR
 * ECR
 *
 */
export const registries = pgTable("registries", {
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
     * Temporary development implementation.
     *
     * Later replace this with encrypted
     * credentials / secret references.
     */
    password: text("password")
        .notNull(),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
});
/*
 * =========================================================
 * PROJECTS
 * =========================================================
 */
export const projects = pgTable("projects", {
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
});
/*
 * =========================================================
 * PROJECT MEMBERS
 * =========================================================
 */
export const projectMembers = pgTable("project_members", {
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
}, (table) => ({
    uniqueMember: unique().on(table.projectId, table.userId),
}));
/*
 * =========================================================
 * ENVIRONMENTS
 * =========================================================
 */
export const environments = pgTable("environments", {
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
});
/*
 * =========================================================
 * SERVICES
 * =========================================================
 */
export const services = pgTable("services", {
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
});
/*
 * =========================================================
 * SERVICE ENVIRONMENTS
 * =========================================================
 */
export const serviceEnvironments = pgTable("service_environments", {
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
}, (table) => ({
    uniqueServiceEnvironment: unique().on(table.serviceId, table.environmentId),
}));
/*
 * =========================================================
 * DEPLOYMENTS
 * =========================================================
 */
export const deployments = pgTable("deployments", {
    id: text("id")
        .primaryKey(),
    serviceEnvironmentId: text("service_environment_id")
        .notNull()
        .references(() => serviceEnvironments.id),
    status: deploymentStatusEnum("status")
        .notNull()
        .default("PENDING"),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
});
