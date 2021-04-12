import { Client, Message } from "discord.js";
import fs from "fs";

import { config } from "./config";

type CommandExecutor = (client: Client, msg: Message, args: string[]) => void;

export interface Command {
  name: string;
  execute: CommandExecutor;
}

const commands: Map<string, CommandExecutor> = new Map();

for (const file of await fs.promises.readdir("dist/commands")) {
  if (file.endsWith(".js")) {
    // tslint:disable-next-line: no-unsafe-any
    const command: Command = (await import(`./commands/${file}`)).command;
    commands.set(command.name, command.execute);
  }
}

export const registerCommands = (bot: Client): void => {
  bot.on("message", (msg): void => {
    if (msg.guild === null) {
      return;
    }
    if (msg.author.bot) {
      return;
    }

    if (!msg.content.startsWith(config.prefix)) {
      return;
    }

    const args = msg.content.substring(config.prefix.length).split(/\s+/g);
    if (args.length < 1) {
      return;
    }
    const command = commands.get(args.shift()!);  // already checked length
    if (command === undefined) {
      return;
    }
    command(bot, msg, args);
  });
};
