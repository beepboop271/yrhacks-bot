import { Client } from "discord.js";

import { registerCommands } from "./command";

const bot = new Client();

bot.on("ready", (): void => {
  console.log("logged in");
});

registerCommands(bot);

await bot.login(process.env.DISCORD_BOT_TOKEN);
