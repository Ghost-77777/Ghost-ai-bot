import express from 'express';
import fetch from 'node-fetch';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config(); // GitHub secrets ya .env variables load

const app = express();
const port = process.env.PORT || 3000;

// Telegram bot setup
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply("Hello! I'm your AI bot 🤖"));
bot.help((ctx) => ctx.reply("Just type anything, I'll reply!"));

// Handle all text messages
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;

  try {
    const response = await fetch('https://api.mistral.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: userMessage,
        max_tokens: 200
      })
    });

    const data = await response.json();
    ctx.reply(data.text || "Sorry, couldn't generate response 😅");
  } catch (err) {
    console.error(err);
    ctx.reply("Error occurred, try again later 😢");
  }
});

// Start bot
bot.launch();
console.log("Telegram bot running...");

// Express server for website status & uptime ping
app.get('/', (req, res) => {
  res.send("Bot is running ✅");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
