import fs from "fs";

import { Command } from "../command";
import { config } from "../config";

export const command: Command = {
  name: "wordunban",
  title: "Unban Word",
  description: "Removes a word from the banned word list",
  requiredPerms: [ "MANAGE_MESSAGES" ],
  execute: async (_client, _msg, args): Promise<void> => {
    for (const arg of args) {
      config.wordlist.delete(arg.toLowerCase());
    }

    // should not need anything more complicated for a small file
    await fs.promises.writeFile(
      config.wordlistFile,
      JSON.stringify(Array.from(config.wordlist), undefined, 2),
    );
  },
};
