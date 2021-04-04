import { Command } from "../command";
import { reloadConfig } from "../config";

export const command: Command = {
  name: "test",
  execute: async (_client, msg, _args): Promise<void> => {
    await msg.channel.send("hi");
    await reloadConfig();
  },
};
