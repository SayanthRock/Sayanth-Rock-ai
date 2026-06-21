import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import ai from "../../../lib/gemini";

export async function POST(req: NextRequest) {
  const { prompt, model, systemInstruction, thinkingLevel, enableSearch, enableMaps } = await req.json();
  try {
    const config: any = {
      systemInstruction: systemInstruction,
      tools: []
    };
    if (thinkingLevel === 'HIGH') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }
    if (enableSearch) {
        config.tools.push({ googleSearch: {} });
    }
    if (enableMaps) {
        config.tools.push({ googleMaps: {} });
    }
    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents: prompt,
      config: config,
    });
    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
