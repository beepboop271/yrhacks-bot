import { Client, Message } from "discord.js";
import fs from "fs";

import { Command } from "./command";
import { config } from "./config";

const bot = new Client();
const commands: Map<string, (msg: Message, args: string[]) => void> = new Map();

for (const file of fs.readdirSync("dist/commands")) {
  if (file.endsWith(".js")) {
    // tslint:disable-next-line: no-unsafe-any
    const command: Command = (await import(`./commands/${file}`)).command;
    commands.set(command.name, command.execute.bind(undefined, bot));
  }
}

bot.on("message", (msg): void => {
  if (msg.author.bot) {
    return;
  }
  if (msg.guild === null) {
    return;
  }

  if (!msg.content.startsWith(config.prefix)) {
    return;
  }

  const args = msg.content.substring(config.prefix.length).split(/\s+/g);
  if (args.length < 1) {
    return;
  }
  const command = commands.get(args[0]);
  if (command === undefined) {
    return;
  }
  command(msg, args);
});

bot.on("ready", (): void => {
  console.log("logged in");
});

await bot.login(process.env.DISCORD_BOT_TOKEN);
