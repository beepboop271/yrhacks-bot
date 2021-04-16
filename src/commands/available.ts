import { Command } from "../command";

export const command: Command = {
  name: "available",
  title: "Mark as Available",
  description: "Turns the mentor available without deleting the current session",
  requiredPerms: [],
  requiresSetup: true,
  execute: async (_client, msg, _args, db): Promise<void> => {
    const { member } = msg;

    if (!member.roles.cache.has(db.roles.mentor)) {
      return;
    }

    await member.roles.add(db.roles.available);
  },
};
