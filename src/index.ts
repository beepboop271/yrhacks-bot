import { Client } from "discord.js";

import { registerCensoring } from "./censoring";
import { registerCommands } from "./command";
import { registerIsolation } from "./isolation";
import { registerReactions } from "./reactions";
import { registerMentorTickets } from "./tickets";

const bot = new Client({
  partials: [ "MESSAGE", "REACTION", "USER" ],
});

bot.on("ready", (): void => {
  console.log("logged in");
});

registerCensoring(bot);
registerReactions(bot);
registerCommands(bot);
registerIsolation(bot);
registerMentorTickets();

await bot.login(process.env.DISCORD_BOT_TOKEN);
