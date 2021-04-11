import Ajv, { ValidateFunction } from "ajv";
import fs from "fs";

// TODO: two sources of truth with the schema and TS interface
interface Config {
  prefix: string;
  wordlistFile?: string;

  wordlist: Set<string>;
}

// No way to statically type JSON in a meaningful way when we
// will just cast it to an interface right after anyways
// tslint:disable no-any no-unsafe-any

// Can't use JSON modules because it will be cached, need to use normal files
const readJsonFile = async (file: string): Promise<any> =>
  JSON.parse((await fs.promises.readFile(file)).toString());

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

const configSchema = new Ajv().compile(await readJsonFile("config-schema.json"));
const wordlistSchema = new Ajv().compile(await readJsonFile("wordlist-schema.json"));

// tslint:enable

const configPath = process.env.CONFIG_FILE!;

export let config: Config;

export const reloadConfig = async (): Promise<boolean> => {
  const data = await readJson(configPath, configSchema) as (Config | false);
  if (data === false) {
    return false;
  }

  data.wordlist = new Set();

  if (data.wordlistFile !== undefined) {
    const wordData = await readJson(
      data.wordlistFile,
      wordlistSchema,
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
