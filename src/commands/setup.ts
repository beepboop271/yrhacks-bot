import { Permissions, SystemChannelFlags } from "discord.js";

import { Command } from "../command";

const P = Permissions.FLAGS;
const noSystemMessages = new SystemChannelFlags(0)
  .add(SystemChannelFlags.FLAGS.BOOST_MESSAGE_DISABLED)
  .add(SystemChannelFlags.FLAGS.WELCOME_MESSAGE_DISABLED);

const getPerms = (...perms: number[]): Permissions => {
  const permsObj = new Permissions(0);
  for (const perm of perms) {
    permsObj.add(perm);
  }
  return permsObj;
};

export const command: Command = {
  name: "setup",
  execute: async (_client, msg, _args): Promise<void> => {
    if (msg.guild === null) {
      return;
    }
    if (msg.member === null) {
      return;
    }
    if (!msg.member.hasPermission(P.ADMINISTRATOR)) {
      return;
    }

    // TODO: check if the bot has permission to do this stuff first?

    const { guild } = msg;
    const { roles, channels } = guild;

    // remove existing roles that have the same name
    // (it is possible to have two roles with the same name)
    roles.cache.forEach(async (role): Promise<void> => {
      if (role.name === "Participant" || role.name === "Moderator") {
        if (!role.editable) {
          console.warn("could not delete an uneditable role");
        } else {
          await role.delete("Bot setup command");
        }
      }
    });

    // create roles
    await roles.everyone.setPermissions(
      getPerms(),
      "Bot setup command",
    );

    await roles.create({
      data: {
        name: "Moderator",
        hoist: false,
        permissions: getPerms(P.ADMINISTRATOR),
        mentionable: false,
      },
      reason: "Bot setup command",
    });

    const participant = await roles.create({
      data: {
        name: "Participant",
        hoist: true,
        permissions: getPerms(P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY),
        mentionable: true,
      },
      reason: "Bot setup command",
    });

    // remove all existing channels
    channels.cache.forEach(async (channel): Promise<void> => {
      if (channel.type !== "category") {
        await channel.delete("Bot setup command");
      }
    });
    channels.cache.forEach(async (channel): Promise<void> => {
      if (channel.type === "category") {
        await channel.delete("Bot setup command");
      }
    });

    // create channels
    const isolation = await channels.create(
      "Isolation",
      {
        type: "category",
        permissionOverwrites: [
          {
            id: roles.everyone,
            allow: getPerms(P.VIEW_CHANNEL),
            type: "role",
          },
        ],
        reason: "Bot setup command",
      },
    );
    await channels.create(
      "isolation",
      {
        type: "voice",
        parent: isolation,
        reason: "Bot setup command",
      },
    );

    const general = await channels.create(
      "General",
      {
        type: "category",
        permissionOverwrites: [
          {
            id: participant,
            allow: getPerms(P.VIEW_CHANNEL),
            type: "role",
          },
        ],
        reason: "Bot setup command",
      },
    );
    await channels.create(
      "general-1",
      {
        type: "text",
        parent: general,
        reason: "Bot setup command",
      },
    );

    const moderation = await channels.create(
      "Moderation",
      {
        type: "category",
        reason: "Bot setup command",
      },
    );
    const generalMod = await channels.create(
      "moderation",
      {
        type: "text",
        parent: moderation,
        reason: "Bot setup command",
      },
    );

    // set settings
    await guild.edit(
      {
        verificationLevel: "LOW",
        explicitContentFilter: "ALL_MEMBERS",
        systemChannel: generalMod,
        defaultMessageNotifications: "MENTIONS",
        systemChannelFlags: noSystemMessages,
      },
      "Bot setup command",
    );
  },
};
