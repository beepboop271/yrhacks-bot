import { GuildChannel, GuildMember, Role } from "discord.js";

import { Command } from "../command";

export const command: Command = {
  name: "request_mentor",
  execute: async (_client, msg, _): Promise<void> => {
    if (msg.member === null || msg.guild === null) {
      return;
    }
    //TODO: get rid of hard code
    if (msg.member.roles.cache.find(r => r.name === "participant") === undefined) {
      return;
    }

    const teamMembers: GuildMember[] = [msg.member];
    const requestedMentors: GuildMember[] = [];
    const requestedTopics: Role[] = [];

    // roles mentioned (required)
    for (const role of msg.mentions.roles) {
      requestedTopics.push(role[1]); // TODO: validate the role is a mentoring topic role
    }
    // TODO: if requesting specific mentors its not a requirement to also mention topics
    if (requestedTopics.length === 0) {
      await msg.reply("Please mention at least 1 topic to request mentorship.");
      return;
    }

    // members mentioned (optional; can include team members and mentors)
    for (const user of msg.mentions.users) {
      //TODO: get rid of hard code
      if (msg.member.roles.cache.find(r => r.name === "mentor") !== undefined) {
        requestedMentors.push(msg.guild.member(user[1])!);
      //TODO: get rid of hard code
      } else if (msg.member.roles.cache.find(r => r.name === "participant") !== undefined) {
        teamMembers.push(msg.guild.member(user[1])!);
      }
    }
    if (requestedMentors.length === 0) {
      //TODO: get rid of hard code
      const mentorRole = msg.guild.roles.cache.find(role => role.name === "mentor")!;
      for (const m of mentorRole.members) {
        requestedMentors.push(m[1]);
      }
    }

    // find available mentors
    const availableMentors: GuildMember[] = [];
    for (const m of requestedMentors) {
      // For now, a mentor will only be qualified if they know all requested topics.
      // Alternative method: mentors are qualified if they are available + knowing at least 1 topic,
      //                     and the team will be assigned the mentor knowing the most requested topics.
      if ((m.roles.cache.find(r => r.name === "available") !== undefined) //TODO: get rid of hard code
          && (requestedTopics.every(topic => m.roles.cache.find(r => r.name === topic.name) !== undefined))) {
        availableMentors.push(m);
      }
    }

    if (availableMentors.length === 0) {
      if (requestedTopics.length !== 1) {
        await msg.reply("No mentor is available currently. Please reduce your required topics or try again later.");
      } else {
        await msg.reply("No mentor is available currently. Please try again later.");
      }
      return;
    }

    // pick the first one and create a private channel for the mentor and the team
    // (for the alt method the list will be sorted)
    const channel = await msg.guild.channels.create(
      "mentor-session",
      {
        type: "text",
        // TODO: get rid of hard code
        parent: msg.guild.channels.cache.find(c => c.name === "Mentorship" && c.type === "category"),
      },
    );

    const mentor: GuildMember = availableMentors[0];
    //TODO: get rid of hard code
    await mentor.roles.remove(msg.guild.roles.cache.find(role => role.name === "available")!);
    await channel.overwritePermissions([
      {
        id: mentor.id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
      },
    ]);
    for (const member of teamMembers) {
      await channel.overwritePermissions([
        {
          id: member.id,
          allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
        },
      ]);
    }
    const targetChannel: GuildChannel = msg.guild.channels.cache.get(channel.id)!;
    if (targetChannel.isText()) {
      await targetChannel.send("You may begin your mentorship session!");
    }
  },
};
