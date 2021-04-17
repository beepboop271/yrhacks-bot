import { Client, Guild, GuildMember, Message, MessageReaction, PartialUser, User } from "discord.js";

import { DbGuildInfo, fetchGuild } from "./db";

interface CheckData {
  db: DbGuildInfo;
  message: Message;
  guild: Guild;
  member: GuildMember;
}

const doChecks = async (
  bot: Client,
  reaction: MessageReaction,
  user: User | PartialUser,
): Promise<CheckData | undefined> => {
  if (reaction.partial) {
    await reaction.fetch();
  }
  if (reaction.emoji.name !== "✅") {
    return undefined;
  }
  const { message } = reaction;
  if (message.partial) {
    await message.fetch();
  }
  if (message.guild === null) {
    return undefined;
  }
  if (message.author.id !== bot.user?.id) {
    return undefined;
  }
  if (user.partial) {
    await user.fetch();
  }
  if (user.id === bot.user?.id) {
    return undefined;
  }
  const db = fetchGuild(message.guild);
  if (db === undefined) {
    return undefined;
  }
  if (message.channel.id !== db.channels.tickets) {
    return undefined;
  }
  const member = message.guild.members.resolve(user.id);
  if (member === null) {
    return undefined;
  }
  return {
    db,
    message,
    guild: message.guild,
    member,
  };
};

export const registerMentorTickets = (bot: Client): void => {
  bot.on("messageReactionAdd", async (reaction, user): Promise<void> => {
    const data = await doChecks(bot, reaction, user);
    if (data === undefined) {
      return;
    }
    const { db, message, guild, member } = data;
    if (message.embeds.length < 1) {
      return;
    }

    const channel = guild.channels.resolve(db.tickets[message.id]);
    if (channel === null) {
      return;
    }

    await channel.createOverwrite(member, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
    });

    if (message.embeds[0].hexColor === "#ff0000") {
      await message.edit(message.embeds[0].setColor("#000000"));
    }
  });
  bot.on("messageReactionRemove", async (reaction, user): Promise<void> => {
    const data = await doChecks(bot, reaction, user);
    if (data === undefined) {
      return;
    }
    const { db, message, guild } = data;

    const channel = guild.channels.resolve(db.tickets[message.id]);
    if (channel === null) {
      return;
    }

    const overwrite = channel.permissionOverwrites.get(user.id);
    if (overwrite === undefined) {
      return;
    }

    await overwrite.delete();

    if (reaction.count === null) {
      return;
    }

    if (reaction.count <= 1 && message.embeds.length > 0) {
      await message.edit(message.embeds[0].setColor("#ff0000"));
    }
  });
};
