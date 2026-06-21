import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import ai from "../../../lib/gemini";

export async function POST(req: NextRequest) {
  const { prompt, aspectRatio, model } = await req.json();
  try {
    const operation = await ai.models.generateVideos({
      model: model || "veo-3.1-lite-generate-preview",
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio || '16:9',
      },
    });
    return NextResponse.json({ operationName: operation.name });
  } catch (error) {
    console.error("Veo Error:", error);
    return NextResponse.json({ error: "Failed to generate video (operation)" }, { status: 500 });
  }
}
