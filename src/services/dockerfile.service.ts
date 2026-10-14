
import {
access,
readFile,
writeFile,
} from "fs/promises";

import path from "path";

import type { ProjectInfo } from "./project-detector.service.js";

type PackageJson = {
scripts?: Record<string, string>;
};

async function exists(filePath: string): Promise<boolean> {
try {
await access(filePath);
return true;
} catch {
return false;
}
}

async function readPackageJson(
repositoryPath: string
): Promise<PackageJson> {
const packagePath = path.join(
repositoryPath,
"package.json"
);

const content = await readFile(packagePath, "utf8");

return JSON.parse(content);
}

export async function generateDockerfile(
repositoryPath: string,
project: ProjectInfo
): Promise<string> {
const dockerfilePath = path.join(
repositoryPath,
"Dockerfile"
);

if (project.hasDockerfile || await exists(dockerfilePath)) {
console.log("🐳 Dockerfile already exists");
return dockerfilePath;
}

console.log(
`🐳 Generating Dockerfile for ${project.type}`
);

let dockerfile: string;

switch (project.type) {
case "node":
dockerfile = await generateNodeDockerfile(
repositoryPath,
project
);
break;

case "nextjs":
dockerfile = generateNextDockerfile(project);
break;

case "go":
dockerfile = generateGoDockerfile(project);
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

await writeFile(
dockerfilePath,
dockerfile,
"utf8"
);

console.log(
`✅ Dockerfile generated: ${dockerfilePath}`
);

return dockerfilePath;
}

async function generateNodeDockerfile(
repositoryPath: string,
project: ProjectInfo
): Promise<string> {
const packageJson = await readPackageJson(
repositoryPath
);

const scripts = packageJson.scripts ?? {};
const installCommand = getInstallCommand(
project.packageManager
);

let startCommand: string;
let port = 3000;

if (scripts.start) {
startCommand = '["npm", "start"]';
} else if (scripts.server) {
startCommand = '["npm", "run", "server"]';
} else if (scripts.dev) {
startCommand = '["npm", "run", "dev"]';
} else {
throw new Error(
"No start script found. Expected start, server, or dev."
);
}

// TodoMVC serves its application on port 8000.
const scriptText = Object.values(scripts).join(" ");

if (scriptText.includes("tests/server.js")) {
port = 8000;
}

let dockerfile = `FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN ${installCommand}

COPY . .
`;

if (scripts.build) {
dockerfile += `
RUN npm run build
`;

console.log(
"🔨 Build script detected: npm run build"
);
} else {
console.log(
"ℹ️ No build script found, skipping build step"
);
}

dockerfile += `
ENV PORT=${port}

EXPOSE ${port}

CMD ${startCommand}
`;

console.log(`🌐 Application port: ${port}`);
console.log(`▶️ Start command: ${startCommand}`);

return dockerfile;
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

function generateGoDockerfile(
project: ProjectInfo
): string {
// Do not guess which application to deploy.
if (project.monorepo) {
throw new Error(
"Multiple Go applications detected. Please specify a Go application entrypoint."
);
}

const entrypoint = project.entrypoint ?? ".";

const buildTarget =
entrypoint === "."
? "."
: `./${entrypoint}`;

console.log(
`🎯 Go build target: ${buildTarget}`
);

return `FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum* ./

RUN go mod download

COPY . .

RUN go build -o app ${buildTarget}

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/app ./
COPY --from=builder /app/ ./

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

COPY --from=builder /app/target/release/app ./

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
return "npm install";

default:
return "npm install";
}
}
