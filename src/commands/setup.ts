import { Channel, OverwriteData, Role } from "discord.js";
import fp from "lodash/fp";
const { set } = fp;

import { Command } from "../command";
import { config, OverwriteConfig } from "../config";
import { db, initGuild } from "../db";

const makeOverwrites = (
  overwrites: OverwriteConfig[] | undefined,
  roles: Map<string, Role>,
): OverwriteData[] | undefined => {
  if (overwrites === undefined) {
    return undefined;
  }

  const data: OverwriteData[] = [];
  for (const overwrite of overwrites) {
    for (const roleName of overwrite.id) {
      const role = roles.get(roleName);
      if (role === undefined) {
        console.warn(`'${roleName}' was not found while constructing overwrite`);
      } else {
        data.push({
          id: role,
          allow: overwrite.allow,
          type: "role",
        });
      }
    }
  }
  return data;
};

export const command: Command = {
  name: "setup",
  title: "Server Setup",
  description: "Creates channels and roles for the server, storing created IDs",
  requiredPerms: [ "ADMINISTRATOR" ],
  requiresSetup: false,
  execute: async (_client, msg, _args, _db): Promise<void> => {
    const { guild } = msg;
    const { roles, channels } = guild;

    await initGuild(guild);

    const roleMap: Map<string, Role> = new Map();
    const channelMap: Map<string, Channel> = new Map();

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
      [],
      "Bot setup command",
    );
    roleMap.set("everyone", roles.everyone);

    for (const role of config.roles) {
      const roleObj = await roles.create({
        data: {
          name: role.name,
          color: role.color,
          hoist: role.hoist ?? false,
          permissions: role.permissions,
          mentionable: role.mentionable ?? false,
        },
        reason: "Bot setup command",
      });
      roleMap.set(role.name, roleObj);
    }

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
          permissionOverwrites: makeOverwrites(category.permissionOverwrites, roleMap),
          reason: "Bot setup command",
        },
      );
      channelMap.set(category.name, categoryObj);
      for (const channel of category.channels ?? []) {
        const channelObj = await channels.create(
          channel.name,
          {
            type: channel.type ?? "text",
            parent: categoryObj,
            topic: channel.topic,
            permissionOverwrites: makeOverwrites(channel.permissionOverwrites, roleMap),
            reason: "Bot setup command",
          },
        );
        channelMap.set(channel.name, channelObj);
      }
    }

    const rolesDb = db(`${guild.id}.roles`);
    const channelsDb = db(`${guild.id}.channels`);
    const writes: Array<Promise<unknown>> = [];

    // kind of awkward...
    // if all we're doing is get and set maybe this isn't
    // the best library to use
    for (const [name, role] of roleMap) {
      writes.push(rolesDb.write(set(name, role.id)));
    }
    for (const [name, channel] of channelMap) {
      writes.push(channelsDb.write(set(name, channel.id)));
    }
    await Promise.all(writes);

    // set settings

    // silly tslint not realising that undefined is not an
    // acceptable argument for the function...
    // tslint:disable-next-line: no-null-keyword
    await guild.setSystemChannel(null, "Bot setup command");
    await guild.edit(
      {
        verificationLevel: "LOW",
        explicitContentFilter: "ALL_MEMBERS",
        defaultMessageNotifications: "MENTIONS",
      },
      "Bot setup command",
    );
  },
};
