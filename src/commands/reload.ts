import { Command } from "../command";
import { reloadConfig } from "../config";

export const command: Command = {
  name: "reload",
  title: "Reload Config",
  description: "Reloads the configuration JSON files of the bot",
  requiredPerms: [ "MANAGE_GUILD" ],
  requiresSetup: false,
  execute: async (_client, _msg, _args, _db): Promise<void> => {
    await reloadConfig();
  },
};
