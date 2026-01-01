import "./global.js";

export default async (chatUpdate, conn) => {
    const m = chatUpdate.messages[0];
    m.chat = m.key.remoteJidAlt || m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.id = m.key.id;
    m.isGroup = m.chat?.endsWith("@g.us");
    m.isPrivate = !m.chat.endsWith("@g.us");
    m.isStatus = m.chat === "status@broadcast";
    m.isNewsletter = m.chat?.endsWith("@newsletter");
    m.sender = !m.isGroup ? m.chat : m.key.participantAlt || m.key.participant;
    m.userName = m.pushName || verifiedBizName || "";
    m.itsMe = m.sender === conn.user.id;
    m.isOwner = m.sender === `${global.owner.numberJid}@s.whatsapp.net`;

    m.groupMetadata = m.isGroup
        ? await conn.groupMetadata(m.chat).catch(err => null)
        : null;
    m.participants = m.groupMetadata?.participants || [];

    m.user = m.isGroup
        ? m.participants.find(
              u => u.phoneNumber === m.sender || u.id === m.sender
          )
        : {};
    m.isSAdmin = m.user?.admin === "superadmin";
    m.isAdmin = m.isSAdmin || m.user.admin === "admin";
    m.isBotAdmin =
        m.user?.phoneNumber === conn.user.id && m.user?.admin ? true : false;

    m.type = Object.keys(m.message);
    m.mtype =
        m.type?.find(
            t =>
                t !== "senderKeyDistributionMessage" &&
                t !== "messageContextInfo"
        ) || m.type[m.type.length - 1];

    m.msg = m.message[m.mtype];
    m.text =
        (typeof m.msg == "string" ? m.msg : m.msg?.text) ||
        m.msg?.caption ||
        m.msg?.contentText ||
        m.msg?.selectedDisplatText ||
        "";

    if (m.msg?.contextInfo?.quotedMessage) {
        const quoted = m.msg?.contextInfo?.quotedMessage;
        const typeQuote = Object.keys(quoted)[0];
        const msgQuote = quoted[typeQuote];

        m.quoted = {
            key: {
            remoteJid: m.chat,
            fromMe: m.msg?.contextInfo.participant === conn.user.id,
            id: m.id,
            participant: m.msg?.contextInfo.participant || m.sender,
            },
            type: typeQuote,
            msg: msgQuote,
            text:
                msgQuote.text ||
                msgQuote.caption ||
                msgQuote.conversation ||
                msgQuote.selectedDisplatText ||
                "",
            mime: msgQuote?.mimetype || ""
        };
    } else {
        m.quoted = null;
    }
    console.log(m);
};
