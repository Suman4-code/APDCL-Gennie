const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple mock NLP Agent logic for APDCL
function generateAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('bill') || lowerMessage.includes('pay')) {
        return "You can pay your electricity bill online through the official APDCL portal (www.apdcl.org) using your Consumer Number. Alternatively, you can use the myBijulee app. Do you have your Consumer Number handy?";
    } else if (lowerMessage.includes('outage') || lowerMessage.includes('power cut') || lowerMessage.includes('no power')) {
        return "I understand power outages are frustrating. Please provide your 12-digit Consumer Number or your registered mobile number so I can check if there's scheduled maintenance in your area.";
    } else if (lowerMessage.includes('new connection')) {
        return "To apply for a new connection, please visit the 'New Connection' section on the APDCL website. You will need proof of identity, proof of address, and a passport-sized photograph. Shall I guide you through the process?";
    } else if (lowerMessage.includes('tariff') || lowerMessage.includes('rate')) {
        return "The current APDCL tariff for domestic users is ₹5.25 per unit for the first 120 units, and ₹7.30 per unit thereafter. (Note: These are indicative rates, please check the official tariff order for exact details).";
    } else if (lowerMessage.includes('complaint')) {
        return "To register a complaint, you can type the issue here and provide your Consumer Number, or call our toll-free helpline at 1912.";
    } else if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
        return "Hello! I am your APDCL AI Assistant. How can I help you today with your electricity services?";
    } else if (lowerMessage.includes('thank')) {
        return "You're very welcome! If you need anything else, feel free to ask. Have a bright day ahead!";
    } else {
        return "I am an AI assistant in training. I may not fully understand your query yet. Could you rephrase it, or specify if it's regarding a bill payment, power outage, new connection, or tariff query?";
    }
}

// Endpoint to handle chat
app.post('/api/chat', (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({ error: 'Session ID and message are required.' });
    }

    // Ensure session exists
    db.run(`INSERT OR IGNORE INTO sessions (session_id) VALUES (?)`, [sessionId], function(err) {
        if (err) {
            console.error('Session insert error:', err.message);
        }

        // Save user message
        db.run(`INSERT INTO messages (session_id, sender, message) VALUES (?, ?, ?)`, [sessionId, 'user', message], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Failed to save user message.' });
            }

        // Generate AI response
        const aiResponse = generateAIResponse(message);

        // Save AI response
        db.run(`INSERT INTO messages (session_id, sender, message) VALUES (?, ?, ?)`, [sessionId, 'ai', aiResponse], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Failed to save AI response.' });
            }

            res.json({ response: aiResponse });
        });
        });
    });
});

// Endpoint to fetch chat history
app.get('/api/chat/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    db.all(`SELECT sender, message, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC`, [sessionId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch chat history.' });
        }
        res.json({ history: rows });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
