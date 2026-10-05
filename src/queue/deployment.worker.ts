import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";



const execFileAsync = promisify(execFile);

export async function buildDockerImage(
  repositoryPath: string,
  imageName: string
) {
  const dockerfilePath = path.join(
    repositoryPath,
    "Dockerfile"
  );

  try {
    await fs.access(dockerfilePath);
  } catch {
    throw new Error(
      `Dockerfile not found in ${repositoryPath}`
    );
  }

  console.log(
    `🐳 Building Docker image: ${imageName}`
  );

  console.log(
    `📁 Build context: ${repositoryPath}`
  );

  await execFileAsync(
    "docker",
    [
      "build",
      "-t",
      imageName,
      repositoryPath,
    ],
    {
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  console.log(
    `✅ Docker image built: ${imageName}`
  );

  return imageName;
}


/*
 * =========================
 * RUN CONTAINER
 * =========================
 */

export async function runDockerContainer(
  imageName: string,
  containerName: string,
  hostPort: number,
  containerPort: number
) {
  console.log(
    `🚀 Starting container: ${containerName}`
  );

  /*
   * Remove an old container with
   * the same name if it exists.
   */

  try {
    await execFileAsync(
      "docker",
      [
        "rm",
        "-f",
        containerName,
      ]
    );
  } catch {
    // Container probably doesn't exist.
  }

  const {
    stdout,
  } = await execFileAsync(
    "docker",
    [
      "run",
      "-d",

      "--name",
      containerName,

      "-p",
      `${hostPort}:${containerPort}`,

      imageName,
    ],
    {
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  const containerId =
    stdout.trim();

  console.log(
    `✅ Container started: ${containerId}`
  );

  console.log(
    `🌐 Port mapping: ${hostPort}:${containerPort}`
  );

  return containerId;
}


/*
 * =========================
 * CONTAINER HEALTH
 * =========================
 */

export async function waitForContainerHealth(
  containerName: string,
  healthUrl: string,
  retries = 30,
  delayMs = 2000
) {
  console.log(
    `❤️ Waiting for container health...`
  );

  console.log(
    `🔎 Health URL: ${healthUrl}`
  );

  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
    try {
      const {
        stdout,
      } = await execFileAsync(
        "curl",
        [
          "-f",
          "--max-time",
          "3",
          healthUrl,
        ]
      );

      console.log(
        `❤️ Health check passed`
      );

      return {
        healthy: true,
        response: stdout,
      };

    } catch {
      console.log(
        `⏳ Health check ${attempt}/${retries} failed`
      );

      /*
       * Make sure the container hasn't
       * already crashed.
       */

      try {
        const {
          stdout,
        } = await execFileAsync(
          "docker",
          [
            "inspect",
            "-f",
            "{{.State.Status}}",
            containerName,
          ]
        );

        const state =
          stdout.trim();

        if (
          state === "exited" ||
          state === "dead"
        ) {
          throw new Error(
            `Container stopped unexpectedly: ${state}`
          );
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes(
            "Container stopped"
          )
        ) {
          throw error;
        }
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            delayMs
          )
      );
    }
  }

  throw new Error(
    `Container health check failed after ${retries} attempts`
  );
}


/*
 * =========================
 * GET CONTAINER LOGS
 * =========================
 */

export async function getContainerLogs(
  containerName: string,
  tail = 100
) {
  console.log(
    `📋 Fetching logs: ${containerName}`
  );

  const {
    stdout,
    stderr,
  } = await execFileAsync(
    "docker",
    [
      "logs",
      "--tail",
      String(tail),
      containerName,
    ],
    {
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  const logs =
    `${stdout}${stderr}`.trim();

  console.log(
    `📋 Container logs retrieved`
  );

  return logs;
}


/*
 * =========================
 * STOP CONTAINER
 * =========================
 */

export async function stopDockerContainer(
  containerName: string
) {
  console.log(
    `🛑 Stopping container: ${containerName}`
  );

  try {
    await execFileAsync(
      "docker",
      [
        "rm",
        "-f",
        containerName,
      ]
    );

    console.log(
      `✅ Container removed`
    );
  } catch {
    console.log(
      `ℹ️ Container already stopped or removed`
    );
  }
}