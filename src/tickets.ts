import { config } from "./config";
import { onChannelReaction } from "./reactions";

export const registerMentorTickets = (): void => {
  onChannelReaction(
    "tickets",
    "✅",
    async (kind, reaction, user, msg, db): Promise<void> => {
      const channelId = db.tickets[msg.id];
      if (channelId === undefined) {
        return;
      }
      const channel = msg.guild.channels.resolve(channelId);
      if (channel === null) {
        return;
      }
      if (msg.embeds.length < 1) {
        return;
      }
      const embed = msg.embeds[0];

      if (kind === "add") {
        const member = msg.guild.members.resolve(user.id);
        if (member === null) {
          return;
        }

        await channel.createOverwrite(member, {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
        });

        if (embed.hexColor === config.ticketColours.new) {
          await msg.edit(embed.setColor(config.ticketColours.old));
        }
      } else {
        if (reaction.count === null) {
          // should be !null because already fetched
          return;
        }
        if (reaction.count <= 1) {
          await msg.edit(embed.setColor(config.ticketColours.new));
        }

        const overwrite = channel.permissionOverwrites.get(user.id);
        if (overwrite === undefined) {
          return;
        }

        await overwrite.delete();
      }
    },
  );
};
