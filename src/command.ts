import { Client, Message } from "discord.js";

export interface Command {
  name: string;
  execute(client: Client, msg: Message, args: string[]): void;
}
