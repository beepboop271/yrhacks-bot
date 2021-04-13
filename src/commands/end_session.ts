import { TextChannel } from "discord.js";

import { Command } from "../command";

export const command: Command = {
  name: "end_session",
  execute: async (_client, msg, _): Promise<void> => {
    if (msg.member === null || msg.guild == null || !msg.channel.isText()) {
      return;
    }

    const channel = msg.channel as TextChannel;
    if (channel.parent?.name !== "Mentorship") {
      return;
    }

    await msg.channel.send("Session is ending! This channel will be deleted in 30 seconds");
    setTimeout(channel.delete.bind(channel), 5);
    for (const member of channel.members) {
      if (member[1].roles.cache.find(r => r.name === "mentor") !== undefined) { // TODO: get rid of hard code
        await member[1].roles.add(
          msg.guild.roles.cache.find(role => role.name === "available")!,
        ); //TODO: get rid of hard code
        return;
      }
    }
  },
};
