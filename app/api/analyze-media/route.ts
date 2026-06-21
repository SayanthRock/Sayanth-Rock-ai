import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import ai from "../../../lib/gemini";

export async function POST(req: NextRequest) {
  const { fileData, mimeType, task } = await req.json();
  try {
    const response = await ai.models.generateContent({
      model: task === 'audio' ? "gemini-3.5-flash" : "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType,
            },
          },
          { text: task === 'audio' ? "Transcribe the audio." : "Analyze this content." },
        ],
      },
    });
    return NextResponse.json({ result: response.text });
  } catch (error) {
    console.error("Media Analysis Error:", error);
    return NextResponse.json({ error: "Failed to process media" }, { status: 500 });
  }
}
