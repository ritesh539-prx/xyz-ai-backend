import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// .env file se variables load karne ke liye
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000; // Ek hi baar port define kiya

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("LOADED KEY:", GROQ_API_KEY ? "HAAN, MIL GAYI!" : "NAHI MILI, UNDEFINED HAI!");

// 🧠 MEMORY SYSTEM: Yeh array conversation yaad rakhega
let chatHistory = [
    {
        role: "system",
        content: "You are a helpful, friendly AI assistant. Always remember the context of the conversation and refer to previous messages when appropriate."
    }
];

// XYZ API End-point
app.post('/xyz-api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // 1. User ka naya message history mein add karo
        chatHistory.push({ role: "user", content: message });

        // 2. Memory limit (Takriban pichle 20 messages dhyan mein rakhega)
        if (chatHistory.length > 20) {
            chatHistory.splice(1, 2); // Purane messages ko clear karo (system message ko chhod kar)
        }

        // 3. fetch se Groq API ko direct call karo
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: chatHistory // Poori chat history bhej rahe hain
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API Error:", data);
            return res.status(response.status).json({ error: "Failed to communicate with Groq API" });
        }

        const aiResponse = data.choices[0].message.content;

        // 4. AI ka response bhi history mein add karo
        chatHistory.push({ role: "assistant", content: aiResponse });

        // 5. Response send karo frontend ko
        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Error in chat:", error);
        res.status(500).json({ error: "Something went wrong in the backend" });
    }
});

// Server ko sirf ek hi baar listen karwana hai
app.listen(PORT, () => {
    console.log(`🚀 Your XYZ API is running on port ${PORT}`);
});