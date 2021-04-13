import { Client, MessageEmbed, MessageReaction } from "discord.js";

import { db } from "./db";

const reactionFilter = (reaction: MessageReaction): boolean =>
  reaction.emoji.name === "✅" || reaction.emoji.name === "❌";

export const registerIsolation = (bot: Client): void => {
  bot.on("guildMemberAdd", async (member): Promise<void> => {
    const { user, guild } = member;

    const guildDb = db.getState()[guild.id];
    if (guildDb === undefined) {
      console.warn(`guild ${guild.id} (${guild.name}) not setup properly`);
      return;
    }

    const target = guild.channels.resolve(guildDb.channels.approvals);
    if (target === null) {
      console.warn(`#approvals ${guildDb.channels.approvals} is not in the right guild ${guild.id}`);
      return;
    }
    if (!target.isText()) {
      console.warn(`#approvals ${guildDb.channels.approvals} is not a text channel`);
      return;
    }

    const embed = {
      description: "User Joined",
      timestamp: Date.now(),
      image: {
        url: user.displayAvatarURL({ dynamic: true, size: 512 }),
      },
      author: {
        name: `${user.username}#${user.discriminator}`,
      },
    };

    const msg = await target.send(new MessageEmbed(embed));
    await msg.react("✅");
    const collector = msg.createReactionCollector(reactionFilter, {
      time: 1000*60*60*24,
    });

    // TODO: make this not a quick hack that just gets the feature working
    // ie. no fetching roles when adding, integrate with command system
    // or use partials to get persistence/no time limit, figure out a more
    // detailed system on how to reject users
    collector.on("collect", async (reaction, approvingUser): Promise<void> => {
      if (reaction.emoji.name === "✅") {
        await member.roles.add(
          guildDb.roles.participant,
          `Approved by ${approvingUser.username}#${approvingUser.discriminator}`,
        );
      }
    });
  });
};
