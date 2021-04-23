import { Command } from "../command";
import { config } from "../config";
import { addUser, getUsers } from "../db";

export const command: Command = {
  name: "join",
  title: "Join as Participant",
  description: "Records the user and invite token given, then adds the user as a participant",
  requiredPerms: [],
  requiresSetup: true,
  execute: async (_client, msg, args, db): Promise<void> => {
    if (args.length < 1) {
      return;
    }
    const code = args[0];

    const { member } = msg;
    if (!member.roles.cache.has(db.roles.pending)) {
      return;
    }

    const participant = config.invites.get(code);
    if (participant === undefined) {
      return;
    }
    if (getUsers().codes[code] !== undefined) {
      return;
    }

    await addUser(code, msg.author.id);
    await member.roles.add(db.roles.participant);
    await member.roles.remove(db.roles.pending);
    await member.setNickname(participant.displayName);
  },
};
