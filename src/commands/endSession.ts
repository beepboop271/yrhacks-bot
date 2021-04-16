import { Command } from "../command";

export const command: Command = {
  name: "end_session",
  title: "End Mentor Session",
  description: "Deletes the current mentorship channel",
  requiredPerms: [],
  requiresSetup: true,
  execute: async (_client, msg, _args, db): Promise<void> => {
    if (msg.channel.type !== "text") {
      return;
    }
    const { channel } = msg;

    if (channel.parent?.name !== "Mentorship") {
      return;
    }

    await channel.send("Session is ending! This channel will be deleted in 30 seconds");
    // TODO: no floating promise, also delay doesn't work?
    setTimeout(channel.delete.bind(channel), 30000);

    for (const member of channel.members.values()) {
      if (member.roles.cache.has(db.roles.mentor)) {
        await member.roles.add(db.roles.available);
        return;
      }
    }
  },
};
