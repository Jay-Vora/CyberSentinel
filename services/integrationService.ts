import { IntegrationConfig } from "../types";

// AnkiConnect Payload Types
interface AnkiParams {
  note: {
    deckName: string;
    modelName: string;
    fields: {
      Front: string;
      Back: string;
    };
    tags: string[];
  };
}

// Helper to parse the CSV format from the System Prompt
// Format: "Question";"Answer";"Tag"
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
      // Bold line treated as strong paragraph
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
      const response = await fetch('http://127.0.0.1:8765', {
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

    // First check if deck exists, if not create it (optional, but good UX)
    try {
      await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        body: JSON.stringify({ action: "createDeck", version: 6, params: { deck: config.ankiDeckName } })
      });
    } catch (e) {
      // Ignore create deck error, might already exist or connection failed (handled below)
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
        const response = await fetch('http://127.0.0.1:8765', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.error) {
           throw new Error(`Anki Error: ${data.error}`);
        }
        results.push(data);
      } catch (error: any) {
        console.error("Anki Sync Error:", error);
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
      const response = await fetch('https://api.notion.com/v1/pages', {
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
       // Notion often blocks CORS from browser.
       if (error.message && error.message.includes("Failed to fetch")) {
         throw new Error("CORS Error: Browser cannot connect directly to Notion. You need a backend proxy.");
       }
       throw error;
    }
  }
};