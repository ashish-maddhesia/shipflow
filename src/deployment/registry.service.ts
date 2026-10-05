import {
  execFile,
  spawn,
} from "child_process";

import {
  promisify,
} from "util";

const execFileAsync =
  promisify(execFile);

export type RegistryConfig = {
  registryUrl: string;
  username: string;
  password: string;
};

export async function loginToRegistry(
  registry: RegistryConfig
) {
  console.log(
    `🔐 Logging into registry: ${registry.registryUrl}`
  );

  return new Promise<void>(
    (resolve, reject) => {
      const docker =
        spawn("docker", [
          "login",
          registry.registryUrl,
          "-u",
          registry.username,
          "--password-stdin",
        ]);

      let stderr = "";

      docker.stderr.on(
        "data",
        (data) => {
          stderr += data.toString();
        }
      );

      docker.on(
        "error",
        reject
      );

      docker.on(
        "close",
        (code) => {
          if (code !== 0) {
            reject(
              new Error(
                `Docker login failed: ${stderr}`
              )
            );
            return;
          }

          console.log(
            `✅ Registry login successful`
          );

          resolve();
        }
      );

      docker.stdin.write(
        registry.password
      );

      docker.stdin.end();
    }
  );
}

export async function pushDockerImage(
  localImage: string,
  registryImage: string
) {
  console.log(
    `🏷️ Tagging image`
  );

  console.log(
    `${localImage} → ${registryImage}`
  );

  await execFileAsync(
    "docker",
    [
      "tag",
      localImage,
      registryImage,
    ]
  );

  console.log(
    `📤 Pushing ${registryImage}`
  );

  const {
    stdout,
    stderr,
  } = await execFileAsync(
    "docker",
    [
      "push",
      registryImage,
    ],
    {
      maxBuffer:
        20 * 1024 * 1024,
    }
  );

  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
  }

  console.log(
    `✅ Image pushed successfully`
  );

  return registryImage;
}

export function getRegistryImageName(
  registryUrl: string,
  username: string,
  repository: string,
  tag: string
) {
  const registry =
    registryUrl === "docker.io"
      ? ""
      : `${registryUrl}/`;

  return `${registry}${username}/${repository}:${tag}`;
}