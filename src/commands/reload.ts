import { Command } from "../command";
import { reloadConfig } from "../config";

export const command: Command = {
  name: "reload",
  title: "Reload Config",
  description: "Reloads the configuration JSON files of the bot",
  requiredPerms: [ "MANAGE_GUILD" ],
  execute: async (_client, _msg, _args): Promise<void> => {
    await reloadConfig();
  },
};
