import { Client } from "ssh2";
import { decryptSecret } from "./credentials.js";
function normalizeFingerprint(value) {
    return value
        .trim()
        .replace(/^SHA256:/i, "")
        .replace(/=+$/, "");
}
export async function testSSHConnection(options) {
    const expectedFingerprint = normalizeFingerprint(options.hostKeyFingerprint);
    if (!expectedFingerprint) {
        throw new Error("A trusted SHA-256 host fingerprint is required");
    }
    const privateKey = decryptSecret(options.encryptedPrivateKey);
    const passphrase = options.encryptedPassphrase
        ? decryptSecret(options.encryptedPassphrase)
        : undefined;
    const client = new Client();
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, result) => {
            if (settled)
                return;
            settled = true;
            client.end();
            if (error) {
                reject(error);
            }
            else {
                resolve(result ?? "");
            }
        };
        client.on("ready", () => {
            // Execute a fixed command; never interpolate user input.
            client.exec("docker --version && docker info --format '{{.ServerVersion}}'", (error, stream) => {
                if (error) {
                    finish(error);
                    return;
                }
                let stdout = "";
                let stderr = "";
                const timeout = setTimeout(() => {
                    stream.close();
                    finish(new Error("Docker readiness check timed out"));
                }, 10000);
                stream.on("data", (chunk) => {
                    stdout += chunk.toString();
                });
                stream.stderr.on("data", (chunk) => {
                    stderr += chunk.toString();
                });
                stream.on("close", (code) => {
                    clearTimeout(timeout);
                    if (code === 0) {
                        finish(undefined, stdout.trim());
                    }
                    else {
                        finish(new Error(stderr.trim() ||
                            `Docker readiness check failed (exit code ${code})`));
                    }
                });
            });
        });
        client.on("error", (error) => {
            finish(error);
        });
        client.on("close", () => {
            if (!settled) {
                finish(new Error("SSH connection closed before the readiness check completed"));
            }
        });
        client.connect({
            host: options.host,
            port: options.port,
            username: options.username,
            privateKey,
            ...(passphrase ? { passphrase } : {}),
            hostHash: "sha256",
            hostVerifier: (key) => {
                // ssh2 provides the hash when hostHash is configured.
                const actualHexHash = Buffer.isBuffer(key)
                    ? key.toString("hex")
                    : key;
                const actualFingerprint = Buffer.from(actualHexHash, "hex")
                    .toString("base64")
                    .replace(/=+$/, "");
                return actualFingerprint === expectedFingerprint;
            },
            readyTimeout: 10000,
            keepaliveInterval: 5000,
            keepaliveCountMax: 2,
        });
    });
}
/**
 * Execute a remote command over SSH after verifying the trusted
 * SHA-256 host fingerprint. Only pass commands constructed by
 * trusted application code, never raw user-provided shell text.
 */
export async function runSSHCommand(options, command) {
    if (!command.trim()) {
        throw new Error("Remote command cannot be empty");
    }
    const expectedFingerprint = normalizeFingerprint(options.hostKeyFingerprint);
    if (!expectedFingerprint) {
        throw new Error("A trusted SHA-256 host fingerprint is required");
    }
    const privateKey = decryptSecret(options.encryptedPrivateKey);
    const passphrase = options.encryptedPassphrase
        ? decryptSecret(options.encryptedPassphrase)
        : undefined;
    const client = new Client();
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, result) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            client.end();
            if (error)
                reject(error);
            else
                resolve(result ?? "");
        };
        const timeout = setTimeout(() => {
            finish(new Error("Remote SSH command timed out"));
        }, 120000);
        client.on("ready", () => {
            client.exec(command, (error, stream) => {
                if (error) {
                    finish(error);
                    return;
                }
                let stdout = "";
                let stderr = "";
                stream.on("data", (chunk) => {
                    stdout += chunk.toString();
                });
                stream.stderr.on("data", (chunk) => {
                    stderr += chunk.toString();
                });
                stream.on("close", (code) => {
                    if (code === 0) {
                        finish(undefined, stdout.trim());
                    }
                    else {
                        finish(new Error(stderr.trim() ||
                            "Remote command failed with exit code " + code));
                    }
                });
            });
        });
        client.on("error", (error) => finish(error));
        client.on("close", () => {
            if (!settled) {
                finish(new Error("SSH connection closed unexpectedly"));
            }
        });
        client.connect({
            host: options.host,
            port: options.port,
            username: options.username,
            privateKey,
            ...(passphrase ? { passphrase } : {}),
            hostHash: "sha256",
            hostVerifier: (key) => {
                const actualHexHash = Buffer.isBuffer(key)
                    ? key.toString("hex")
                    : key;
                const actualFingerprint = Buffer.from(actualHexHash, "hex")
                    .toString("base64")
                    .replace(/=+$/, "");
                return actualFingerprint === expectedFingerprint;
            },
            readyTimeout: 10000,
            keepaliveInterval: 5000,
            keepaliveCountMax: 2,
        });
    });
}
;
