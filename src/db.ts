import { Guild, GuildChannel, Role } from "discord.js";
import FileAsync from "lowdb/adapters/FileAsync";
import lowdb from "lowdb/lib/fp";

import { config } from "./config";

// hard to type this better since the specific roles/channels
// will somewhat depend on config, however the rest of the
// bot will probably hardcode strings that are written in
// config too (e.g. access role id of the "mentor" role)
// so not sure what to do...
interface GuildInfo {
  roles: {
    participant: string;
    available: string;
    mentor: string;
    [key: string]: string | undefined;
  };
  channels: {
    approvals: string;
    [key: string]: string;
  };
}

interface Schema {
  [key: string]: GuildInfo | undefined;
}

const adapter = new FileAsync<Schema>(config.dbFile);
export const db = await lowdb(adapter);

export const fetchGuild = (guild: Guild): GuildInfo | undefined => {
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

export const fetchChannel = (guild: Guild, id: string): GuildChannel | undefined => {
  const channel = guild.channels.resolve(id);
  if (channel === null) {
    console.warn(`channel ${id} is not in the right guild ${guild.id}`);
    return undefined;
  }
  return channel;
};
