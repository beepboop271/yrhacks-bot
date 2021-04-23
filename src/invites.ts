import { Client } from "discord.js";

import { addUserHypothesis } from "./db";

export const registerInviteWatch = (bot: Client): void => {
  const memberQueue: string[] = [];
  const inviteQueue: string[] = [];

  // thanks API for not having invite information
  // but also thanks js for not needing to deal with data races
  bot.on("guildMemberAdd", async (member): Promise<void> => {
    if (inviteQueue.length > 0) {
      await addUserHypothesis(member.id, inviteQueue.shift()!);
    } else {
      memberQueue.push(member.id);
    }
  });
  bot.on("inviteDelete", async (invite): Promise<void> => {
    if (memberQueue.length > 0) {
      await addUserHypothesis(memberQueue.shift()!, invite.code);
    } else {
      inviteQueue.push(invite.code);
    }
  });
};
