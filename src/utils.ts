import { Channel, Guild, GuildMember, Message, Role, User } from "discord.js";

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
