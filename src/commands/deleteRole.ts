import { Command } from "../command";
import { removeMarkerRole } from "../db";

export const command: Command = {
  name: "delete_role",
  title: "Delete a Marker Role",
  description: "Deletes a role created by create_role",
  requiredPerms: [ "MANAGE_ROLES" ],
  requiresSetup: true,
  execute: async (_client, msg, args, db): Promise<void> => {
    if (args.length < 1 && msg.mentions.roles.size < 1) {
      return;
    }

    const { guild } = msg;

    for (const role of args) {
      const id = db.markerRoles[role];
      if (id !== undefined) {
        await guild.roles.resolve(id)?.delete("delete_role");
        await removeMarkerRole(guild, role);
      }
    }
    for (const role of msg.mentions.roles.values()) {
      const id = db.markerRoles[role.name];
      if (id !== undefined) {
        await guild.roles.resolve(id)?.delete("delete_role");
        await removeMarkerRole(guild, role.name);
      }
    }
  },
};
