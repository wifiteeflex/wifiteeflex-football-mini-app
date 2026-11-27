import admin from "firebase-admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL =
  process.env.MINI_APP_URL || "https://t.me/LiveFootballMiniApp_bot";
const SERVICE_ACCOUNT_RAW = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!BOT_TOKEN || !SERVICE_ACCOUNT_RAW) {
  console.error("Missing TELEGRAM_BOT_TOKEN or FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

const serviceAccount = JSON.parse(SERVICE_ACCOUNT_RAW);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

async function sendTelegramAlert(chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Open Chat Room Mate 2", url: MINI_APP_URL }]]
      }
    })
  });

  return res.ok;
}

async function run() {
  // Check messages created in the last 10 minutes
  const cutoff = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 10 * 60 * 1000)
  );

  const snap = await db
    .collection("tma_chat")
    .where("createdAt", ">=", cutoff)
    .get();

  for (const doc of snap.docs) {
    const msg = doc.data() || {};
    if (msg.replyNotified === true) continue;

    const replyTo = msg.replyTo;
    if (!replyTo || !replyTo.userId) continue;

    const targetUserId = String(replyTo.userId).trim();
    const senderId = String(msg.userId || "").trim();

    if (
      !targetUserId ||
      targetUserId === senderId ||
      targetUserId.startsWith("guest_") ||
      !/^\d+$/.test(targetUserId)
    ) {
      continue;
    }

    const replierName = escapeHtml(msg.userName || "Someone");
    const replyText = escapeHtml(msg.text || "Sent a reply");
    const originalText = escapeHtml(replyTo.text || "your message");

    const alertText =
      `🔔 <b>New Reply on Chat Room Mate 2</b>\n` +
      `<b>${replierName}</b> replied to <i>"${originalText}"</i>:\n` +
      `"${replyText}"`;

    const sent = await sendTelegramAlert(targetUserId, alertText);
    if (sent) {
      await doc.ref.update({ replyNotified: true });
      console.log(`Notified ${targetUserId} for message ${doc.id}`);
    }
  }
}

run().catch((err) => {
  console.error("Notifier error:", err);
  process.exit(1);
});
