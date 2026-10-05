import { eq, and } from "drizzle-orm";

import { db } from "../lib/db.js";
import {
  organizationMembers,
  users,
} from "../db/schema.js";

export async function addMember(
  organizationId: string,
  userId: string,
  role:
    | "ADMIN"
    | "DEVELOPER"
    | "DEVOPS_ENGINEER"
    | "MANAGER"
    | "VIEWER"
) {
  const existingMember = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(
          organizationMembers.organizationId,
          organizationId
        ),
        eq(
          organizationMembers.userId,
          userId
        )
      )
    )
    .limit(1);

  if (existingMember.length > 0) {
    throw new Error(
      "User is already a member of this organization"
    );
  }

  const [member] = await db
    .insert(organizationMembers)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      userId,
      role,
    })
    .returning();

  return member;
}

export async function getMembers(
  organizationId: string
) {
  return await db
    .select({
      id: organizationMembers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: organizationMembers.role,
      createdAt: organizationMembers.createdAt,
    })
    .from(organizationMembers)
    .innerJoin(
      users,
      eq(
        organizationMembers.userId,
        users.id
      )
    )
    .where(
      eq(
        organizationMembers.organizationId,
        organizationId
      )
    );
}