import { EmbedFieldData, MessageEmbed } from "discord.js";

import { Command, sendCommandFeedback } from "../command";
import { config } from "../config";
import { mention } from "../utils";

const makeRoleList = (name: string, ids: string[]): EmbedFieldData => ({
  name,
  value: ids.map((id): string => `<@&${id}>`).join(" "),
  inline: true,
});

export const command: Command = {
  name: "role",
  title: "Toggle a Marker Role",
  description: "Adds/Removes a role/multiple roles created by create_role to the user",
  requiredPerms: [ "CHANGE_NICKNAME" ],
  requiresSetup: true,
  execute: async (_client, msg, args, db): Promise<void> => {
    const { member, mentions } = msg;

    if (args.length < 1 && mentions.roles.size < 1) {
      return;
    }

    const names = args.concat(
      mentions.roles.array().map((role): string => role.name),
    );

    const add: string[] = [];
    const remove: string[] = [];

    for (const name of names) {
      const id = db.markerRoles[name];
      if (id !== undefined) {
        (member.roles.cache.has(id) ? remove : add).push(id);
      }
    }

    const replyFields = [];

    if (add.length > 0) {
      await member.roles.add(add, "role command");
      replyFields.push(makeRoleList("Added:", add));
    }
    if (remove.length > 0) {
      await member.roles.remove(remove, "role command");
      replyFields.push(makeRoleList("Removed:", remove));
    }

    if (replyFields.length === 0) {
      return;
    }

    await sendCommandFeedback(msg, command, replyFields);
  },
};
