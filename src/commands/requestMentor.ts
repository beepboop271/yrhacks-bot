import { GuildMember, OverwriteData, Role } from "discord.js";

import { Command } from "../command";
import { fetchChannel, fetchGuild, fetchRole } from "../db";

export const command: Command = {
  name: "request_mentor",
  execute: async (_client, msg, _args): Promise<void> => {
    if (msg.member === null || msg.guild === null) {
      return;
    }

    const { member, guild } = msg;

    const db = fetchGuild(guild);
    if (db === undefined) {
      return;
    }
    if (!member.roles.cache.has(db.roles.participant)) {
      return;
    }

    const teamMembers: GuildMember[] = [msg.member];
    const requestedMentors: GuildMember[] = [];

    // roles mentioned (required)
    // TODO: validate the role is a mentoring topic role
    const requestedTopics: Role[] = [...msg.mentions.roles.values()];

    // TODO: if requesting specific mentors its not a requirement to also mention topics
    if (requestedTopics.length === 0) {
      await msg.reply("Please mention at least 1 topic to request mentorship.");
      return;
    }

    // members mentioned (optional; can include team members and mentors)
    for (const user of msg.mentions.users.values()) {
      const mentioned = guild.member(user);
      if (mentioned === null) {
        return;
      }

      if (mentioned.roles.cache.has(db.roles.mentor)) {
        requestedMentors.push(mentioned);
      } else if (mentioned.roles.cache.has(db.roles.participant)) {
        teamMembers.push(mentioned);
      }
    }

    if (requestedMentors.length === 0) {
      const mentorRole = fetchRole(guild, db.roles.mentor);
      if (mentorRole === undefined) {
        return;
      }

      requestedMentors.push(...mentorRole.members.values());
    }

    // find available mentors
    const availableMentors: GuildMember[] = [];
    for (const m of requestedMentors) {
      // For now, a mentor will only be qualified if they know all requested topics.
      // Alternative method: mentors are qualified if they are available + knowing at least 1 topic,
      //                     and the team will be assigned the mentor knowing the most requested topics.
      if (
        m.roles.cache.has(db.roles.available)
        && requestedTopics.every((topic): boolean => m.roles.cache.has(topic.id))
      ) {
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

    const mentorCategory = fetchChannel(guild, db.channels.Mentorship);
    if (mentorCategory === undefined) {
      return;
    }

    // pick the first one and create a private channel for the mentor and the team
    // (for the alt method the list will be sorted)
    const mentor: GuildMember = availableMentors[0];
    const channel = await msg.guild.channels.create(
      "mentor-session",
      {
        type: "text",
        parent: mentorCategory,
        permissionOverwrites: [
          {
            id: mentor.id,
            allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
            type: "member",
          },
          ...teamMembers.map((teamMember): OverwriteData => ({
            id: teamMember.id,
            allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
            type: "member",
          })),
        ],
      },
    );

    await mentor.roles.remove(db.roles.available);
    await channel.send("You may begin your mentorship session!");
  },
};
