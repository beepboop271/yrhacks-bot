import { OverwriteData, Permissions, Role, SystemChannelFlags } from "discord.js";

import { Command } from "../command";
import { config, OverwriteConfig } from "../config";
import { db } from "../db";

const P = Permissions.FLAGS;
const noSystemMessages = new SystemChannelFlags(0)
  .add(SystemChannelFlags.FLAGS.BOOST_MESSAGE_DISABLED)
  .add(SystemChannelFlags.FLAGS.WELCOME_MESSAGE_DISABLED);

const getPerms = (perms?: number[]): Permissions => {
  const permsObj = new Permissions(0);
  for (const perm of perms ?? []) {
    permsObj.add(perm);
  }
  return permsObj;
};

const makePerms = (
  perms: Array<keyof typeof P> | undefined,
): Permissions => {
  if (perms === undefined) {
    return getPerms();
  }
  return getPerms(perms.map((perm): number => P[perm]));
};

const roleMap: Map<string, Role> = new Map();

const makeOverwrites = (
  overwrites: OverwriteConfig[] | undefined,
): OverwriteData[] | undefined => {
  if (overwrites === undefined) {
    return undefined;
  }

  const data: OverwriteData[] = [];
  for (const overwrite of overwrites) {
    for (const roleName of overwrite.id) {
      const role = roleMap.get(roleName);
      if (role === undefined) {
        console.warn(`'${roleName}' was not found while constructing overwrite`);
      } else {
        data.push({
          id: role,
          allow: makePerms(overwrite.allow),
          type: "role",
        });
      }
    }
  }
  return data;
};

export const command: Command = {
  name: "setup",
  execute: async (_client, msg, _args): Promise<void> => {
    if (msg.guild === null || msg.member === null) {
      return;
    }
    if (!msg.member.hasPermission(P.ADMINISTRATOR)) {
      return;
    }

    const { guild } = msg;
    const { roles, channels } = guild;

    db.set(`${guild.id}.roles`, { })
      .set(`${guild.id}.channels`, { })
      .write();

    // remove existing roles synchronously
    // (channels are removed synchronously because of visual bugs,
    // roles dont seem to be affected but just do it synchronously)
    for (const role of roles.cache.values()) {
      if (!role.editable || role.id === roles.everyone.id) {
        console.warn(`could not delete an uneditable role: ${role.name}`);
      } else {
        await role.delete("Bot setup command");
      }
    }

    // create roles
    await roles.everyone.setPermissions(
      getPerms(),
      "Bot setup command",
    );
    roleMap.set("everyone", roles.everyone);

    for (const role of config.roles) {
      const roleObj = await roles.create({
        data: {
          name: role.name,
          hoist: role.hoist ?? false,
          permissions: makePerms(role.permissions),
          mentionable: role.mentionable ?? false,
        },
        reason: "Bot setup command",
      });
      roleMap.set(role.name, roleObj);
      db.set(`${guild.id}.roles.${role.name}`, roleObj.id).value();
    }
    db.write();

    // remove all existing channels synchronously
    // (there's a visual bug when you remove them too quickly)
    for (const channel of channels.cache.values()) {
      await channel.delete("Bot setup command");
    }

    // create channels
    for (const category of config.channels) {
      const categoryObj = await channels.create(
        category.name,
        {
          type: "category",
          permissionOverwrites: makeOverwrites(category.permissionOverwrites),
          reason: "Bot setup command",
        },
      );
      db.set(`${guild.id}.channels.${category.name}`, categoryObj.id).value();
      for (const channel of category.channels ?? []) {
        const channelObj = await channels.create(
          channel.name,
          {
            type: channel.type ?? "text",
            parent: categoryObj,
            topic: channel.topic,
            permissionOverwrites: makeOverwrites(channel.permissionOverwrites),
            reason: "Bot setup command",
          },
        );
        db.set(`${guild.id}.channels.${channel.name}`, channelObj.id).value();
      }
    }
    db.write();

    // set settings
    await guild.edit(
      {
        verificationLevel: "LOW",
        explicitContentFilter: "ALL_MEMBERS",
        defaultMessageNotifications: "MENTIONS",
        systemChannelFlags: noSystemMessages,
      },
      "Bot setup command",
    );
  },
};
