import { Channel, EmbedFieldData, Guild, GuildMember, Message, MessageEmbed, Role, User } from "discord.js";

import { Command } from "./command";
import { config } from "./config";
import { getCode } from "./db";

export class GuildMessage extends Message {
  // copy of Message but with guild and member
  // overridden to be non-null
  public override readonly guild!: Guild;
  public override readonly member!: GuildMember;
}

export const isGuildMessage = (msg: Message): msg is GuildMessage =>
  msg.guild !== null && msg.member !== null;

export const makeUserString = (user: User | string): string => {
  if (typeof user === "string") {
    return `${user} (${getCode(user) ?? ""})`;
  }
  return `${user.tag} (${user.id}) (${getCode(user.id) ?? ""})`;
};

export const mention = (thing: Role | Channel | User | GuildMember): string => {
  if (thing instanceof Role) {
    return `<@&${thing.id}>`;
  }
  if (thing instanceof Channel) {
    return `<#${thing.id}>`;
  }
  return `<@${thing.id}>`;
};

export const disableEmbed = (link: string): string => `<${link}>`;

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
