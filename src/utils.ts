import { Channel, EmbedFieldData, Guild, GuildMember, Message, MessageEmbed, Role, User } from "discord.js";

import { Command } from "./command";
import { config } from "./config";

export class GuildMessage extends Message {
  // copy of Message but with guild and member
  // overridden to be non-null
  public readonly guild!: Guild;
  public readonly member!: GuildMember;
}

export const isGuildMessage = (msg: Message): msg is GuildMessage =>
  msg.guild !== null && msg.member !== null;

export const makeUserString = (user: User): string =>
  `${user.username}#${user.discriminator} (${user.id})`;

export const mention = (thing: Role | Channel | User | GuildMember): string => {
  if (thing instanceof Role) {
    return `<@&${thing.id}>`;
  }
  if (thing instanceof Channel) {
    return `<#${thing.id}>`;
  }
  return `<@${thing.id}>`;
};

export const sendCommandFeedback = async (
  msg: Message,
  command: Command,
  fields: EmbedFieldData[],
): Promise<void> => {
  await msg.channel.send(new MessageEmbed({
    description: `${mention(msg.author)} **${config.prefix}${command.name}**`,
    fields,
    timestamp: Date.now(),
    footer: {
      text: msg.id,
    },
  }));
};
