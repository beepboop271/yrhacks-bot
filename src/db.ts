import { Guild, GuildChannel, Role } from "discord.js";
import fp from "lodash/fp";
import FileAsync from "lowdb/adapters/FileAsync";
import lowdb from "lowdb/lib/fp";
const { set, unset } = fp;

import { config } from "./config";

// hard to type this better since the specific roles/channels
// will somewhat depend on config, however the rest of the
// bot will probably hardcode strings that are written in
// config too (e.g. access role id of the "mentor" role)
// so not sure what to do...
export interface DbGuildInfo {
  roles: {
    participant: string;
    mentor: string;
    pending: string;
    // role name -> id
    [roleName: string]: string | undefined;
  };
  channels: {
    approvals: string;
    Mentorship: string;
    tickets: string;
    log: string;
    isolation: string;
    // channel name -> id
    [channelName: string]: string | undefined;
  };
  markerRoles: {
    [roleName: string]: string | undefined;
  };
  tickets: {
    // help channel id -> ticket message id
    // ticket message id -> help channel id
    [id: string]: string | undefined;
  };
}

export interface DbUserInfo {
  users: {
    // user id -> unique invite code
    [id: string]: string | undefined;
  };
  codes: {
    // unique invite code -> user id
    [code: string]: string | undefined;
  };
}

interface DbSchema {
  [key: string]: DbGuildInfo | undefined;
}

const adapter = new FileAsync<DbSchema>(config.dbFile);
export const db = await lowdb(adapter);

const userAdapter = new FileAsync<DbUserInfo>(config.dbUserFile);
export const dbUser = await lowdb(userAdapter);

export const initGuild = async (guild: Guild): Promise<void> => {
  const guildDb = db(guild.id);
  await guildDb.write(set("roles", { }));
  await guildDb.write(set("channels", { }));
  await guildDb.write(set("markerRoles", { }));
  await guildDb.write(set("tickets", { }));
};

export const fetchGuild = (guild: Guild): DbGuildInfo | undefined => {
  const guildDb = db.getState()[guild.id];
  if (guildDb === undefined) {
    console.warn(`guild ${guild.id} (${guild.name}) not setup properly`);
  }
  return guildDb;
};

export const fetchRole = (guild: Guild, id: string): Role | undefined => {
  const role = guild.roles.resolve(id);
  if (role === null) {
    console.warn(`role ${id} is not in the right guild ${guild.id}`);
    return undefined;
  }
  return role;
};

export const addMarkerRole = async (
  guild: Guild,
  role: Role,
): Promise<void> => {
  const rolesDb = db(`${guild.id}.markerRoles`);
  await rolesDb.write(set(role.name, role.id));
};

export const removeMarkerRole = async (
  guild: Guild,
  role: string,
): Promise<void> => {
  const rolesDb = db(`${guild.id}.markerRoles`);
  await rolesDb.write(unset(role));
};

export const addTicket = async (
  guild: Guild,
  channelId: string,
  messageId: string,
): Promise<void> => {
  const ticketsDb = db(`${guild.id}.tickets`);
  await ticketsDb.write(set(channelId, messageId));
  await ticketsDb.write(set(messageId, channelId));
};

export const removeTicket = async (
  guild: Guild,
  channelId: string,
  messageId: string,
): Promise<void> => {
  const ticketsDb = db(`${guild.id}.tickets`);
  await ticketsDb.write(unset(channelId));
  await ticketsDb.write(unset(messageId));
};

export const fetchChannel = (
  guild: Guild,
  id: string,
): GuildChannel | undefined => {
  const channel = guild.channels.resolve(id);
  if (channel === null) {
    console.warn(`channel ${id} is not in the right guild ${guild.id}`);
    return undefined;
  }
  return channel;
};

export const getUsers = (): DbUserInfo => dbUser.getState();

export const addUser = async (code: string, user: string): Promise<void> => {
  await dbUser("codes").write(set(code, user));
  await dbUser("users").write(set(user, code));
};

export const getCode = (id: string): string | undefined =>
  dbUser.getState().users[id];
