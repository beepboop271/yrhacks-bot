import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";

const ajv = addFormats(new Ajv());

// TODO: two sources of truth with the schema and TS interface

// could replace with the real type from the library, but then
// it might update without our schema files updating
type PermissionString =
  | "CREATE_INSTANT_INVITE" | "KICK_MEMBERS" | "BAN_MEMBERS"
  | "ADMINISTRATOR" | "MANAGE_CHANNELS" | "MANAGE_GUILD"
  | "ADD_REACTIONS" | "VIEW_AUDIT_LOG" | "PRIORITY_SPEAKER"
  | "STREAM" | "VIEW_CHANNEL" | "SEND_MESSAGES"
  | "SEND_TTS_MESSAGES" | "MANAGE_MESSAGES" | "EMBED_LINKS"
  | "ATTACH_FILES" | "READ_MESSAGE_HISTORY" | "MENTION_EVERYONE"
  | "USE_EXTERNAL_EMOJIS" | "VIEW_GUILD_INSIGHTS" | "CONNECT"
  | "SPEAK" | "MUTE_MEMBERS" | "DEAFEN_MEMBERS" | "MOVE_MEMBERS"
  | "USE_VAD" | "CHANGE_NICKNAME" | "MANAGE_NICKNAMES"
  | "MANAGE_ROLES" | "MANAGE_WEBHOOKS" | "MANAGE_EMOJIS";

export interface OverwriteConfig {
  id: string[];
  allow: PermissionString[];
}

interface ChannelConfig {
  name: string;
  permissionOverwrites?: OverwriteConfig[];
  topic?: string;
  type?: "text" | "voice" | "news" | "store";
}

interface CategoryConfig {
  name: string;
  permissionOverwrites?: OverwriteConfig[];
  channels?: ChannelConfig[];
}

interface RoleConfig {
  name: string;
  color: string;
  hoist?: boolean;
  permissions?: PermissionString[];
  mentionable?: boolean;
}

interface InviteData {
  email: string;
  displayName: string;
  name: string;
  id: string;
  url: string;
  code: string;
}

interface Config {
  prefix: string;
  enableSetup: boolean;
  ticketColours: {
    new: string;
    old: string;
  };
  markerRoleColour: string;
  channelFile: string;
  dbFile: string;
  dbUserFile: string;
  roleFile: string;
  wordlistFile: string;
  invitesFile: string;

  channels: CategoryConfig[];
  roles: RoleConfig[];
  wordlist: Set<string>;
  invites: Map<string, InviteData>;
}

// No way to statically type JSON in a meaningful way when we
// will just cast it to an interface right after anyways
// tslint:disable no-any no-unsafe-any

// Can't use JSON modules because it will be cached, need to use normal files
const readJsonFile = async (file: string): Promise<any> =>
  JSON.parse((await fs.promises.readFile(file)).toString());

export const readJsonSchema = async (name: string): Promise<ValidateFunction> =>
  ajv.compile(await readJsonFile(`schemas/${name}-schema.json`));

export const readJson = async (
  file: string,
  schema: ValidateFunction,
): Promise<any> => {
  const data = await readJsonFile(file);
  if (!schema(data)) {
    console.log(schema.errors);
    return false;
  }
  return data;
};
// tslint:enable

const configPath = process.env.CONFIG_FILE!;

export let config: Config;

export const reloadConfig = async (): Promise<boolean> => {
  const data = await readJson(
    configPath,
    await readJsonSchema("config"),
  ) as (Config | false);

  if (data === false) {
    return false;
  }

  const channelData = await readJson(
    data.channelFile,
    await readJsonSchema("channels"),
  ) as (CategoryConfig[] | false);

  data.channels = channelData !== false ? channelData : [];

  const roleData = await readJson(
    data.roleFile,
    await readJsonSchema("roles"),
  ) as (RoleConfig[] | false);

  data.roles = roleData !== false ? roleData : [];

  data.wordlist = new Set();
  const wordData = await readJson(
    data.wordlistFile,
    await readJsonSchema("wordlist"),
  ) as (string[] | false);

  if (wordData !== false) {
    for (const word of wordData) {
      data.wordlist.add(word);
    }
  }

  data.invites = new Map();
  const invitesData = await readJson(
    data.invitesFile,
    await readJsonSchema("invite-data"),
  ) as ({ [code: string]: InviteData | undefined } | false);

  if (invitesData !== false) {
    for (const code of Object.keys(invitesData)) {
      data.invites.set(code, invitesData[code]!);  // it must be a key
    }
  }

  config = data;

  return true;
};

if (!(await reloadConfig())) {
  process.exit(1);
}
