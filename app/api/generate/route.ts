/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

let ai: GoogleGenAI;
function getAi() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      throw new Error('Please configure your GEMINI_API_KEY in the AI Studio Settings / Secrets panel.');
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

export async function POST(req: NextRequest) {
  console.log("API POST /api/generate started");
  try {
    const { prompt, aspectRatio, referenceImage, isEditing } = await req.json();
    
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
      let width = 1024;
      let height = 1024;
      
      if (aspectRatio === "16:9") {
        width = 1024;
        height = 576;
      } else if (aspectRatio === "9:16") {
        width = 576;
        height = 1024;
      } else if (aspectRatio === "3:4") {
        width = 768;
        height = 1024;
      } else if (aspectRatio === "4:3") {
        width = 1024;
        height = 768;
      }

      const seed = Math.floor(Math.random() * 1000000000);
      let finalPrompt = prompt || "A scenic fantasy matte painting, cinematic light";
      if (referenceImage && isEditing) {
        finalPrompt = `${finalPrompt} (stylized style, artistic blend)`;
      }

      const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
      
      const response = await fetch(pollinationUrl);
      if (!response.ok) {
        throw new Error(`Fallback generation engine failed with HTTP ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      const generatedImageUrl = `data:image/jpeg;base64,${base64Image}`;
      
      return NextResponse.json({ url: generatedImageUrl });
    }

    const genAi = getAi();
    const parts: any[] = [];

    if (referenceImage && isEditing) {
      // Editing Mode
      const mimeType = referenceImage.match(/data:(.*?);base64,/)[1];
      const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, "");
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
      parts.push({ text: prompt || "Enhance this image" });
    } else {
      // Text-to-Image Generation Mode
      parts.push({ text: prompt });
    }

    const response = await genAi.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: "1K"
        }
      }
    });

    let generatedImageUrl = '';

    if (response.candidates && response.candidates.length > 0) {
      const respParts = response.candidates[0]?.content?.parts;
      if (respParts) {
         for (const part of respParts) {
           if (part.inlineData) {
             const base64EncodeString = part.inlineData.data;
             const mimeTypeOut = part.inlineData.mimeType || 'image/png';
             generatedImageUrl = `data:${mimeTypeOut};base64,${base64EncodeString}`;
             break; // Use the first generated image
           }
         }
      }
    }

    if (!generatedImageUrl) {
       throw new Error("No image data returned from Gemini");
    }

    return NextResponse.json({ url: generatedImageUrl });

  } catch (error: any) {
    console.error("Generate API Error:", error);
    
    // Check for rate limit error (429 or RESOURCE_EXHAUSTED)
    if (error.status === 429 || error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment before trying again.' }, { status: 429 });
    }
    
    let errorMessage = error.message || 'Failed to generate image';
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
      errorMessage = 'Your GEMINI_API_KEY is invalid. Please check the API key in your AI Studio Settings/Secrets panel.';
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

