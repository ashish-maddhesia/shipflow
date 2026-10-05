import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);
export async function buildDockerImage(repositoryPath, imageName) {
    console.log(`🐳 Building Docker image: ${imageName}`);
    console.log(`📁 Build context: ${repositoryPath}`);
    try {
        const { stdout, stderr } = await execFileAsync("docker", [
            "build",
            "-t",
            imageName,
            repositoryPath,
        ], {
            maxBuffer: 20 * 1024 * 1024,
        });
        if (stdout) {
            console.log(stdout);
        }
        if (stderr) {
            console.log(stderr);
        }
        console.log(`✅ Docker image built: ${imageName}`);
        return imageName;
    }
    catch (error) {
        console.error(`❌ Docker build failed: ${imageName}`);
        throw error;
    }
}
export async function waitForContainerHealth(healthUrl, timeoutMs = 60000, intervalMs = 3000) {
    console.log(`🏥 Health checking: ${healthUrl}`);
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            const response = await fetch(healthUrl);
            if (response.ok) {
                console.log("💚 Health check passed");
                return true;
            }
            console.log(`⚠️ Health check returned ${response.status}`);
        }
        catch {
            console.log("⏳ Application is not ready yet...");
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    console.error("❌ Health check timed out");
    return false;
}
