import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

let ai: GoogleGenAI;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const key = process.env.GEMINI_API_KEY;
    const isGeminiAvailable = !!(
      key && 
      key.trim() !== '' && 
      key !== 'MY_GEMINI_API_KEY' && 
      key.length > 15 && 
      !key.toLowerCase().includes('placeholder')
    );

    if (!isGeminiAvailable) {
      // Keyless high-performance fallback using Pollinations AI
      const formattedMessages = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Fallback instruction
      const systemMessage = {
        role: 'system',
        content: `You are Image Transformer AI, a brilliant, super-helpful, friendly intelligence that is part of the custom AI dashboard. Use clear and encouraging tone.`
      };

      const pollinationUrl = 'https://text.pollinations.ai/';
      const response = await fetch(pollinationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [systemMessage, ...formattedMessages],
          model: 'openai'
        })
      });

      if (!response.ok) {
        throw new Error(`Fallback chat engine failed with HTTP ${response.status}`);
      }

      const reply = await response.text();
      return NextResponse.json({ reply });
    }

    // Initialize Gemini
    if (!ai) {
      ai = new GoogleGenAI({ apiKey: key });
    }

    // Map conversation history to Gemini structure
    // Gemini role must be 'user' or 'model'
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: "You are Image Transformer AI, a custom, super-helpful, and high-performance AI entity. You are friendly, intelligent, and eager to help the user. Write beautifully formatted responses using markdown where suitable.",
      }
    });

    const reply = response.text || "I was unable to formulate a response.";
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment before trying again.' }, { status: 429 });
    }

    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
