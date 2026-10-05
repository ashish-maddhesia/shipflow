import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "../lib/db.js";
import { users } from "../db/schema.js";
import { generateToken } from "../lib/jwt.js";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      role: "DEVELOPER",
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return user;
}

export async function loginUser(
  email: string,
  password: string
) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = result[0];

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getUserById(
  userId: string
) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] ?? null;
}