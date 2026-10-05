import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
const execFileAsync = promisify(execFile);
const DEPLOYMENT_WORKSPACE = process.env.DEPLOYMENT_WORKSPACE ||
    "/tmp/shipflow-deployments";
export async function cloneRepository(repositoryUrl, deploymentId, branch = "main") {
    const deploymentPath = path.join(DEPLOYMENT_WORKSPACE, deploymentId);
    await fs.mkdir(DEPLOYMENT_WORKSPACE, { recursive: true });
    // Clean existing workspace
    await fs.rm(deploymentPath, {
        recursive: true,
        force: true,
    });
    console.log(`📥 Cloning repository: ${repositoryUrl}`);
    console.log(`🌿 Branch: ${branch}`);
    await execFileAsync("git", [
        "clone",
        "--branch",
        branch,
        "--depth",
        "1",
        repositoryUrl,
        deploymentPath,
    ], {
        maxBuffer: 10 * 1024 * 1024,
    });
    console.log(`✅ Repository cloned: ${deploymentPath}`);
    return deploymentPath;
}
