import { Client, MessageEmbed } from "discord.js";

import { fetchChannel, fetchGuild } from "./db";
import { onChannelReaction } from "./reactions";
import { makeUserString, mention } from "./utils";

export const registerIsolation = (bot: Client): void => {
  bot.on("guildMemberAdd", async (member): Promise<void> => {
    const { user, guild } = member;

    const db = fetchGuild(guild);
    if (db === undefined) {
      return;
    }

    const target = fetchChannel(guild, db.channels.approvals);
    if (target === undefined) {
      return;
    }
    if (!target.isText()) {
      console.warn(`approvals channel ${target.id} is not a text channel`);
      return;
    }

    let fields;
    for (const activity of user.presence.activities) {
      if (activity.type === "CUSTOM_STATUS" && activity.state !== null) {
        fields = [
          {
            name: "Status:",
            value: activity.state,
          },
        ];
      }
    }

    const embed = {
      description: "User Joined",
      timestamp: Date.now(),
      thumbnail: {
        url: user.displayAvatarURL({ dynamic: true, size: 512 }),
      },
      fields,
      author: {
        name: makeUserString(user),
      },
    };

    const msg = await target.send(user.id, new MessageEmbed(embed));
    await msg.react("✅");
  });

  onChannelReaction(
    "approvals",
    "✅",
    async (kind, _reaction, user, msg, db): Promise<void> => {
      if (kind === "remove") {
        return;
      }
      const { content } = msg;
      if (content.match(/^[0-9]+$/) === null) {
        return;
      }
      const member = msg.guild.member(content);
      if (member === null) {
        return;
      }
      if (member.roles.highest.id !== msg.guild.roles.everyone.id) {
        await msg.edit(`${content} - User already has roles`);
        await msg.reactions.removeAll();
        return;
      }
      const reason = `${content} - Approved by ${mention(user)}`;
      await member.roles.add(db.roles.pending, reason);
      await msg.edit(reason);
      await msg.reactions.removeAll();
    },
  );
};
