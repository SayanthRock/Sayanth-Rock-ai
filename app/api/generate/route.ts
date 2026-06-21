/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
  const { prompt, aspectRatio, referenceImage, isEditing, model, apiType } = await req.json();
  const isEditingMode = referenceImage && isEditing;

  const key = process.env.GEMINI_API_KEY;
  const isGeminiAvailable = !!(
    key && 
    key.trim() !== '' && 
    key !== 'MY_GEMINI_API_KEY' && 
    key.length > 15 && 
    !key.toLowerCase().includes('placeholder')
  );

  try {
    if (!isGeminiAvailable) {
      throw new Error("Gemini key not configured");
    }

    const genAi = getAi();
    let generatedImageUrl = '';
    let wasBetaFallbackToStable = false;

    if (apiType === 'interactions') {
      console.log("Processing image generation via Interactions API Mode");
      try {
        try {
          const aiAny = genAi as any;
          if (aiAny.interactions && typeof aiAny.interactions.create === 'function') {
            console.log("Calling interactions.create via SDK representation");
            const input: any[] = [];
            if (isEditingMode) {
              const mimeType = referenceImage.match(/data:(.*?);base64,/)[1];
              const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, "");
              input.push({
                type: "text",
                text: prompt || "Enhance this image"
              });
              input.push({
                type: "image",
                mime_type: mimeType,
                data: base64Data
              });
            } else {
              input.push({
                type: "text",
                text: prompt
              });
            }

            const interaction = await aiAny.interactions.create({
              model: model || 'gemini-3.1-flash-image',
              input: input,
            });

            const outputImage = interaction.outputImage || interaction.output_image || (interaction as any).output_image || (interaction as any).outputImage;
            if (outputImage && outputImage.data) {
              const base64EncodeString = outputImage.data;
              const mimeTypeOut = outputImage.mimeType || outputImage.mime_type || 'image/png';
              generatedImageUrl = `data:${mimeTypeOut};base64,${base64EncodeString}`;
            }
          }
        } catch (sdkError: any) {
          console.warn("Interactions using primary SDK failed, trying fallback REST pathway", sdkError?.message || sdkError);
        }

        if (!generatedImageUrl) {
          const bodyInput: any[] = [];
          if (isEditingMode) {
            const mimeType = referenceImage.match(/data:(.*?);base64,/)[1];
            const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, "");
            bodyInput.push({
              type: "text",
              text: prompt || "Enhance this image"
            });
            bodyInput.push({
              type: "image",
              mime_type: mimeType,
              data: base64Data
            });
          } else {
            bodyInput.push({
              type: "text",
              text: prompt
            });
          }

          const url = `https://generativelanguage.googleapis.com/v1beta/interactions`;
          const restResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': key!,
              'Api-Revision': '2026-05-20'
            },
            body: JSON.stringify({
              model: model || 'gemini-3.1-flash-image',
              input: bodyInput
            })
          });

          if (!restResponse.ok) {
            const errText = await restResponse.text();
            throw new Error(`Interactions REST API failed: ${restResponse.status} ${errText}`);
          }

          const json = await restResponse.json();
          let targetImg = json.outputImage || json.output_image || json.interaction?.outputImage || json.interaction?.output_image;
          
          if (!targetImg) {
            const findImageDeep = (obj: any): any => {
              if (!obj || typeof obj !== 'object') return null;
              if (obj.data && (obj.mimeType || obj.mime_type)) return obj;
              for (const k of Object.keys(obj)) {
                const res = findImageDeep(obj[k]);
                if (res) return res;
              }
              return null;
            };
            targetImg = findImageDeep(json);
          }

          if (targetImg && targetImg.data) {
            const base64EncodeString = targetImg.data;
            const mimeTypeOut = targetImg.mimeType || targetImg.mime_type || 'image/png';
            generatedImageUrl = `data:${mimeTypeOut};base64,${base64EncodeString}`;
          }
        }

        if (!generatedImageUrl) {
          throw new Error("No image data returned from Interactions API");
        }
      } catch (interactionsError: any) {
        console.warn("Interactions API failed due to credentials or Beta restrictions. Reverting to stable generateContent fallback.", interactionsError?.message || interactionsError);
        wasBetaFallbackToStable = true;

        // Fallback to high-reliability generateContent method using the same API Key
        const parts: any[] = [];
        if (isEditingMode) {
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
          parts.push({ text: prompt });
        }

        const response = await genAi.models.generateContent({
          model: model || 'gemini-3.1-flash-image',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || "1:1",
              imageSize: "1K"
            }
          }
        });

        if (response.candidates && response.candidates.length > 0) {
          const respParts = response.candidates[0]?.content?.parts;
          if (respParts) {
             for (const part of respParts) {
               if (part.inlineData) {
                 const base64EncodeString = part.inlineData.data;
                 const mimeTypeOut = part.inlineData.mimeType || 'image/png';
                 generatedImageUrl = `data:${mimeTypeOut};base64,${base64EncodeString}`;
                 break;
               }
             }
          }
        }
      }
    } else {
      console.log("Processing image generation via GenerateContent (Stable Mode)");
      const parts: any[] = [];

      if (isEditingMode) {
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
        parts.push({ text: prompt });
      }

      const response = await genAi.models.generateContent({
        model: model || 'gemini-3.1-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: "1K"
          }
        }
      });

      if (response.candidates && response.candidates.length > 0) {
        const respParts = response.candidates[0]?.content?.parts;
        if (respParts) {
           for (const part of respParts) {
             if (part.inlineData) {
               const base64EncodeString = part.inlineData.data;
               const mimeTypeOut = part.inlineData.mimeType || 'image/png';
               generatedImageUrl = `data:${mimeTypeOut};base64,${base64EncodeString}`;
               break;
             }
           }
        }
      }
    }

    if (!generatedImageUrl) {
       throw new Error("No image data returned from Gemini");
    }

    return NextResponse.json({ 
      url: generatedImageUrl,
      wasBetaFallbackToStable
    });

  } catch (error: any) {
    const errorMsg = typeof error === 'string' ? error : (error?.message || '');
    const isAuthError = errorMsg.includes('401') || 
                        errorMsg.includes('UNAUTHENTICATED') || 
                        errorMsg.includes('credentials') || 
                        errorMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
                        errorMsg.includes('API_KEY_INVALID') ||
                        errorMsg.includes('API key not valid');

    console.log(`Gemini generation inactive (${isAuthError ? 'auth/tier constraint' : 'generic context'}). Activating keyless image engine.`);

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
    if (isEditingMode) {
      finalPrompt = `${finalPrompt} (stylized style, artistic blend)`;
    }

    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    
    try {
      const response = await fetch(pollinationUrl);
      if (!response.ok) {
        throw new Error(`Fallback generation engine failed with HTTP ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      const generatedImageUrl = `data:image/jpeg;base64,${base64Image}`;
      
      return NextResponse.json({ 
        url: generatedImageUrl,
        wasFallback: true,
        fallbackReason: isAuthError ? 'auth_failure' : 'api_error'
      });
    } catch (fallbackError: any) {
      console.error("Fallback image generation failed:", fallbackError);
      return NextResponse.json({ error: error?.message || fallbackError?.message || 'Generation failed' }, { status: 500 });
    }
  }
}
