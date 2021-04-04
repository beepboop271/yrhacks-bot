import Ajv from "ajv";
import fs from "fs";

// TODO: two sources of truth with the schema and TS interface
interface Config {
  prefix: string;
}

// No way to statically type JSON in a meaningful way
// tslint:disable-next-line: no-any no-unsafe-any
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file).toString());

// tslint:disable-next-line: no-unsafe-any
const validate = new Ajv().compile(readJson("config-schema.json"));

const configPath = process.env.CONFIG_FILE!;

// Can't use JSON modules because it will be cached
export let config = readJson(configPath) as Config;
if (!validate(config)) {
  console.log(validate.errors);
  process.exit(1);
}

export const reloadConfig = async (): Promise<boolean> => {
  const data = readJson(configPath) as Config;
  if (!validate(data)) {
    console.log(validate.errors);
    return false;
  }
  config = data;
  return true;
};
