import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// .env file se variables load karne ke liye
dotenv.config();

const app = express();
const PORT = 8000;

// CORS allow karna zaroori hai taaki GitHub Pages tumhare laptop se baat kar sake
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("LOADED KEY:", GROQ_API_KEY ? "HAAN, MIL GAYI!" : "NAHI MILI, UNDEFINED HAI!");

// Yeh hai tumhari apni XYZ API End-point
app.post('/xyz-api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: "Bhai message toh bhejo!" });
        }

        // 🔥 YAHAN TUM APNA AI CONTROL KAR SAKTE HO (SYSTEM PROMPT)
        const systemPrompt = "Tum ek solid, cool aur bohot hi helpful AI assistant ho. Har baat ka jawab bilkul simple, chhota aur dosto wale andaaz (Hinglish) mein dena.";

        // Groq API ko standard format mein request bhejna
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // Fast aur optimized model
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7
            })
        });

        const groqData = await response.json();
        
        // 🔍 Agar Groq ne koi error bheja hai toh use terminal par print karo
        if (groqData.error) {
            console.error("❌ Groq API Error:", groqData.error);
            return res.status(400).json({ error: groqData.error.message });
        }

        // Safe tareeqe se choices check karo
        if (!groqData.choices || groqData.choices.length === 0) {
            console.error("❌ Unexpected Groq Response:", groqData);
            return res.status(500).json({ error: "Groq se choices array nahi mila!" });
        }
        
        // Groq se aaya hua content nikalna
        const aiReply = groqData.choices[0].message.content;
        
        // Frontend ko reply wapas bhej dena
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Arre bhai server par kuch phat gaya!" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Your XYZ API is running at http://localhost:${PORT}`);
});