import Ajv, { ValidateFunction } from "ajv";
import fs from "fs";

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

interface OverwriteConfig {
  id: string[];
  allow: PermissionString[];
}

interface ChannelConfig {
  name: string;
  topic: string;
  permissionOverwrites: OverwriteConfig[];
}

interface CategoryConfig {
  name: string;
  permissionOverwrites: OverwriteConfig[];
  channels: ChannelConfig[];
}

interface RoleConfig {
  name: string;
  hoist: boolean;
  permissions: PermissionString[];
  mentionable: boolean;
}

interface Config {
  prefix: string;
  channelFile?: string;
  roleFile?: string;
  wordlistFile?: string;

  channels: CategoryConfig[];
  roles: RoleConfig[];
  wordlist: Set<string>;
}

// No way to statically type JSON in a meaningful way when we
// will just cast it to an interface right after anyways
// tslint:disable no-any no-unsafe-any

// Can't use JSON modules because it will be cached, need to use normal files
const readJsonFile = async (file: string): Promise<any> =>
  JSON.parse((await fs.promises.readFile(file)).toString());

const readJsonSchema = async (name: string): Promise<ValidateFunction> =>
  new Ajv().compile(await readJsonFile(`schemas/${name}-schema.json`));

const readJson = async (
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

  data.channels = [];
  if (data.channelFile !== undefined) {
    const channelData = await readJson(
      data.channelFile,
      await readJsonSchema("channels"),
    ) as (CategoryConfig[] | false);

    if (channelData !== false) {
      data.channels = channelData;
    }
  }

  data.roles = [];
  if (data.roleFile !== undefined) {
    const roleData = await readJson(
      data.roleFile,
      await readJsonSchema("roles"),
    ) as (RoleConfig[] | false);

    if (roleData !== false) {
      data.roles = roleData;
    }
  }

  data.wordlist = new Set();
  if (data.wordlistFile !== undefined) {
    const wordData = await readJson(
      data.wordlistFile,
      await readJsonSchema("wordlist"),
    ) as (string[] | false);

    if (wordData !== false) {
      for (const word of wordData) {
        data.wordlist.add(word);
      }
    }
  }

  config = data;

  return true;
};

if (!(await reloadConfig())) {
  process.exit(1);
}
