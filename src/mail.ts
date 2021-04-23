import { authenticate } from "@google-cloud/local-auth";
import { gmail, gmail_v1 } from "@googleapis/gmail";
import fs from "fs";
import path from "path";
// import util from "util";

import { config } from "./config";

const senderEmail = process.argv[process.argv.length-1];
console.log("sending from address:", senderEmail);

const auth = await authenticate({
  keyfilePath: path.join(process.cwd(), "auth.json"),
  scopes: [
    "https://www.googleapis.com/auth/gmail.send",
  ],
});
const mail = gmail({
  auth,
  version: "v1",
});
console.log("authenticated");

const sendEmail = async (
  senderName: string,
  senderAddress: string,
  recipient: string,
  subject: string,
  body: string,
): Promise<gmail_v1.Schema$Message> => {
  // https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/gmail/send.js
  const message = [
    `From: ${senderName} <${senderAddress}>`,
    `To: ${recipient}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "",
    body,
  ];

  const encoded = Buffer.from(message.join("\n")).toString("base64");
    // .replace("+", "-")
    // .replace("/", "_")
    // .replace(/=+$/, "");

  const res = await mail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
    },
  });

  console.log(`${recipient}: ${res.statusText}`);
  return res.data;
};

const baseMessage = fs.readFileSync("invite-message.html").toString();

for (const participant of config.invites.values()) {
  try {
    await sendEmail(
      "YRHacks",
      senderEmail,
      participant.email,
      "YRHacks Invite!",
      baseMessage
        .replace("{name}", participant.displayName)
        .replace("{code}", participant.code)
        .replace("{url}", participant.url),
    );
  } catch (e) {
    // console.log(util.inspect(e, true, 4, true));
    console.error(participant.email, e);
  }
}
