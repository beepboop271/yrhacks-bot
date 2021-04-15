import { Command } from "../command";
import { fetchGuild } from "../db";

export const command: Command = {
  name: "end_session",
  title: "End Mentor Session",
  description: "Deletes the current mentorship channel",
  requiredPerms: [],
  execute: async (_client, msg, _args): Promise<void> => {
    if (msg.guild === null || msg.channel.type !== "text") {
      return;
    }
    const { guild, channel } = msg;

    if (channel.parent?.name !== "Mentorship") {
      return;
    }

    const db = fetchGuild(guild);
    if (db === undefined) {
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
