import { Telegraf } from "telegraf";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const bot = new Telegraf(process.env.BOT_TOKEN);
const HF_API = process.env.HF_API;

const QWEN = process.env.QWEN_MODEL;
const VISION = process.env.VISION_MODEL;

// HF text request
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
  return data[0]?.generated_text || "Error: No response";
}

// HF vision request
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
          text: "Explain this image in detail"
        }
      })
    }
  );

  const data = await res.json();
  return data.generated_text || JSON.stringify(data);
}

// --------------- BOT HANDLERS ---------------

// TEXT HANDLER → Qwen
bot.on("text", async (ctx) => {
  const msg = ctx.message.text;

  try {
    await ctx.reply("⏳ Thinking...");
    const reply = await askQwen(msg);
    await ctx.reply(reply);
  } catch (e) {
    await ctx.reply("Error: " + e.message);
  }
});

// IMAGE HANDLER → InternVL2
bot.on("photo", async (ctx) => {
  await ctx.reply("🖼️ Image received, analyzing...");

  const fileId = ctx.message.photo.pop().file_id;
  const link = await ctx.telegram.getFileLink(fileId);

  const res = await fetch(link.href);
  const buffer = Buffer.from(await res.arrayBuffer());

  try {
    const result = await askVision(buffer);
    await ctx.reply(result);
  } catch (e) {
    await ctx.reply("Error: " + e.message);
  }
});

// START BOT
bot.launch();
console.log("BOT RUNNING...");
