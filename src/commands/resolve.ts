import { Command } from "../command";
import { removeTicket } from "../db";

export const command: Command = {
  name: "resolve",
  title: "Resolve Mentor Session",
  description: "Deletes the current mentorship channel and removes it from the ticket list",
  requiredPerms: [],
  requiresSetup: true,
  execute: async (_client, msg, _args, db): Promise<void> => {
    if (msg.channel.type !== "text") {
      return;
    }
    const { channel } = msg;

    if (channel.parent?.id === db.channels.Mentorship) {
      return;
    }

    const msgId = db.tickets[channel.id];
    if (msgId === undefined) {
      return;
    }

    await channel.send("Session is ending! This channel will be deleted in 10 seconds");
    // TODO: no floating promise, also delay doesn't work?
    // delay works sometimes????
    setTimeout(channel.delete.bind(channel), 10000);

    const tickets = msg.guild.channels.resolve(db.channels.tickets);
    if (tickets === null || !tickets.isText()) {
      return;
    }

    await tickets.messages.delete(msgId, `Marked resolved by ${msg.id}`);
    await removeTicket(msg.guild, channel.id, msgId);
  },
};
