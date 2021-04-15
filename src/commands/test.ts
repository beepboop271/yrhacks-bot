import { Command } from "../command";

export const command: Command = {
  name: "test",
  title: "Test Message",
  description: "Sends 'hi'",
  requiredPerms: [ "MANAGE_GUILD" ],
  execute: async (_client, msg, _args): Promise<void> => {
    await msg.channel.send("hi");
  },
};
