import { detectProject } from "./project-detector.service.js";
import { generateDockerfile } from "./dockerfile.service.js";
import { buildDockerImage } from "./docker.service.js";
export async function dockerizeDeployment(repositoryPath, imageName) {
    console.log("🚀 Starting Dockerization");
    const project = await detectProject(repositoryPath);
    console.log("📋 Project information:", project);
    await generateDockerfile(repositoryPath, project);
    const image = await buildDockerImage(repositoryPath, imageName);
    console.log(`🎉 Dockerization completed: ${image}`);
    return image;
}
