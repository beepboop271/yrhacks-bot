import { Command } from "../command";
import { db } from "../db";

export const command: Command = {
  name: "end_session",
  execute: async (_client, msg, _args): Promise<void> => {
    if (msg.guild === null || msg.channel.type !== "text") {
      return;
    }
    const { guild, channel } = msg;

    const guildDb = db.getState()[guild.id];
    if (guildDb === undefined) {
      console.warn(`guild ${guild.id} (${guild.name}) not setup properly`);
      return;
    }

    const availableRole = msg.guild.roles.resolve(guildDb.roles.available);
    if (availableRole === null) {
      console.warn(`@available ${guildDb.roles.available} is not in the right guild ${guild.id}`);
      return;
    }

    if (channel.parent?.name !== "Mentorship") {
      return;
    }

    await channel.send("Session is ending! This channel will be deleted in 30 seconds");
    // TODO: no floating promise, also delay doesn't work?
    setTimeout(channel.delete.bind(channel), 30000);

    for (const member of channel.members.values()) {
      if (member.roles.cache.has(guildDb.roles.mentor)) {
        await member.roles.add(availableRole);
        return;
      }
    }
  },
};
