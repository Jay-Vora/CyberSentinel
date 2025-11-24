import { GoogleGenAI, Content, Part } from "@google/genai";
import { MessageRole, ChatMessage } from "../types";
import { CYBER_SENTINEL_PROMPT } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private modelId = "gemini-2.5-flash";

  initialize(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async sendMessage(
    history: ChatMessage[], 
    newMessage: string,
    currentStreak: number
  ): Promise<string> {
    if (!this.ai) {
      throw new Error("API Key not initialized");
    }

    // Convert internal chat history to Gemini API format
    // We filter out system messages from the history array as we will prepend the system prompt dynamically
    const contents: Content[] = history
      .filter(msg => msg.role !== MessageRole.SYSTEM)
      .map((msg) => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.text } as Part],
      }));

    // Add the new message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage } as Part],
    });

    try {
      // Dynamic Prompt Injection with Streak Context
      const systemInstruction = `${CYBER_SENTINEL_PROMPT}\n\nCURRENT CONTEXT:\nCurrent User Streak: ${currentStreak} Days.\nToday's Date: ${new Date().toLocaleDateString()}.`;

      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7, 
        }
      });

      return response.text || "Connection interrupted. No data received.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "ERROR: Uplink failed. Check API Key or Network Connection.";
    }
  }
}

export const geminiService = new GeminiService();
