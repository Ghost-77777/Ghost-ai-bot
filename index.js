import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import MistralClient from "@mistralai/mistralai";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// FREE MODEL
const MISTRAL_MODEL = "mistral-tiny";

if (!TELEGRAM_TOKEN || !MISTRAL_API_KEY) {
  console.error("Missing TELEGRAM_TOKEN or MISTRAL_API_KEY");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("Bot Alive (Free Mistral Tiny Model)");
});

app.post("/telegram-webhook", async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) return res.send("no text");

    const chatId = message.chat.id;
    const userText = message.text;

    res.send("ok");

    await sendAction(chatId, "typing");

    const reply = await askAI(userText);
    await sendMessage(chatId, reply);

  } catch (e) {
    console.log("Webhook error:", e);
    res.send("error");
  }
});

// Send typing action
async function sendAction(chatId, action) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ chat_id: chatId, action })
  });
}

// Send message
async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    })
  });
}

// FREE MISTRAL AI CALL
async function askAI(prompt) {
  try {
    const client = new MistralClient(MISTRAL_API_KEY);

    const resp = await client.outputs({
      model: MISTRAL_MODEL,
      input: prompt
    });

    return (
      resp?.output?.[0]?.content?.[0]?.text ||
      "AI Error: Empty response"
    );
  } catch (e) {
    console.log("Mistral error:", e);
    return "AI Error";
  }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
