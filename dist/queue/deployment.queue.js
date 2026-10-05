import { Queue } from "bullmq";
export const deploymentQueue = new Queue("deployment", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});
