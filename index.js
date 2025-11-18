import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const MISTRAL_API = process.env.MISTRAL_API;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ---- AI RESPONSE ----
async function askMistral(prompt) {
  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${MISTRAL_API}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (e) {
    return "AI Error ❌";
  }
}

// ---- TELEGRAM BOT ----
bot.on("message", async (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;

  const reply = await askMistral(text);
  bot.sendMessage(chatId, reply);
});

// ---- WEB SERVER FOR RENDER + UPTIME ROBOT ----
app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});

app.listen(PORT, () => console.log("Server running on PORT " + PORT));
