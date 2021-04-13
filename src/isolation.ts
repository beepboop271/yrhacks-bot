import { Client, MessageEmbed } from "discord.js";

import { fetchChannel, fetchGuild } from "./db";

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

    const embed = {
      description: `${user.id}\nUser Joined`,
      timestamp: Date.now(),
      image: {
        url: user.displayAvatarURL({ dynamic: true, size: 512 }),
      },
      author: {
        name: `${user.username}#${user.discriminator}`,
      },
    };

    const msg = await target.send(user.id, new MessageEmbed(embed));
    await msg.react("✅");
  });
  bot.on("messageReactionAdd", async (reaction, user): Promise<void> => {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (reaction.emoji.name !== "✅") {
      return;
    }
    if (user.partial) {
      await user.fetch();
    }
    if (user.id === bot.user?.id) {
      return;
    }
    const { message } = reaction;
    if (message.partial) {
      await message.fetch();
    }
    if (message.guild === null) {
      return;
    }
    if (message.author.id !== bot.user?.id) {
      return;
    }
    const db = fetchGuild(message.guild);
    if (db === undefined) {
      return;
    }
    if (message.channel.id !== db.channels.approvals) {
      return;
    }
    const { content } = message;
    if (content.match(/^[0-9]+$/) === null) {
      return;
    }
    const member = message.guild.member(content);
    if (member === null) {
      return;
    }
    const reason = `Approved by <@${user.id}> (${user.id})`;
    await member.roles.add(db.roles.participant, reason);
    await message.edit(reason);
    await message.reactions.removeAll();
  });
};
