import { spawnSync } from "bun";
import os from "os";
import type { CommandPayloadDTO } from "./types";
import chalk from "chalk";

const INTERVAL = 5000;
const API_BASE_URL = "http://localhost:7789/api/tools/seoul";

function getSystemInfo() {
  const phpVersion = spawnSync(["php", "-v"]).stdout.toString().split("\n")[0];
  const osVersion = `${os.type()} ${os.release()}`;
  const ipAddress = spawnSync(["curl", "icanhazip.com"])
    .stdout.toString()
    .trim();

  return {
    phpVersion,
    osVersion,
    ipAddress,
  };
}

async function pingServer() {
  const systemInfo = getSystemInfo();

  await fetch(`${API_BASE_URL}/node-info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(systemInfo),
  });
}

async function getRemoteCommand() {
  const response = await fetch(`${API_BASE_URL}/remote-command`);
  const payload = (await response.json()) as CommandPayloadDTO;
  const command = payload.command;
  if (command) {
    const commandArr = command.split(" "); // TODO: Add handling for when commands come with strings that are seperated by spaces
    const process =  spawnSync(commandArr)
    const stdout = process.stdout.toString();
    const stderr = process.stderr.toString();
    console.log(chalk.greenBright(stdout ? stdout : stderr));
    console.log(chalk.yellowBright('ABOVE OUTPUT from command:', command))
    
    
    await fetch(`${API_BASE_URL}/remote-command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        commandRan: command,
        output: stdout ? stdout : stderr,
        error: stderr ? 'True' : 'False', 
      }),
    });
  }
}
function runClient() {
  setInterval(async () => {
    await pingServer();
    await getRemoteCommand();
  }, INTERVAL);
}

runClient();