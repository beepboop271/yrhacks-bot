import { EmbedFieldData } from "discord.js";

import { Command } from "../command";
import { getCode } from "../db";
import { mention, sendCommandFeedback } from "../utils";

export const command: Command = {
  name: "whois",
  title: "Retrieve Code",
  description: "Retrieves the unique code of the given participant(s)",
  requiredPerms: [ "MANAGE_ROLES" ],
  requiresSetup: false,
  execute: async (_client, msg, args, _db): Promise<void> => {
    const results: EmbedFieldData[] = [];

    for (const user of msg.mentions.users.values()) {
      results.push({
        name: ".",
        value: `${mention(user)}: ${getCode(user.id) ?? "none"}`,
        inline: true,
      });
    }
    for (const arg of args) {
      if (/^\d+$/.test(arg)) {
        results.push({
          name: ".",
          value: `${arg}: ${getCode(arg) ?? "none"}`,
          inline: true,
        });
      }
    }

    await sendCommandFeedback(msg, command, results);
  },
};
