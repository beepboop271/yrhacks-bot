import { Command } from "../command";
import { mention } from "../utils";

export const command: Command = {
  name: "deny",
  title: "Deny Isolated Member",
  description: "Kicks the member references by the given approval message",
  requiredPerms: [ "KICK_MEMBERS" ],
  requiresSetup: true,
  execute: async (_client, msg, args, db): Promise<void> => {
    if (args.length < 2) {
      return;
    }
    if (!/^\d+$/.test(args[0])) {
      return;
    }

    const approvalId = args[0];
    const approvals = msg.guild.channels.resolve(db.channels.approvals);
    if (approvals === null || !approvals.isText()) {
      return;
    }

    const approval = approvals.messages.resolve(approvalId);
    if (approval === null) {
      return;
    }

    if (!/^\d+$/.test(approval.content)) {
      return;
    }

    const member = msg.guild.members.resolve(approval.content);
    if (member === null) {
      return;
    }

    const reasonIdx = msg.content.substr(msg.content.indexOf(args[0])).search(/\s+/);
    const reason = msg.content.substr(msg.content.indexOf(args[0])+reasonIdx).trim();

    if (member.kickable) {
      await member.kick(reason);
    }
    const update = `${approval.content} - Rejected by ${mention(msg.author)} - ${reason}`;
    await approval.edit(update);
    await approval.reactions.removeAll();
  },
};
