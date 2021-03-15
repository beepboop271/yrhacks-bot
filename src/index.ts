import { Client, Message } from "discord.js";
import fs from "fs";

import { Command } from "./command";

const bot = new Client();
const prefix: string = process.env.PREFIX!;
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

  console.log(msg);

  if (!msg.content.startsWith(prefix)) {
    return;
  }

  const args = msg.content.substring(prefix.length).split(/\s+/g);
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
