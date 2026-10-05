import { access, writeFile } from "fs/promises";
import path from "path";
import type { ProjectInfo } from "./project-detector.service.js";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function generateDockerfile(
  repositoryPath: string,
  project: ProjectInfo
): Promise<string> {
  const dockerfilePath = path.join(repositoryPath, "Dockerfile");

  if (project.hasDockerfile) {
    console.log("🐳 Dockerfile already exists");
    return dockerfilePath;
  }

  console.log(`🐳 Generating Dockerfile for ${project.type}`);

  let dockerfile: string;

  switch (project.type) {
    case "node":
      dockerfile = generateNodeDockerfile(project);
      break;

    case "nextjs":
      dockerfile = generateNextDockerfile(project);
      break;

    case "go":
      dockerfile = generateGoDockerfile();
      break;

    case "python":
      dockerfile = generatePythonDockerfile();
      break;

    case "rust":
      dockerfile = generateRustDockerfile();
      break;

    default:
      throw new Error(
        `Cannot generate Dockerfile for project type: ${project.type}`
      );
  }

  await writeFile(dockerfilePath, dockerfile, "utf8");

  console.log(`✅ Dockerfile generated: ${dockerfilePath}`);

  return dockerfilePath;
}

function generateNodeDockerfile(
  project: ProjectInfo
): string {
  const installCommand = getInstallCommand(
    project.packageManager
  );

  const startCommand = getStartCommand(
    project.packageManager
  );

  return `FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN ${installCommand}

COPY . .

RUN npm run build

EXPOSE 3000

CMD ${startCommand}
`;
}

function generateNextDockerfile(
  project: ProjectInfo
): string {
  const installCommand = getInstallCommand(
    project.packageManager
  );

  return `FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN ${installCommand}

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
`;
}

function generateGoDockerfile(): string {
  return `FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o app .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/app .

EXPOSE 8080

CMD ["./app"]
`;
}

function generatePythonDockerfile(): string {
  return `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
`;
}

function generateRustDockerfile(): string {
  return `FROM rust:1.88-alpine AS builder

WORKDIR /app

RUN apk add --no-cache musl-dev

COPY Cargo.toml Cargo.lock* ./

COPY . .

RUN cargo build --release

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/target/release/app .

EXPOSE 8080

CMD ["./app"]
`;
}

function getInstallCommand(
  packageManager: ProjectInfo["packageManager"]
): string {
  switch (packageManager) {
    case "pnpm":
      return "corepack enable && pnpm install --frozen-lockfile";

    case "yarn":
      return "corepack enable && yarn install --frozen-lockfile";

    case "bun":
      return "bun install --frozen-lockfile";

    case "npm":
      return "npm ci";

    default:
      return "npm install";
  }
}

function getStartCommand(
  packageManager: ProjectInfo["packageManager"]
): string {
  switch (packageManager) {
    case "pnpm":
      return '["pnpm", "start"]';

    case "yarn":
      return '["yarn", "start"]';

    case "bun":
      return '["bun", "start"]';

    default:
      return '["npm", "start"]';
  }
}
