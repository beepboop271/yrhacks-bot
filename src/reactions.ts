import { Client, MessageReaction, PartialUser, User } from "discord.js";

import { DbGuildInfo, fetchGuild } from "./db";
import { GuildMessage, isGuildMessage } from "./utils";

interface ReactionHandler {
  emoji: string;
  handle(
    kind: "add" | "remove",
    reaction: MessageReaction,
    user: User,
    msg: GuildMessage,
    db: DbGuildInfo,
  ): Promise<void>;
}

const reactions: Map<string, ReactionHandler> = new Map();

export const onChannelReaction = (
  channel: string,
  emoji: string,
  handler: ReactionHandler["handle"],
): void => {
  // TODO: better typing of channel name?
  // but typeof DbGuildInfo["channels"] doesn't seem to work
  reactions.set(channel, {
    emoji,
    handle: handler,
  });
};

const handle = async (
  kind: "add" | "remove",
  bot: Client,
  reaction: MessageReaction,
  user: User | PartialUser,
): Promise<void> => {
  if (reaction.partial) {
    await reaction.fetch();
  }
  const { message: msg } = reaction;
  if (msg.partial) {
    await msg.fetch();
  }
  if (!isGuildMessage(msg)) {
    return;
  }
  if (msg.author.id !== bot.user?.id) {
    return;
  }
  if (msg.channel.type !== "text") {
    return;
  }
  const handler = reactions.get(msg.channel.name);
  if (handler === undefined) {
    return;
  }
  if (reaction.emoji.name !== handler.emoji) {
    return;
  }
  if (user.partial) {
    await user.fetch();
  }
  if (user.id === bot.user?.id) {
    return;
  }
  const db = fetchGuild(msg.guild);
  if (db === undefined) {
    return;
  }

  // user already fetched
  await handler.handle(kind, reaction, user as User, msg, db);
};

export const registerReactions = (bot: Client): void => {
  bot.on("messageReactionAdd", handle.bind(undefined, "add", bot));
  bot.on("messageReactionRemove", handle.bind(undefined, "remove", bot));
};
