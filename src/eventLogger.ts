import { Client, MessageEmbed } from "discord.js";

import { fetchGuild } from "./db";
import { makeUserString } from "./utils";

export const registerEventLogging = (bot: Client): void => {
  const guild = bot.guilds.resolve("");
  if (guild === null) {
    return;
  }
  const db = fetchGuild(guild);
  if (db === undefined) {
    return;
  }
  const log = guild.channels.resolve(db.channels.log);
  if (log === null || !log.isText()) {
    return;
  }

  bot.on("userUpdate", async (_before, after): Promise<void> => {
    await log.send(new MessageEmbed({
      title: "User Update",
      timestamp: Date.now(),
      thumbnail: {
        url: after.displayAvatarURL({ dynamic: true, size: 512 }),
      },
      author: {
        name: makeUserString(after),
      },
    }));
  });
  bot.on("presenceUpdate", async (before, after): Promise<void> => {
    const member = guild.member(after.userID);
    if (member === null) {
      return;
    }
    let description;
    for (const activity of after.activities) {
      if (activity.type === "CUSTOM_STATUS" && activity.state !== null) {
        description = activity.state;
        break;
      }
    }
    if (before !== undefined) {
      let beforeDescription;
      for (const activity of before.activities) {
        if (activity.type === "CUSTOM_STATUS" && activity.state !== null) {
          beforeDescription = activity.state;
          break;
        }
      }
      if (beforeDescription !== undefined && beforeDescription === description) {
        return;
      }
    }
    if (description === undefined) {
      return;
    }
    await log.send(new MessageEmbed({
      title: "Status Update",
      timestamp: Date.now(),
      description,
      author: {
        name: makeUserString(member.user),
      },
    }));
  });
  bot.on("messageUpdate", async (before, after): Promise<void> => {
    try {
      if (before.partial) {
        await before.fetch();
      }
    } catch (e) {
      console.error(e);
    }
    const prev = before.partial ? before.id : before.content;
    try {
      if (after.partial) {
        await after.fetch();
      }
    } catch (e) {
      console.error(e);
    }
    const next = after.partial ? after.id : after.content;

    if (!before.partial && !after.partial && prev === next) {
      return;
    }

    const authorUser = after.partial ? (before.partial ? undefined : before.author) : after.author;
    if (authorUser !== undefined && authorUser.id === bot.user?.id) {
      return;
    }
    const author = authorUser === undefined ? undefined : { name: makeUserString(authorUser) };

    if (prev.length > 1024 || next.length > 1024) {
      await log.send(new MessageEmbed({
        title: "Message Edit (Original)",
        timestamp: Date.now(),
        description: prev,
        author,
        footer: {
          text: before.id,
        },
      }));
      await log.send(new MessageEmbed({
        title: "Message Edit (Edited)",
        timestamp: Date.now(),
        description: next,
        author,
        footer: {
          text: after.id,
        },
      }));
    } else {
      await log.send(new MessageEmbed({
        title: "Message Edit",
        timestamp: Date.now(),
        fields: [
          {
            name: "Original",
            value: prev.length > 0 ? prev : "<empty>",
          },
          {
            name: "Edited",
            value: next.length > 0 ? next : "<empty>",
          },
        ],
        author,
        footer: {
          text: after.id,
        },
      }));
    }
  });
  bot.on("messageDelete", async (before): Promise<void> => {
    if (before.partial) {
      await log.send(new MessageEmbed({
        title: "Message Delete",
        timestamp: Date.now(),
        footer: {
          text: before.id,
        },
      }));
    } else {
      await log.send(new MessageEmbed({
        title: "Message Delete",
        description: before.content,
        timestamp: Date.now(),
        author: {
          name: makeUserString(before.author),
        },
        footer: {
          text: before.id,
        },
      }));
    }
  });
  bot.on("guildMemberRemove", async (member): Promise<void> => {
    await log.send(new MessageEmbed({
      title: "Member Left/Kicked",
      author: {
        name: makeUserString(member.partial ? member.id : member.user),
      },
    }));
  });
  bot.on("guildBanAdd", async (eventGuild, user): Promise<void> => {
    if (eventGuild.id !== guild.id) {
      return;
    }
    await log.send(new MessageEmbed({
      title: "Member Banned",
      author: {
        name: makeUserString(user),
      },
    }));
  });
};
