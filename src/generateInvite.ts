import { Client } from "discord.js";

import { fetchGuild } from "./db";

const guildToGenerate = process.argv[process.argv.length-1];
console.log("generate invite for guild:", guildToGenerate);

const bot = new Client();

bot.on("ready", async (): Promise<void> => {
  console.log("logged in generateInvite");

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

  const invite = await isolation.createInvite({
    maxAge: 0,
    maxUses: 1,
    unique: true,
    reason: "Generate Invite",
  });
  console.log(invite);

  process.exit(0);
});

await bot.login(process.env.DISCORD_BOT_TOKEN);
