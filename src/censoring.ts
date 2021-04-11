import { Client, Permissions } from "discord.js";

import { config } from "./config";

export const registerCensoring = (bot: Client): void => {
  bot.on("message", async (msg): Promise<void> => {
    if (!msg.deletable) {
      return;
    }
    if (msg.member?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES) === true) {
      // admins exempt (e.g. to do !wordunban <bannedword>)
      return;
    }

    let { content } = msg;
    content = content.toLowerCase();
    content = content.replace(/\s+/g, "");
    // TODO: common substitutions? eg 0 -> o

    for (const word of config.wordlist) {
      if (content.includes(word)) {
        await msg.delete({ reason: `Found inappropriate word: ${word}` });
      }
    }
  });
};
