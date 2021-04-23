import { Client, PermissionResolvable } from "discord.js";
import fs from "fs";

import { config } from "./config";
import { DbGuildInfo, fetchGuild } from "./db";
import { GuildMessage, isGuildMessage } from "./utils";
interface CommandBase {
  name: string;
  title: string;
  description: string;
  requiredPerms: PermissionResolvable;
}

interface DbCommand extends CommandBase {
  requiresSetup: true;
  execute(
    client: Client,
    msg: GuildMessage,
    args: string[],
    db: DbGuildInfo,
  ): Promise<void>;
}

interface NoDbCommand extends CommandBase {
  requiresSetup: false;
  execute(
    client: Client,
    msg: GuildMessage,
    args: string[],
    db: undefined,
  ): Promise<void>;
}

export type Command = DbCommand | NoDbCommand;

const commands: Map<string, Command> = new Map();

for (const file of await fs.promises.readdir("dist/commands")) {
  if (file.endsWith(".js")) {
    // tslint:disable-next-line: no-unsafe-any
    const command: Command = (await import(`./commands/${file}`)).command;
    commands.set(command.name, command);
  }
}

export const registerCommands = (bot: Client): void => {
  bot.on("message", async (msg): Promise<void> => {
    if (!isGuildMessage(msg)) {
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

    if (command.requiresSetup) {
      const db = fetchGuild(msg.guild);
      if (db === undefined) {
        return;
      }
      await command.execute(bot, msg, args, db);
    } else {
      await command.execute(bot, msg, args, undefined);
    }
  });
};
