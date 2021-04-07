import { Client, MessageEmbed, MessageReaction} from "discord.js";

const reactionFilter = (reaction: MessageReaction): boolean =>
  reaction.emoji.name === "✅" || reaction.emoji.name === "❌";

export const registerIsolation = (bot: Client): void => {
  bot.on("guildMemberAdd", async (member): Promise<void> => {
    const { user } = member;
    const { systemChannel } = member.guild;
    if (systemChannel === null) {
      console.log("no system channel set");
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

    const msg = await systemChannel.send(new MessageEmbed(embed));
    await msg.react("✅");
    await msg.react("❌");
    const collector = msg.createReactionCollector(reactionFilter, {
      time: 1000*60*60*24,
    });

    // TODO: make this not a quick hack that just gets the feature working
    // ie. no fetching roles when adding, integrate with command system
    // or use partials to get persistence/no time limit, figure out a more
    // detailed system on how to reject users
    collector.on("collect", async (reaction, approvingUser): Promise<void> => {
      if (reaction.emoji.name === "✅") {
        const participant = member.guild.roles.cache.find((role): boolean => role.name === "Participant");
        if (participant !== undefined) {
          await member.roles.add(participant, `Approved by ${approvingUser.username}#${approvingUser.discriminator}`);
        }
      }
    });
  });
};
