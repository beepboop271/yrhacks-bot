import { Permissions } from "discord.js";

import { Command } from "../command";
import { reloadConfig } from "../config";

export const command: Command = {
  name: "reload",
  execute: async (_client, msg, _args): Promise<void> => {
    if (msg.member?.hasPermission(Permissions.FLAGS.MANAGE_GUILD) === true) {
      await reloadConfig();
    }
  },
};
