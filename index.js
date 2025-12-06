// index.js

require('dotenv').config(); // Environment variables load karega (Local testing ke liye)
const express = require('express');
const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');

// --- Configuration ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Render ka URL environment se milta hai
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = `/webhook/${BOT_TOKEN}`; // Unique path for security

if (!BOT_TOKEN || !GEMINI_API_KEY || !WEBHOOK_URL) {
    console.error("FATAL: Required environment variables are missing.");
    process.exit(1);
}

// Gemini Client Setup
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash';

// Telegraf Bot Setup
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middleware: Express ko JSON requests handle karne ke liye
app.use(express.json());

// --- Telegram Handlers ---

// /start command
bot.start((ctx) => {
    ctx.reply(`Hello ${ctx.from.first_name}! I'm a Gemini-powered bot running on Node.js. Ask me anything!`);
});

// Text messages handle karna
bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    console.log(`Received: ${userMessage}`);

    try {
        // Gemini API call
        const response = await ai.models.generateContent({
            model: modelName,
            contents: userMessage,
        });

        const aiResponse = response.text;
        
        // Telegram par reply karna
        ctx.reply(aiResponse);
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        ctx.reply("Sorry, AI response generate karte waqt error aa gaya.");
    }
});

// --- Webhook Configuration ---

// 1. Webhook Route (POST)
// Yeh Express route Telegram se updates receive karega
app.post(WEBHOOK_PATH, (req, res) => {
    // Telegraf ko update process karne ke liye dena
    bot.handleUpdate(req.body, res); 
});

// 2. Health Check / Index Route (GET)
app.get('/', (req, res) => {
    res.status(200).json({ status: "ok", service: "Node.js Webhook Bot", model: modelName });
});

// 3. Webhook Setter Function
async function setBotWebhook() {
    const fullWebhookUrl = `${WEBHOOK_URL}${WEBHOOK_PATH}`;

    // Telegram ko Webhook URL set karna
    await bot.telegram.setWebhook(fullWebhookUrl); 
    console.log(`Webhook set successfully to: ${fullWebhookUrl}`);
}

// --- Start Server ---
async function startServer() {
    // Webhook set karna
    await setBotWebhook();
    
    // Express server start karna
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();

// Exports 'app' for potential external use (though not strictly needed for this simple setup)
module.exports = app; 
