require('dotenv').config();
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk'); // Google gaya, ab Groq aaya!

// ==================== TOKENS & KEYS ====================
const BOT_TOKEN = process.env.TELE_BOT_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Yahan Groq ki key daalna
// =======================================================


const bot = new Telegraf(BOT_TOKEN);
const groq = new Groq({ apiKey: GROQ_API_KEY });

// 🔥 MEMORY SYSTEM: Har chat ki history store karne ke liye
const chatHistoryMemory = {};

const SYSTEM_INSTRUCTION = 
    `You are a chill, witty, and natural Indian college guy (3D Artist/Group Manager) inside a Telegram group. ` +
    `Your language MUST be 100% natural, grammatically correct Hinglish (the exact way North Indian college friends talk). Do NOT frame broken or weird sentences. ` +
    
    `[TONE & SLANG RULES]: ` +
    `- Speak normally, casually, and with high wit. Use casual slangs (like 'bhai', 'saale', 'bakchodi', 'gandu','lant','chutiya','lawda','rand','pervert') ONLY when appropriate to express shock, humor, or teasing. ` +
    `- DO NOT abuse or use slangs in every single sentence. It should feel smooth and natural, not forced or spammy. ` +
    `- Never sound like a formal robot. Match the user's energy. ` +

    `[ABOUT RITESH & EXCLUSIVE GOSSIP]: ` +
    `- Ritesh is the bot owner, a 3D environment artist, YouTube creator, and a B.Tech student at RTU (6th sem). ` +
    `- **SECRET INFO**: Ritesh has a girlfriend named Asmi Bhandari, who is 5 years older than him! ` +
    `- **STRICT DISCLOSURE RULE**: If someone asks normally about Ritesh/Admin, only tell them about his 3D art/RTU college. ` +
    `- ONLY if someone specifically teases or digs deep into his personal life (like asking about 'Ritesh ki setting', 'Ritesh ki gf', 'Asmi', etc.), then leak the 5-year age gap info in a hilarious, legendary backbencher teasing style. Otherwise, keep it 100% hidden. ` +

    `[GENERAL Creative Style]: ` +
    `- Talk about any software (Maya, Unreal Engine, Blender) or general casual topics based on what the user says. Don't force Blender everywhere. ` +
    `- Keep responses short, precise, and practical. Use emojis like 😎, 💀, 🤣 naturally.`;
// 1. /start command
bot.start((ctx) => {
    ctx.replyWithMarkdownV2(`*hello brother\\!* 😎\n\nMain is group ko manage karne mein help karunga\\.`);
});

// 2. Welcome Message
bot.on('new_chat_members', (ctx) => {
    ctx.message.new_chat_members.forEach((member) => {
        if (member.username === 'three_dimen_group_bot') return;
        ctx.reply(`Oi ${member.first_name}! Welcome to the group. 🙌 Intro de do jaldi se!`);
    });
});

// 3. FAST REPLY: Normal 'Hi Hello'
bot.hears(['hi', 'hello', 'hey', 'Hi', 'Hello', 'HEY', 'Oi', 'oi'], (ctx) => {
    ctx.reply(`Aur bhai! Kya haal-chaal? 😎`);
});

// 4. AI Chat Engine with MEMORY 🧠
bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;

    const chatId = ctx.chat.id; // Unique ID har group ya personal chat ke liye
    const userMessageText = ctx.message.text.toLowerCase();
    const rawMessage = ctx.message.text;
    const userName = ctx.message.from.first_name || 'Bhai';
    const BOT_USERNAME = 'three_dimen_group_bot'; 

    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    
    let isMentioned = false;
    if (ctx.message.entities) {
        isMentioned = ctx.message.entities.some(
            entity => entity.type === 'mention' && 
            rawMessage.substring(entity.offset, entity.offset + entity.length) === `@${BOT_USERNAME}`
        );
    }

    const isReplyToBot = ctx.message.reply_to_message && ctx.message.reply_to_message.from.username === BOT_USERNAME;
    const keywords = ['bot', 'manager', 'manager bot','oi','danish ', 'three_dimen_group_bot'];
    const containsName = keywords.some(keyword => userMessageText.includes(keyword));

    if (isGroup && !isMentioned && !isReplyToBot && !containsName) return;

    try {
        await ctx.sendChatAction('typing');

        // 🧠 MEMORY INITIALIZE: Agar is chat ki pehle koi history nahi hai toh khali array banao
        if (!chatHistoryMemory[chatId]) {
            chatHistoryMemory[chatId] = [];
        }

        // User ka naya message history mein jodh do
        chatHistoryMemory[chatId].push({ role: 'user', content: `User (${userName}) says: "${rawMessage}"` });

        // Groq ko bhejne ke liye messages ka array taiyar karo (System Instruction + History)
        const messagesToSend = [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...chatHistoryMemory[chatId]
        ];

        // GROQ LLAMA-3.1 COMPLETION ENGINE
        const chatCompletion = await groq.chat.completions.create({
            messages: messagesToSend,
            model: 'llama-3.1-8b-instant', 
            temperature: 0.65,
        });

        const aiReply = chatCompletion.choices[0]?.message?.content;

        if (aiReply) {
            // AI ka reply bhi history mein jodh do taaki agli baar use yaad rahe
            chatHistoryMemory[chatId].push({ role: 'assistant', content: aiReply });

            // 🧹 MEMORY CLEANUP: History ko bohot bada hone se bachane ke liye pichle 6 messages hi rakho (3 user + 3 bot)
            if (chatHistoryMemory[chatId].length > 6) {
                chatHistoryMemory[chatId].shift(); // Sabse purana message remove karo
                chatHistoryMemory[chatId].shift(); // Uska response bhi remove karo
            }

            await ctx.reply(aiReply, { reply_to_message_id: ctx.message.message_id });
        } else {
            throw new Error("No response from Groq");
        }

    } catch (error) {
        console.error("--- GROQ ERROR LOG ---", error);
        ctx.reply("Bhai glitch aa gaya pipeline mein... Fir se bol! 💀");
    }
});

bot.launch().then(() => {
    process.stdout.write("Supercharged GROQ Bot WITH MEMORY chal raha hai...\n");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));