import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import ai from "../../../lib/gemini";

export async function POST(req: NextRequest) {
  const { prompt, aspectRatio, imageSize, model } = await req.json();
  try {
    const response = await ai.models.generateContent({
      model: model || "gemini-3.1-flash-image",
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: imageSize || "1K",
        },
      },
    });
    
    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
