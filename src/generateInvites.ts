import { Client } from "discord.js";
import fs from "fs";

import { config, readJson, readJsonSchema } from "./config";
import { fetchGuild } from "./db";

const dataSource = process.argv[process.argv.length-2];
console.log("reading file:", dataSource);
const guildToGenerate = process.argv[process.argv.length-1];
console.log("to generate invites for guild:", guildToGenerate);

interface Participant {
  email: string;
  name: string;
  code: string;
  url: string;
}

const bot = new Client();

bot.on("ready", async (): Promise<void> => {
  console.log("logged in generateInvites");
  const data = await readJson(
    dataSource,
    await readJsonSchema("participant-data"),
  ) as (Participant[] | false);
  if (data === false) {
    return;
  }

  const guild = bot.guilds.resolve(guildToGenerate);
  if (guild === null) {
    return;
  }
  const info = fetchGuild(guild);
  if (info === undefined) {
    return;
  }

  const isolation = guild.channels.resolve(info.channels.isolation);
  if (isolation === null) {
    return;
  }

  const result: { [code: string]: Participant } = { };

  for (const participant of data) {
    const invite = await isolation.createInvite({
      maxAge: 0,
      maxUses: 1,
      unique: true,
      reason: "Generate Invites",
    });
    participant.url = invite.url;
    participant.code = invite.code;
    result[invite.code] = participant;

    console.log(participant.url, invite.code);
  }

  await fs.promises.writeFile(
    config.invitesFile,
    JSON.stringify(result, undefined, 2),
  );

  process.exit(0);
});

await bot.login(process.env.DISCORD_BOT_TOKEN);
