import { detectProject } from "./project-detector.service";
import { generateDockerfile } from "./dockerfile.service";
import { buildDockerImage } from "./docker.service";

export async function dockerizeDeployment(
  repositoryPath: string,
  imageName: string
): Promise<string> {
  console.log("🚀 Starting Dockerization");

  const project = await detectProject(repositoryPath);

  await generateDockerfile(
    repositoryPath,
    project
  );

  const image = await buildDockerImage(
    repositoryPath,
    imageName
  );

  console.log(
    `🎉 Dockerization completed: ${image}`
  );

  return image;
}
