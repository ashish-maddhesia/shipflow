import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);
/**
 * Run a Docker container from an image.
 */
/**
 * Check whether a container is running.
 */
export async function isContainerRunning(containerName) {
    try {
        const { stdout } = await execFileAsync("docker", [
            "inspect",
            "-f",
            "{{.State.Running}}",
            containerName,
        ], {
            maxBuffer: 10 * 1024 * 1024,
        });
        return stdout.trim() === "true";
    }
    catch {
        return false;
    }
}
/**
 * Stop and remove a container.
 */
export async function stopDockerContainer(containerName) {
    console.log(`🛑 Stopping container: ${containerName}`);
    await execFileAsync("docker", [
        "rm",
        "-f",
        containerName,
    ], {
        maxBuffer: 10 * 1024 * 1024,
    }).catch(() => {
        // Container may already be gone.
    });
    console.log(`🗑️ Container removed: ${containerName}`);
}
export async function runDockerContainer(imageName, containerName, port) {
    console.log(`🚀 Starting container: ${containerName}`);
    await execFileAsync("docker", [
        "run",
        "-d",
        "--name",
        containerName,
        "-p",
        `${port}:${port}`,
        imageName,
    ], {
        maxBuffer: 20 * 1024 * 1024,
    });
    console.log(`✅ Container started: ${containerName}`);
    return containerName;
}
