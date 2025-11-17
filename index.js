import express from "express";
import { Telegraf } from "telegraf";
import MistralClient from "@mistralai/mistralai";

// --------------------------
// ENV VARIABLES
// --------------------------
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;

if (!BOT_TOKEN || !MISTRAL_KEY) {
  console.log("❌ ENV variables missing!");
  process.exit(1);
}

// Telegram bot
const bot = new Telegraf(BOT_TOKEN);

// Mistral Client
const client = new MistralClient(MISTRAL_KEY);

// --------------------------
// AI Reply Function
// --------------------------
async function askMistral(prompt) {
  try {
    const response = await client.chat.complete({
      model: "mistral-tiny",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.log("AI Error:", err);
    return "⚠️ Error: Mistral API unreachable.";
  }
}

// --------------------------
// Telegram Bot Logic
// --------------------------
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  await ctx.reply("⌛ Thinking...");

  const aiResponse = await askMistral(userMessage);
  await ctx.reply(aiResponse);
});

// --------------------------
// Web Server (for Render ping)
// --------------------------
const app = express();
app.get("/", (req, res) => {
  res.send("AI Bot Running.");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Render server live");
});

// Start Bot
bot.launch();
console.log("🤖 Telegram AI Bot Running...");
