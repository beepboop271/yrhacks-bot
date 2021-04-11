import { Permissions } from "discord.js";
import fs from "fs";

import { Command } from "../command";
import { config } from "../config";

export const command: Command = {
  name: "wordunban",
  execute: async (_client, msg, args): Promise<void> => {
    if (msg.member?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES) !== true) {
      return;
    }

    for (const arg of args) {
      config.wordlist.delete(arg.toLowerCase());
    }

    if (config.wordlistFile === undefined) {
      console.log("no wordlist file specified, could not persist changes");
      return;
    }

    // should not need anything more complicated for a small file
    await fs.promises.writeFile(
      config.wordlistFile,
      JSON.stringify(Array.from(config.wordlist), undefined, 2),
    );
  },
};
