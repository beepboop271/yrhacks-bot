import { Command } from "../command";

export const command: Command = {
  name: "role",
  title: "Add a Marker Role",
  description: "Adds a role/multiple roles created by create_role to the user",
  requiredPerms: [ "CHANGE_NICKNAME" ],
  requiresSetup: true,
  execute: async (_client, msg, args, db): Promise<void> => {
    if (args.length < 1 && msg.mentions.roles.size < 1) {
      return;
    }

    for (const role of args) {
      const id = db.markerRoles[role];
      if (id !== undefined) {
        if (msg.member.roles.cache.has(id)) {
          await msg.member.roles.remove(id);
        } else {
          await msg.member.roles.add(id);
        }
      }
    }
    for (const role of msg.mentions.roles.values()) {
      const id = db.markerRoles[role.name];
      if (id !== undefined) {
        if (msg.member.roles.cache.has(id)) {
          await msg.member.roles.remove(id);
        } else {
          await msg.member.roles.add(id);
        }
      }
    }
  },
};
