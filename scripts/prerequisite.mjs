import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import readline from "readline";

function checkCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function detectContainerEngine() {
  let engine = null;
  let compose = null;

  if (checkCommand("docker") && checkCommand("docker-compose")) {
    engine = "docker";
    compose = "docker-compose";
  } else if (checkCommand("podman") && checkCommand("podman-compose")) {
    engine = "podman";
    compose = "podman-compose";
  } else {
    console.error("Error: Neither Docker+Compose nor Podman+Podman-Compose found.");
    process.exit(1);
  }

  console.log("Container engine detected:", engine);
  console.log("Compose tool detected:", compose);

  return { engine, compose };
}

function askQuestion(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function generateKeysIfNeeded() {
  const keysDir = path.join(process.cwd(), "keys");
  const privateKeyPath = path.join(keysDir, "private.key");
  const publicKeyPath = path.join(keysDir, "public.key");

  if (!fs.existsSync(keysDir) || !fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    const answer = await askQuestion("keys/ directory or keys missing. Generate new key pairs? (y/N): ");
    if (answer === "y") {
      try {
        execSync(`bun run ${path.join(__dirname, "./generate-keypair.mjs")}`, { stdio: "inherit" });
        console.log("Key pairs generated.");
      } catch (err) {
        console.error("Error generating keys:", err.message);
        process.exit(1);
      }
    } else {
      console.log("Skipping key generation. Exiting.");
      process.exit(1);
    }
  }

  try {
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    const publicKey = fs.readFileSync(publicKeyPath, "utf8");
    const message = "test";
    const signature = crypto.sign("RSA-SHA512", Buffer.from(message), privateKey);
    const verified = crypto.verify("RSA-SHA512", Buffer.from(message), publicKey, signature);
    if (!verified) throw new Error("Key verification failed");
    console.log("Keys are valid for RS512.");
  } catch (err) {
    console.error("Error: Keys are not suitable for RS512:", err.message);
    process.exit(1);
  }
}

async function runMigrations() {
  const answer = await askQuestion("Do you want to run database migrations? (y/N): ");
  if (answer === "y") {
    try {
      console.log("Running migrations...");
      execSync("bun run migrate:auth", { stdio: "inherit" });
      console.log("Migrations completed.");
    } catch (err) {
      console.error("Error running migrations:", err.message);
      process.exit(1);
    }
  } else {
    console.log("Skipping migrations.");
  }
}

async function main() {
  detectContainerEngine();
  await generateKeysIfNeeded();
  await runMigrations();
}

main();
