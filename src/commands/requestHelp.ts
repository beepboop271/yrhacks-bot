import {
  CategoryChannel,
  Channel,
  MessageEmbed,
  OverwriteData,
} from "discord.js";

import { Command } from "../command";
import { config } from "../config";
import { addTicket, fetchChannel } from "../db";
import { makeUserString, mention } from "../utils";

const isCategoryChannel = (channel: Channel): channel is CategoryChannel =>
  channel.type === "category";

const trailingMentions = /(?:<@(?:!|&|)\d+>\s*)*$/;

export const command: Command = {
  name: "request_help",
  title: "Request Help",
  description: "Creates a mentorship channel for the given participants, requesting the given mentors or mentors with the given topics to join",
  requiredPerms: [],
  requiresSetup: true,
  execute: async (_client, msg, _args, db): Promise<void> => {
    const { guild } = msg;

    const tickets = fetchChannel(guild, db.channels.tickets);
    if (tickets === undefined || !tickets.isText()) {
      return;
    }
    const mentorCategory = fetchChannel(guild, db.channels.Mentorship);
    if (mentorCategory === undefined || !isCategoryChannel(mentorCategory)) {
      return;
    }
    // "each parent category can contain up to 50 channels"
    // https://discord.com/developers/docs/resources/channel
    if (mentorCategory.children.size >= 50) {
      return;
    }

    const participants = [msg.member];
    const requests = msg.mentions.roles.map(mention);
    const keywords = msg.mentions.roles.map((role): string => role.name);

    for (const member of msg.mentions.members?.values() ?? []) {
      if (member.roles.cache.has(db.roles.participant)) {
        participants.push(member);
      } else if (member.roles.cache.has(db.roles.mentor)) {
        requests.push(mention(member));
      }
    }

    const content = msg.content.substring(
      msg.content.search(/\s/),  // remove command name
      msg.content.search(trailingMentions),
    ).trim();

    if (content.length === 0) {
      return;
    }
    if (content.search(/\s/) < 1) {
      return;
    }

    const topic = content.substring(0, content.search(/\s/)).trimEnd();
    const description = content.substring(content.search(/\s/)).trimStart();

    // channel name max: 100 chars
    // embed title max: 256 chars
    // all other limits will never be met because the command
    // is sent in a message and thus <=2000 chars
    // https://discordjs.guide/popular-topics/embeds.html#embed-limits
    if (topic.length > 100) {
      return;
    }

    const channel = await guild.channels.create(
      topic,
      {
        type: "text",
        parent: mentorCategory,
        permissionOverwrites: participants.map((member): OverwriteData => ({
          id: member.id,
          allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
          type: "member",
        })),
      },
    );

    const taggedDescription =
      keywords.length > 0
        ? `Search tags: ${keywords.join(" ")}\n\n${description}`
        : description;

    const embed = {
      title: topic,
      description: taggedDescription,
      color: config.ticketColours.new,
      timestamp: Date.now(),
      author: {
        name: makeUserString(msg.author),
      },
      footer: {
        text: `${msg.id} ${channel.id}`,
      },
    };

    const ticket = await tickets.send(
      requests.join(" "),
      new MessageEmbed(embed),
    );
    await ticket.react("✅");

    await addTicket(guild, channel.id, ticket.id);

    await channel.send(participants.map(mention).join(" "));
    await channel.send("Please wait for a mentor. You may elaborate more on your issue and upload files if you wish. Description provided:");

    // will never be >2000 chars because the command name is >4 chars
    await channel.send(
      `>>> ${description}`,
      { disableMentions: "everyone" },
    );
  },
};
