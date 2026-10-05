
import { dockerizeDeployment } from "../src/services/deployment.service.js";

const repositoryPath = process.argv[2];

if (!repositoryPath) {
    console.error(
        "❌ Please provide a repository path"
    );

    console.error(
        "Usage: npx tsx scripts/test-dockerization.ts /path/to/repository"
    );

    process.exit(1);
}

const imageName = "shipflow-test:latest";

async function main() {
    try {
        console.log("=================================");
        console.log("🚀 Shipflow Dockerization Test");
        console.log("=================================");

        console.log(`📁 Repository: ${repositoryPath}`);
        console.log(`🐳 Image: ${imageName}`);

        const image = await dockerizeDeployment(
            repositoryPath,
            imageName
        );

        console.log("=================================");
        console.log("🎉 SUCCESS");
        console.log(`🐳 Image: ${image}`);
        console.log("=================================");
    } catch (error) {
        console.error("=================================");
        console.error("❌ Dockerization failed");
        console.error(error);
        console.error("=================================");

        process.exit(1);
    }
}

main();
