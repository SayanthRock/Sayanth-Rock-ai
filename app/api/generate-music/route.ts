import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import ai from "../../../lib/gemini";

export async function POST(req: NextRequest) {
  const { prompt, model } = await req.json();
  try {
    const responseStream = await ai.models.generateContentStream({
      model: model || "lyria-3-clip-preview",
      contents: prompt,
      config: { responseModalities: [Modality.AUDIO] },
    });

    let audioBase64 = "";
    let mimeType = "audio/wav";

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          audioBase64 += part.inlineData.data;
          if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
        }
      }
    }

    return NextResponse.json({ musicUrl: `data:${mimeType};base64,${audioBase64}` });
  } catch (error) {
    console.error("Lyria Error:", error);
    return NextResponse.json({ error: "Failed to generate music" }, { status: 500 });
  }
}
