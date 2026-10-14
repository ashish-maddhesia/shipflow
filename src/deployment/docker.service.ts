import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

export async function isContainerRunning(
  containerName: string
) {
  try {
    const { stdout } =
      await execFileAsync(
        "docker",
        [
          "inspect",
          "-f",
          "{{.State.Running}}",
          containerName,
        ],
        {
          maxBuffer: 10 * 1024 * 1024,
        }
      );

    return stdout.trim() === "true";
  } catch {
    return false;
  }
}


/**
 * Stop and remove a container.
 */
export async function stopDockerContainer(
  containerName: string
) {
  console.log(
    `🛑 Stopping container: ${containerName}`
  );

  await execFileAsync(
    "docker",
    [
      "rm",
      "-f",
      containerName,
    ],
    {
      maxBuffer: 10 * 1024 * 1024,
    }
  ).catch(() => {
    // Container may already be gone.
  });

  console.log(
    `🗑️ Container removed: ${containerName}`
  );
}

export async function runDockerContainer(
  imageName: string,
  containerName: string,
  hostPort: number,
  containerPort: number
) {
  console.log(
    `🚀 Starting Docker container: ${containerName}`
  );

  // Remove an existing container with the same name
  try {
    await execFileAsync("docker", [
      "rm",
      "-f",
      containerName,
    ]);
  } catch {
    // Container doesn't exist — that's fine
  }

  const { stdout, stderr } =
    await execFileAsync(
      "docker",
      [
        "run",
        "-d",
        "--name",
        containerName,
        "-p",
        `${hostPort}:${containerPort}`,
        "--restart",
        "unless-stopped",
        imageName,
      ],
      {
        maxBuffer: 20 * 1024 * 1024,
      }
    );

  if (stderr) {
    console.log(stderr);
  }

  const containerId =
    stdout.trim();

  console.log(
    `✅ Container started: ${containerId}`
  );

  return containerId;
}

export async function waitForContainerHealth(
  containerName: string,
  healthUrl: string,
  timeoutMs = 60000,
  intervalMs = 3000
) {
  console.log(
    `🏥 Health checking: ${healthUrl}`
  );

  const startTime = Date.now();

  while (
    Date.now() - startTime <
    timeoutMs
  ) {
    try {
      const response =
        await fetch(healthUrl);

      if (response.ok) {
        console.log(
          `💚 Health check passed`
        );

        return true;
      }

      console.log(
        `⚠️ Health check returned ${response.status}`
      );
    } catch {
      console.log(
        `⏳ Container not ready yet...`
      );
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          intervalMs
        )
    );
  }

  console.error(
    `❌ Health check timed out`
  );

  return false;
}
export async function getContainerLogs(
  containerName: string
) {
  try {
    const { stdout, stderr } =
      await execFileAsync(
        "docker",
        [
          "logs",
          "--tail",
          "100",
          containerName,
        ],
        {
          maxBuffer: 20 * 1024 * 1024,
        }
      );

    return {
      stdout,
      stderr,
    };
  } catch (error: any) {
    return {
      stdout:
        error?.stdout ?? "",
      stderr:
        error?.stderr ?? "",
    };
  }
}