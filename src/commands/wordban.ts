import fs from "fs";

import { Command } from "../command";
import { config } from "../config";

export const command: Command = {
  name: "word_ban",
  title: "Ban Word",
  description: "Adds a word to the banned word list",
  requiredPerms: [ "MANAGE_MESSAGES" ],
  requiresSetup: false,
  execute: async (_client, _msg, args, _db): Promise<void> => {
    for (const arg of args) {
      config.wordlist.add(arg.toLowerCase());
    }

    // should not need anything more complicated for a small file
    await fs.promises.writeFile(
      config.wordlistFile,
      JSON.stringify(Array.from(config.wordlist), undefined, 2),
    );
  },
};
