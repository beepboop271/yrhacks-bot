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
