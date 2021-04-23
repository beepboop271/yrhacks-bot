import crypto from "crypto";
import { Client } from "discord.js";
import fs from "fs";
import axios from "axios";
import { PassThrough } from "stream";
import path from "path";

import { isGuildMessage, makeUserString } from "./utils";

export const registerMessageLogging = (bot: Client): void => {
  let currentFile = 835221;
  let stream = fs.createWriteStream(`logs/${currentFile}.json`);
  stream.write("[");

  bot.on("message", async (msg): Promise<void> => {
    if (!isGuildMessage(msg)) {
      return;
    }

    const name = msg.id.substr(0, 6);
    if (Number(name) > currentFile) {
      stream.end("]", (): void => { console.log("done"); });
      currentFile = Number(name);
      stream = fs.createWriteStream(`logs/${currentFile}.json`);
      stream.write("[");
    }

    const attachments: Array<{ url: string; file: string }> = [];
    for (const attachment of msg.attachments.values()) {
      // const fileName =
      const fileName = `logs/attach-${name}-${crypto.createHash("MD5").update(attachment.url).digest("hex")}.dat`;
      attachments.push({ url: attachment.url, file: fileName });

      const res = await axios.request({ url: attachment.url, responseType: "stream" });
      // console.log(res.data);

      // console.log(fileName);
      const writer = fs.createWriteStream(path.resolve(process.cwd(), "logs", `attach-${name}-${crypto.createHash("MD5").update(attachment.url).digest("hex")}.dat`));
      res.data.pipe(writer);

    }
    const embeds = msg.embeds.map((embed): string => JSON.stringify(embed.toJSON()));

    stream.write(`${JSON.stringify({
      id: msg.id,
      author: makeUserString(msg.author),
      guild: msg.guild.id,
      channel: msg.channel.id,
      content: msg.content,
      attachments,
      embeds,
    })},\n`);
  });
};
