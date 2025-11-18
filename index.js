import express from "express";
import { Telegraf } from "telegraf";
import fetch from "node-fetch";

// INIT BOT
const bot = new Telegraf(process.env.BOT_TOKEN);

// HuggingFace Models
const HF_API = process.env.HF_API;
const QWEN = "Qwen/Qwen2.5-1.5B-Instruct";
const VISION = "OpenGVLab/InternVL2-1B";

// HF — Qwen text query
async function askQwen(prompt) {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${QWEN}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    }
  );

  const data = await res.json();
  return data[0]?.generated_text || "No response";
}

// HF — InternVL2 image inspect
async function askVision(imageBuffer) {
  const base64 = imageBuffer.toString("base64");

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${VISION}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: {
          image: base64,
          text: "Describe this image in detail."
        }
      })
    }
  );

  const data = await res.json();
  return data.generated_text || JSON.stringify(data);
}

/////////////////////////////////////////
//            BOT HANDLERS
/////////////////////////////////////////

bot.start((ctx) => ctx.reply("✅ AI Bot (Webhook) is LIVE!"));

// TEXT → Qwen
bot.on("text", async (ctx) => {
  const msg = ctx.message.text;

  await ctx.reply("⏳ Processing...");
  const reply = await askQwen(msg);
  await ctx.reply(reply);
});

// IMAGE → InternVL2
bot.on("photo", async (ctx) => {
  await ctx.reply("🖼️ Analyzing image...");

  const fileId = ctx.message.photo.pop().file_id;
  const link = await ctx.telegram.getFileLink(fileId);

  const response = await fetch(link.href);
  const buffer = Buffer.from(await response.arrayBuffer());

  const result = await askVision(buffer);
  await ctx.reply(result);
});

/////////////////////////////////////////
//          EXPRESS WEBHOOK
/////////////////////////////////////////

const app = express();
app.use(express.json());

// Webhook endpoint
app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("🤖 Telegram AI Bot Webhook Running!");
});

// Start server
app.listen(process.env.PORT, async () => {
  console.log("🚀 Server Started");

  const webhookURL = `${process.env.RENDER_EXTERNAL_URL}/webhook/${process.env.BOT_TOKEN}`;

  try {
    await bot.telegram.setWebhook(webhookURL);
    console.log("🔗 Webhook set:", webhookURL);
  } catch (err) {
    console.error("Webhook Error:", err);
  }
});
