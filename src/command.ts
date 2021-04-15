import { Client, Message, PermissionResolvable } from "discord.js";
import fs from "fs";

import { config } from "./config";

type CommandExecutor = (client: Client, msg: Message, args: string[]) => void;

export interface Command {
  name: string;
  title: string;
  description: string;
  requiredPerms: PermissionResolvable;
  execute: CommandExecutor;
}

const commands: Map<string, Command> = new Map();

for (const file of await fs.promises.readdir("dist/commands")) {
  if (file.endsWith(".js")) {
    // tslint:disable-next-line: no-unsafe-any
    const command: Command = (await import(`./commands/${file}`)).command;
    commands.set(command.name, command);
  }
}

export const registerCommands = (bot: Client): void => {
  bot.on("message", (msg): void => {
    if (msg.guild === null || msg.member === null) {
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

    if (!msg.member.hasPermission(command.requiredPerms)) {
      return;
    }

    command.execute(bot, msg, args);
  });
};
