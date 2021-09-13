import { Client } from "discord.js";

import { registerCensoring } from "./censoring";
import { registerCommands } from "./command";
import { registerEventLogging } from "./eventLogger";
import { registerIsolation } from "./isolation";
import { registerMessageLogging } from "./messageLogger";
import { registerReactions } from "./reactions";
import { registerMentorTickets } from "./tickets";

const bot = new Client({
  partials: [ "MESSAGE", "REACTION", "USER" ],
  messageCacheMaxSize: 1000,
});

bot.on("ready", (): void => {
  console.log("logged in");
  registerEventLogging(bot);
});

registerMessageLogging(bot);
registerCensoring(bot);
registerReactions(bot);
registerCommands(bot);
registerIsolation(bot);
registerMentorTickets();

await bot.login(process.env.DISCORD_BOT_TOKEN);
