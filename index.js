import TelegramBot from "node-telegram-bot-api";
import express from "express";
import axios from "axios";

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const app = express();
app.get("/", (req, res) => res.send("Qwen2.5-VL Telegram Bot Running!"));
app.listen(process.env.PORT || 10000);

// ------------- HF API CALL FUNCTION ------------------
async function askHF(inputText, imgBuffer = null) {
  const endpoint = `https://api-inference.huggingface.co/models/${process.env.MODEL}`;

  const body = imgBuffer
    ? {
        inputs: {
          prompt: inputText,
          image: imgBuffer.toString("base64"),
        },
      }
    : { inputs: inputText };

  const res = await axios.post(endpoint, body, {
    headers: {
      Authorization: `Bearer ${process.env.HF_KEY}`,
      "Content-Type": "application/json",
    },
  });

  return res.data[0].generated_text || JSON.stringify(res.data);
}

// ------------- TEXT MESSAGE ------------------
bot.on("message", async (msg) => {
  if (msg.photo) return; // handled below

  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, "typing");

  try {
    const reply = await askHF(msg.text);
    bot.sendMessage(chatId, reply);
  } catch (e) {
    bot.sendMessage(chatId, "Error: " + e.message);
  }
});

// ------------- IMAGE MESSAGE ------------------
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, "upload_photo");

  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

    const img = await axios.get(fileUrl, { responseType: "arraybuffer" });

    const reply = await askHF("Describe this image in detail.", Buffer.from(img.data));

    bot.sendMessage(chatId, reply);
  } catch (e) {
    bot.sendMessage(chatId, "Image Error: " + e.message);
  }
});
