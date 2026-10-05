import { eq } from "drizzle-orm";

import { db } from "../lib/db.js";

import {
  registries,
  organizations,
} from "../db/schema.js";

export async function createRegistry(
  organizationId: string,
  name: string,
  type: "DOCKER_HUB" | "GHCR" | "ECR",
  registryUrl: string,
  username: string,
  password: string
) {
  const [organization] =
    await db
      .select({
        id: organizations.id,
      })
      .from(organizations)
      .where(
        eq(
          organizations.id,
          organizationId
        )
      )
      .limit(1);

  if (!organization) {
    throw new Error(
      "Organization not found"
    );
  }

  const [registry] =
    await db
      .insert(registries)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        name,
        type,
        registryUrl,
        username,
        password,
      })
      .returning({
        id: registries.id,
        organizationId:
          registries.organizationId,
        name: registries.name,
        type: registries.type,
        registryUrl:
          registries.registryUrl,
        username: registries.username,
        createdAt:
          registries.createdAt,
      });

  return registry;
}

export async function getOrganizationRegistry(
  organizationId: string
) {
  const [registry] =
    await db
      .select()
      .from(registries)
      .where(
        eq(
          registries.organizationId,
          organizationId
        )
      )
      .limit(1);

  return registry ?? null;
}