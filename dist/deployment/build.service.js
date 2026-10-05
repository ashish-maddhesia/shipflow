import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
const execFileAsync = promisify(execFile);
export async function buildRepository(repositoryPath) {
    console.log(`🔨 Starting build: ${repositoryPath}`);
    const packageJsonPath = path.join(repositoryPath, "package.json");
    try {
        await fs.access(packageJsonPath);
    }
    catch {
        throw new Error("package.json not found in repository");
    }
    let packageManager = "npm";
    try {
        await fs.access(path.join(repositoryPath, "pnpm-lock.yaml"));
        packageManager = "pnpm";
    }
    catch {
        try {
            await fs.access(path.join(repositoryPath, "yarn.lock"));
            packageManager = "yarn";
        }
        catch {
            packageManager = "npm";
        }
    }
    console.log(`📦 Package manager: ${packageManager}`);
    const installCommand = packageManager === "pnpm"
        ? "pnpm"
        : packageManager === "yarn"
            ? "yarn"
            : "npm";
    const installArgs = packageManager === "pnpm"
        ? ["install", "--frozen-lockfile"]
        : packageManager === "yarn"
            ? ["install", "--frozen-lockfile"]
            : ["ci"];
    console.log(`📥 Installing dependencies...`);
    await execFileAsync(installCommand, installArgs, {
        cwd: repositoryPath,
        maxBuffer: 20 * 1024 * 1024,
    });
    console.log(`✅ Dependencies installed`);
    const prismaSchemaPath = path.join(repositoryPath, "prisma", "schema.prisma");
    try {
        await fs.access(prismaSchemaPath);
        console.log("🧬 Prisma schema detected");
        console.log("⚙️ Generating Prisma client...");
        await execFileAsync("pnpm", ["prisma", "generate"], {
            cwd: repositoryPath,
            maxBuffer: 20 * 1024 * 1024,
        });
        console.log("✅ Prisma client generated");
    }
    catch {
        console.log("ℹ️ No Prisma schema detected, skipping Prisma generation");
    }
    console.log(`🏗️ Running build...`);
    const buildArgs = packageManager === "yarn"
        ? ["build"]
        : ["run", "build"];
    await execFileAsync(installCommand, buildArgs, {
        cwd: repositoryPath,
        maxBuffer: 20 * 1024 * 1024,
    });
    console.log(`✅ Build completed`);
    return {
        success: true,
        repositoryPath,
        packageManager,
    };
}
