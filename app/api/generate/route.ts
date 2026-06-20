/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from '@google/genai';
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
  try {
    const { prompt, style } = await req.json();
    const genAi = getAi();

    const schema = {
      type: Type.OBJECT,
      properties: {
        master_prompt: { type: Type.STRING, description: "The full, exhaustive highly-detailed image generation prompt." },
        subject_details: { type: Type.STRING, description: "Highly specific details about the subject/action." },
        lighting_and_atmosphere: { type: Type.STRING, description: "Description of the lighting and environmental vibe." },
        camera_and_composition: { type: Type.STRING, description: "Photography/render details (e.g. 35mm, isometric, wide angle)." },
        color_palette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 dominant hex colors."}
      },
      required: ["master_prompt", "subject_details", "lighting_and_atmosphere", "camera_and_composition", "color_palette"]
    };

    const response = await genAi.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Act as an expert technical art director for Sayanth Rock AI. 
      User's raw idea: "${prompt}"
      Requested style keyword: "${style}"
      
      Enhance and expand this into a highly detailed, professional prompt for a state-of-the-art image generator. Focus on aesthetic quality. Output strict JSON according to the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      }
    });

    if (!response.text) {
      throw new Error("No response text returned from Gemini");
    }

    return NextResponse.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Generate API Error:", error);
    
    let errorMessage = error.message || 'Failed to generate prompt';
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
      errorMessage = 'Your GEMINI_API_KEY is invalid. Please check the API key in your AI Studio Settings/Secrets panel.';
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
