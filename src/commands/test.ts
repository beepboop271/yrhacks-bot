import { Command } from "../command";

export const command: Command = {
  name: "test",
  title: "Test Message",
  description: "Sends 'hi'",
  requiredPerms: [ "MANAGE_GUILD" ],
  requiresSetup: false,
  execute: async (_client, msg, _args, _db): Promise<void> => {
    await msg.channel.send("hi");
  },
};
