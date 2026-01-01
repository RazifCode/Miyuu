const {
    default: makeSocket,
    useMultiFileAuthState,
    Browsers,
    DisconnectReason
} = await import("@whiskeysockets/baileys");
import { Boom } from "@hapi/boom";
import pino from "pino";
import readline from "readline";
import NodeCache from "node-cache";
import chalk from "chalk";
import qrcode from "qrcode-terminal";

const msgRetryCounterCache = new NodeCache();
const { state, saveCreds } = await useMultiFileAuthState("./sessions");

global.conn = makeSocket({
    auth: state,
    logger: pino({ level: "fatal" }),
    defaultQueryTimeoutMs: undefined,
    msgRetryCounterCache
});

const pairingCode = true;

if (pairingCode && !conn.authState.creds.registered) {
    console.log(conn.authState.creds.registered + "\n");
    console.log(chalk.green("Masukkan nombor whatsapp anda"));
    const number = await new Promise(resolve =>
        readline
            .createInterface({
                input: process.stdin,
                output: process.stdout
            })
            .question("number: ", answer => resolve(answer))
    );
    console.log(chalk.yellow("membuat pairing code..."));
    const code = await conn.requestPairingCode(number);
    setTimeout(function () {
        console.log(chalk.bgGreen(" Your pairing code: "), chalk.white(code));
    }, 2000);
}

conn.ev.on("creds.update", saveCreds);
conn.ev.on("connection.update", async update => {
    const { connection, lastDisconnect, qr } = update;
    if (!pairingCode && qr) {
        qrcode.generate(qr, { small: true });
    }

    if (connection == "connecting")
        console.log(chalk.yellow("Menyambung ke whatsapp..."));

    if (connection == "open") {
        conn.user.id = `${conn.user.id.split(":")[0]}@s.whatsapp.net`;
        console.log(chalk.green("Connect"), chalk.white(conn.user.id));
    }

    if (connection == "close") {
        const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

        const restartConditions = [
            DisconnectReason.restartRequired,
            DisconnectReason.connectionClosed,
            DisconnectReason.connectionLost,
            DisconnectReason.timedOut
        ];

        if (restartConditions.includes(reason)) {
            console.log(chalk.red(`Connected tutup, ${reason}`));
            process.send("restart");
        } else if (reason == DisconnectReason.loggedOut) {
            console.log("Device keluar, sila scan atau pairing code lagi..");
            process.exit(1);
        } else {
            process.send("restart");
        }
    }
});

import messages from "./messages.js";

conn.ev.on("messages.upsert", chatUpdate => messages(chatUpdate, conn))