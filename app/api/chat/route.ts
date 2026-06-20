import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

let ai: GoogleGenAI;

const getSystemInstruction = (style: string) => {
  switch (style) {
    case 'prompter':
      return "You are Sayanth Rock AI operating in IMAGE PROMPTER mode. Your primary function is to help users design outstanding, highly detailed visual prompts for AI image generators. Write beautifully detailed descriptions, specify lighting, visual style, atmosphere, camera lens details, and render engines. ALWAYS format your suggested visual prompts inside clear ```text code blocks ``` so users can copy and send them directly to the rendering engine with one click.";
    case 'technical':
      return "You are Sayanth Rock AI operating in DEEP TECHNICAL ANALYST mode. You give precise, rigorous, and highly detailed programming, design, math, or logical answers with clean structured markdown, lists, and code snippets.";
    case 'cyberpunk':
      return "You are Sayanth Rock AI operating in CYBERPUNK SCRIBE mode. Write in an immersive sci-fi hacking console aesthetic. Keep answers short, punchy, filled with cyberpunk terminal imagery, technobabble, and raw neon vibes.";
    case 'guide':
    default:
      return "You are Sayanth Rock AI operating in FRIENDLY CORE GUIDE mode. You are encouraging, warm, conversational, and helper-oriented. Write comprehensive beautifully formatted responses using lists, bold text, and code formatting where beneficial.";
  }
};

export async function POST(req: NextRequest) {
  try {
    const { messages, systemStyle, temperature, maxTokens, modelTier, customModel } = await req.json();

    const currentStyle = systemStyle || 'prompter';
    const currentTemp = temperature ?? 0.7;
    const currentMaxTokens = maxTokens ?? 2048;
    const activeTier = modelTier || 'gemini';

    const key = process.env.GEMINI_API_KEY;
    const isGeminiAvailable = !!(
      key && 
      key.trim() !== '' && 
      key !== 'MY_GEMINI_API_KEY' && 
      key.length > 15 && 
      !key.toLowerCase().includes('placeholder')
    );

    // Reusable pollination fallback function
    const runPollinationsFallbackWithModel = async (pModel: string) => {
      const formattedMessages = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const systemMessage = {
        role: 'system',
        content: getSystemInstruction(currentStyle) + " Keep your responses extremely engaging and formatted elegantly using markdown spacing."
      };

      const pollinationUrl = 'https://text.pollinations.ai/';
      const response = await fetch(pollinationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [systemMessage, ...formattedMessages],
          model: pModel
        })
      });

      if (!response.ok) {
        throw new Error(`Fallback chat engine failed with HTTP ${response.status}`);
      }

      return await response.text();
    };

    // Standard OpenAI fetch completions (generic OpenAI API calls)
    const fetchCustomModel = async (baseUrl: string, apiKey: string, modelName: string) => {
      let endpoint = baseUrl.trim();
      if (endpoint.endsWith('/')) {
        endpoint = endpoint.slice(0, -1);
      }
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = `${endpoint}/chat/completions`;
      }

      const formattedMessages = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const systemMessage = {
        role: 'system',
        content: getSystemInstruction(currentStyle) + " Keep your responses extremely engaging and formatted elegantly using markdown spacing."
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [systemMessage, ...formattedMessages],
          temperature: currentTemp,
          max_tokens: currentMaxTokens
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Custom endpoint failed with HTTP ${response.status}: ${errText}`);
      }

      const json = await response.json();
      return json.choices?.[0]?.message?.content || "I received a blank custom response.";
    };

    // Match routing to selected Tier
    if (activeTier === 'chatgpt') {
      // 1. Check if direct openai key is in environment
      if (process.env.OPENAI_API_KEY) {
        try {
          const reply = await fetchCustomModel('https://api.openai.com/v1', process.env.OPENAI_API_KEY, 'gpt-4o-mini');
          return NextResponse.json({ reply, modelUsed: 'ChatGPT (env key)' });
        } catch (e) {
          console.warn("Direct ChatGPT env key query failed. Cascading...", e);
        }
      }
      // 2. Otherwise try provided custom key/model
      if (customModel && customModel.key) {
        try {
          const reply = await fetchCustomModel(customModel.baseUrl, customModel.key, customModel.model);
          return NextResponse.json({ reply, modelUsed: customModel.model });
        } catch (e) {
          console.warn("Interactive key failed, cascading...", e);
        }
      }
      // 3. Fallback to free high performance keyless engine
      const reply = await runPollinationsFallbackWithModel('openai');
      return NextResponse.json({ reply, wasFallback: true, modelUsed: 'ChatGPT (keyless)' });
    }

    if (activeTier === 'claude') {
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const reply = await fetchCustomModel('https://api.anthropic.com/v1', process.env.ANTHROPIC_API_KEY, 'claude-3-5-sonnet-latest');
          return NextResponse.json({ reply, modelUsed: 'Claude (env key)' });
        } catch (e) {
          console.warn("Direct Claude env key query failed. Cascading...", e);
        }
      }
      if (customModel && customModel.key) {
        try {
          const reply = await fetchCustomModel(customModel.baseUrl, customModel.key, customModel.model);
          return NextResponse.json({ reply, modelUsed: customModel.model });
        } catch (e) {
          console.warn("Interactive key failed, cascading...", e);
        }
      }
      const reply = await runPollinationsFallbackWithModel('claude');
      return NextResponse.json({ reply, wasFallback: true, modelUsed: 'Claude (keyless)' });
    }

    if (activeTier === 'custom') {
      if (customModel && customModel.key) {
        try {
          const reply = await fetchCustomModel(customModel.baseUrl, customModel.key, customModel.model);
          return NextResponse.json({ reply, modelUsed: customModel.model });
        } catch (e: any) {
          console.error("Custom Key registration failure:", e);
          return NextResponse.json(
            { error: `Model registration failed: ${e.message || 'Key server declined connection.'}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "No custom model was configured. Please register a key first or select another engine." },
          { status: 400 }
        );
      }
    }

    // Default: Gemini Tier
    if (!isGeminiAvailable) {
      const reply = await runPollinationsFallbackWithModel('gemini');
      return NextResponse.json({ reply, wasFallback: true, modelUsed: 'Gemini (keyless)' });
    }

    try {
      // Initialize Gemini
      if (!ai) {
        ai = new GoogleGenAI({ apiKey: key });
      }

      const contents = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: getSystemInstruction(currentStyle),
          temperature: currentTemp,
          maxOutputTokens: currentMaxTokens,
        }
      });

      const reply = response.text || "I was unable to formulate a response.";
      return NextResponse.json({ reply, modelUsed: 'Gemini 3.5 Flash' });

    } catch (geminiError: any) {
      const geminiErrorMsg = typeof geminiError === 'string' ? geminiError : (geminiError?.message || '');
      const isAuthError = geminiErrorMsg.includes('401') || geminiErrorMsg.includes('UNAUTHENTICATED');
      console.log(`Gemini chat offline (${isAuthError ? 'auth/tier' : 'api error'}). Routing to keyless text engine.`);
      try {
        const reply = await runPollinationsFallbackWithModel('gemini');
        return NextResponse.json({ 
          reply, 
          wasFallback: true, 
          fallbackReason: geminiError?.message?.includes('401') ? 'auth_failure' : 'api_error',
          modelUsed: 'Gemini (keyless)'
        });
      } catch (fallbackError: any) {
        console.error("Fallback chat failed:", fallbackError);
        return NextResponse.json(
          { error: geminiError?.message || fallbackError?.message || 'Chat generation failed' },
          { status: 500 }
        );
      }
    }

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

