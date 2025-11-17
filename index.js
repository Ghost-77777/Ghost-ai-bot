import 'dotenv/config';
import express from 'express';
import { Telegraf } from 'telegraf';
import { Mistral } from "@mistralai/client-ts";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-medium-latest";
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;
const WEBHOOK_SECRET_PATH = process.env.WEBHOOK_SECRET_PATH || "/telegram-webhook-secret";

if (!BOT_TOKEN || !MISTRAL_API_KEY) {
  console.error("Missing BOT_TOKEN or MISTRAL_API_KEY");
  process.exit(1);
}

const mistral = new Mistral({ apiKey: MISTRAL_API_KEY });
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply("Hello! I'm your Mistral AI bot 🤖.\nSend me anything!"));
bot.help((ctx) => ctx.reply("Just send a message 😄"));

bot.on("text", async (ctx) => {
  try {
    const text = ctx.message.text;

    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

    const res = await mistral.chat.complete({
      model: MISTRAL_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: text }
      ],
      max_tokens: 512,
      temperature: 0.2
    });

    const reply =
      res?.choices?.[0]?.message?.content ??
      res?.choices?.[0]?.text ??
      "No reply";

    ctx.reply(reply.slice(0, 4000));
  } catch (err) {
    console.error(err);
    ctx.reply("⚠️ Error talking to AI.");
  }
});

const app = express();
app.use(express.json());

app.post(WEBHOOK_SECRET_PATH, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/", (req, res) => res.send("Bot running..."));

app.listen(PORT, async () => {
  console.log("Running on", PORT);

  if (BASE_URL) {
    const url = BASE_URL + WEBHOOK_SECRET_PATH;
    console.log("Setting webhook:", url);
    try {
      await bot.telegram.setWebhook(url);
      console.log("Webhook set!");
    } catch (err) {
      console.error("Webhook error:", err);
    }
  }
});
