import { db } from "../lib/db.js";
import { environments } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function createEnvironment(
  projectId: string,
  name: string,
  slug: string,
  type: "DEVELOPMENT" | "STAGING" | "PRODUCTION"
) {
  const [environment] = await db
    .insert(environments)
    .values({
      id: randomUUID(),
      projectId,
      name,
      slug,
      type,
    })
    .returning();

  return environment;
}

export async function getEnvironments(
  projectId: string
) {
  return await db
    .select()
    .from(environments)
    .where(eq(environments.projectId, projectId));
}