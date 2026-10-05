import fs from "fs/promises";
import path from "path";
async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function detectProject(repositoryPath) {
    console.log(`🔍 Detecting project: ${repositoryPath}`);
    const hasDockerfile = await exists(path.join(repositoryPath, "Dockerfile"));
    // -------------------------
    // Node.js
    // -------------------------
    const packageJsonPath = path.join(repositoryPath, "package.json");
    if (await exists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
        let packageManager = null;
        if (await exists(path.join(repositoryPath, "pnpm-lock.yaml"))) {
            packageManager = "pnpm";
        }
        else if (await exists(path.join(repositoryPath, "yarn.lock"))) {
            packageManager = "yarn";
        }
        else if (await exists(path.join(repositoryPath, "bun.lockb")) ||
            await exists(path.join(repositoryPath, "bun.lock"))) {
            packageManager = "bun";
        }
        else if (await exists(path.join(repositoryPath, "package-lock.json"))) {
            packageManager = "npm";
        }
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        const isNextJs = Boolean(dependencies["next"]);
        const monorepo = (await exists(path.join(repositoryPath, "pnpm-workspace.yaml"))) ||
            (await exists(path.join(repositoryPath, "turbo.json"))) ||
            Array.isArray(packageJson.workspaces);
        const projectType = isNextJs
            ? "nextjs"
            : "node";
        console.log(`📦 Project type: ${projectType}`);
        console.log(`📦 Package manager: ${packageManager}`);
        console.log(`📦 Monorepo: ${monorepo}`);
        console.log(`🐳 Dockerfile: ${hasDockerfile}`);
        return {
            type: projectType,
            packageManager,
            monorepo,
            hasDockerfile,
        };
    }
    // -------------------------
    // Go
    // -------------------------
    if (await exists(path.join(repositoryPath, "go.mod"))) {
        console.log("🐹 Go project detected");
        return {
            type: "go",
            packageManager: null,
            monorepo: false,
            hasDockerfile,
        };
    }
    // -------------------------
    // Python
    // -------------------------
    if ((await exists(path.join(repositoryPath, "requirements.txt"))) ||
        (await exists(path.join(repositoryPath, "pyproject.toml")))) {
        console.log("🐍 Python project detected");
        return {
            type: "python",
            packageManager: null,
            monorepo: false,
            hasDockerfile,
        };
    }
    // -------------------------
    // Rust
    // -------------------------
    if (await exists(path.join(repositoryPath, "Cargo.toml"))) {
        console.log("🦀 Rust project detected");
        return {
            type: "rust",
            packageManager: null,
            monorepo: false,
            hasDockerfile,
        };
    }
    console.log("❓ Unknown project");
    return {
        type: "unknown",
        packageManager: null,
        monorepo: false,
        hasDockerfile,
    };
}
