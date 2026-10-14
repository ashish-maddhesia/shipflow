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
/**
 * Find Go applications by locating main.go files.
 *
 * Example:
 *
 * repository/
 * ├── go.mod
 * └── main.go
 *
 * returns:
 * [ "." ]
 *
 * Whereas:
 *
 * repository/
 * ├── go.mod
 * ├── api/main.go
 * └── worker/main.go
 *
 * returns:
 * [ "api", "worker" ]
 */
async function findGoEntrypoints(repositoryPath) {
    const results = [];
    async function walk(currentPath) {
        const entries = await fs.readdir(currentPath, {
            withFileTypes: true,
        });
        for (const entry of entries) {
            // Ignore directories that should never
            // be considered application source.
            if (entry.name === ".git" ||
                entry.name === "vendor" ||
                entry.name === "node_modules") {
                continue;
            }
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
                continue;
            }
            // We only care about Go application entrypoints.
            if (entry.name !== "main.go") {
                continue;
            }
            const relativeDir = path.relative(repositoryPath, path.dirname(fullPath));
            results.push(relativeDir === ""
                ? "."
                : relativeDir);
        }
    }
    await walk(repositoryPath);
    return results;
}
export async function detectProject(repositoryPath) {
    console.log(`🔍 Detecting project: ${repositoryPath}`);
    const hasDockerfile = await exists(path.join(repositoryPath, "Dockerfile"));
    // =========================================================
    // Node.js / Next.js
    // =========================================================
    const packageJsonPath = path.join(repositoryPath, "package.json");
    if (await exists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
        let packageManager = null;
        // -------------------------
        // Package manager detection
        // -------------------------
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
        // -------------------------
        // Dependencies
        // -------------------------
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        // -------------------------
        // Next.js detection
        // -------------------------
        const isNextJs = Boolean(dependencies["next"]);
        // -------------------------
        // Monorepo detection
        // -------------------------
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
    // =========================================================
    // Go
    // =========================================================
    if (await exists(path.join(repositoryPath, "go.mod"))) {
        console.log("🐹 Go project detected");
        const entrypoints = await findGoEntrypoints(repositoryPath);
        console.log(`🐹 Go entrypoints found: ${entrypoints.length}`);
        // -------------------------
        // Single Go application
        // -------------------------
        if (entrypoints.length === 1) {
            const entrypoint = entrypoints[0];
            console.log(`🎯 Go entrypoint: ${entrypoint}`);
            return {
                type: "go",
                packageManager: null,
                monorepo: false,
                hasDockerfile,
                entrypoint,
            };
        }
        // -------------------------
        // Multiple Go applications
        // -------------------------
        if (entrypoints.length > 1) {
            console.log("⚠️ Multiple Go applications detected");
            console.log(`📁 Candidates: ${entrypoints.join(", ")}`);
            return {
                type: "go",
                packageManager: null,
                monorepo: true,
                hasDockerfile,
            };
        }
        // -------------------------
        // Go project without main.go
        // -------------------------
        console.log("⚠️ Go module found but no main.go entrypoint detected");
        return {
            type: "go",
            packageManager: null,
            monorepo: false,
            hasDockerfile,
        };
    }
    // =========================================================
    // Python
    // =========================================================
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
    // =========================================================
    // Rust
    // =========================================================
    if (await exists(path.join(repositoryPath, "Cargo.toml"))) {
        console.log("🦀 Rust project detected");
        return {
            type: "rust",
            packageManager: null,
            monorepo: false,
            hasDockerfile,
        };
    }
    // =========================================================
    // Unknown
    // =========================================================
    console.log("❓ Unknown project");
    return {
        type: "unknown",
        packageManager: null,
        monorepo: false,
        hasDockerfile,
    };
}
