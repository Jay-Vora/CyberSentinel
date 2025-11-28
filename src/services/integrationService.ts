import { IntegrationConfig } from "../types";

// CONSTANTS
const ANKI_URL = 'http://127.0.0.1:8765';
// CRITICAL: Point to the local proxy server (server.js) running on port 3000
const NOTION_API_URL = 'http://localhost:3000/v1/pages'; 

// Helper to parse the CSV format from the System Prompt
export const parseAnkiCards = (text: string) => {
  const cards: { front: string; back: string; tags: string[] }[] = [];
  const regex = /"(.*?)"\s*;\s*"(.*?)"\s*;\s*"(.*?)"/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    cards.push({
      front: match[1],
      back: match[2],
      tags: match[3].split(',').map(t => t.trim()),
    });
  }
  return cards;
};

// Helper to convert basic Markdown to Notion Blocks
const markdownToNotionBlocks = (text: string) => {
  const lines = text.split('\n');
  const blocks = [];

  for (const line of lines) {
    if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: line.replace('### ', '') } }] }
      });
    } else if (line.startsWith('**') && line.endsWith('**')) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { 
          rich_text: [{ type: 'text', text: { content: line.replace(/\*\*/g, '') }, annotations: { bold: true } }] 
        }
      });
    } else if (line.trim().startsWith('- ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.replace('- ', '') } }] }
      });
    } else if (line.trim().length > 0) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: line } }] }
      });
    }
  }
  return blocks;
};

export const integrationService = {
  async checkAnkiConnection() {
    try {
      const response = await fetch(ANKI_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "version", version: 6 })
      });
      const data = await response.json();
      return { success: true, version: data.result };
    } catch (error) {
       console.error("Anki Test Error:", error);
       return { success: false, error: error };
    }
  },

  async syncToAnki(config: IntegrationConfig, cards: { front: string; back: string; tags: string[] }[]) {
    if (!config.ankiDeckName) throw new Error("Anki Deck Name not configured.");

    try {
      await fetch(ANKI_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "createDeck", version: 6, params: { deck: config.ankiDeckName } })
      });
    } catch (e) {
      // Ignore create deck error
    }

    const results = [];
    for (const card of cards) {
      const payload = {
        action: "addNote",
        version: 6,
        params: {
          note: {
            deckName: config.ankiDeckName,
            modelName: "Basic",
            fields: {
              Front: card.front,
              Back: card.back
            },
            tags: ["CyberSentinel", ...card.tags]
          }
        }
      };

      try {
        const response = await fetch(ANKI_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        results.push(data);
      } catch (error: any) {
        if (error.message && error.message.includes("Failed to fetch")) {
          throw new Error("Connection Refused. Ensure Anki is OPEN and AnkiConnect 'webCorsOriginList' includes '*'.");
        }
        throw error;
      }
    }
    return results.length;
  },

  async syncToNotion(config: IntegrationConfig, title: string, content: string) {
    if (!config.notionToken || !config.notionDatabaseId) {
      throw new Error("Notion credentials missing.");
    }

    const blocks = markdownToNotionBlocks(content);

    const payload = {
      parent: { database_id: config.notionDatabaseId },
      properties: {
        Name: { 
          title: [{ text: { content: title || `Study Notes - ${new Date().toLocaleDateString()}` } }] 
        },
        Tags: {
          multi_select: [{ name: "CyberSentinel" }]
        }
      },
      children: blocks
    };

    try {
      // Connects to local server.js
      const response = await fetch(NOTION_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Notion API Error: ${err.message || response.statusText}`);
      }
      return await response.json();
    } catch (error: any) {
       if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
         throw new Error("Backend Proxy Error. Is 'node server.js' running?");
       }
       throw error;
    }
  }
};