import { Client, MessageEmbed, Permissions } from "discord.js";

import { config } from "./config";
import { fetchChannel, fetchGuild } from "./db";
import { isGuildMessage, makeUserString, mention } from "./utils";

export const registerCensoring = (bot: Client): void => {
  bot.on("message", async (msg): Promise<void> => {
    if (!msg.deletable || !isGuildMessage(msg)) {
      return;
    }
    if (
      msg.member.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES)
      && msg.content.startsWith(`${config.prefix}word_unban`)
    ) {
      // kinda sketchy, admins exempt to do !wordunban <bannedword>
      return;
    }

    let { content } = msg;
    content = content.toLowerCase();
    // content = content.replace(/\s+/g, "");
    // TODO: common substitutions? eg 0 -> o

    let matchedWord;
    for (const word of config.wordlist) {
      if (content.includes(word)) {
        matchedWord = word;
        await msg.delete({ reason: `Found inappropriate word: ${word}` });
        await msg.reply("watch your language.");
        break;
      }
    }
    if (matchedWord === undefined) {
      return;
    }

    const db = fetchGuild(msg.guild);
    if (db === undefined) {
      return;
    }
    const channel = fetchChannel(msg.guild, db.channels.log);
    if (channel === undefined || !channel.isText()) {
      return;
    }

    await channel.send(new MessageEmbed({
      title: "Wordlist Match",
      author: {
        name: makeUserString(msg.author),
      },
      description: `In ${mention(msg.channel)}:\n${msg.content}`,
      fields: [
        {
          name: "Matched content:",
          value: matchedWord,
          inline: true,
        },
      ],
      timestamp: Date.now(),
      footer: {
        text: msg.id,
      },
    }));
  });
};
