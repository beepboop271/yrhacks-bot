import { Client } from "discord.js";

import { registerCommands } from "./command";
import { registerIsolation } from "./isolation";

const bot = new Client();

bot.on("ready", (): void => {
  console.log("logged in");
});

registerCommands(bot);
registerIsolation(bot);

await bot.login(process.env.DISCORD_BOT_TOKEN);
