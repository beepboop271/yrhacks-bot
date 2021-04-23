import { Command } from "../command";
import { config } from "../config";
import { mention, sendCommandFeedback } from "../utils";

export const command: Command = {
  name: "add_participant",
  title: "Add a Participant to Mentor Session",
  description: "Adds a participant to the current current mentorship channel by tag or id",
  requiredPerms: [],
  requiresSetup: true,
  execute: async (_client, msg, _args, db): Promise<void> => {
    if (msg.channel.type !== "text") {
      return;
    }
    const { channel } = msg;

    if (channel.parent?.id !== db.channels.Mentorship) {
      await msg.reply("this is not a mentorship channel");
      return;
    }

    const arg = msg.content.substr(config.prefix.length+command.name.length).trim();

    const member = /^\d+$/.test(arg)
      ? msg.guild.members.resolve(arg)
      : msg.guild.members.cache.find((u): boolean => u.user.tag === arg);

    if (
      member !== undefined
      && member !== null
      && member.roles.cache.has(db.roles.participant)
    ) {
      await channel.createOverwrite(member, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
      });
    } else {
      await msg.reply("no such participant. Sample tag: Username#1234. Sample id: 123456789123456789");
      return;
    }

    await sendCommandFeedback(msg, command, [{
      name: "Added",
      value: mention(member),
      inline: true,
    }]);
  },
};
