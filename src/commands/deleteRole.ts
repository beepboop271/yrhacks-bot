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

    for (const roleName of args) {
      // the mentions will also be here but they are not
      // role names so it is fine
      const id = db.markerRoles[roleName];
      if (id !== undefined) {
        await guild.roles.resolve(id)?.delete("delete_role command");
        await removeMarkerRole(guild, roleName);
      }
    }
    for (const role of msg.mentions.roles.values()) {
      const id = db.markerRoles[role.name];
      if (id !== undefined) {
        await role.delete("delete_role command");
        await removeMarkerRole(guild, role.name);
      }
    }
  },
};
