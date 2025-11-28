import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow frontend to communicate
app.use(express.json());

// Proxy Endpoint for Notion
// This receives the request from your React App (localhost:5173) and forwards it to Notion
app.post('/v1/pages', async (req, res) => {
  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n⚡ CyberSentinel Backend Proxy Active`);
  console.log(`   - Listening on: http://localhost:${PORT}`);
  console.log(`   - Notion Gateway: Ready to forward requests`);
});