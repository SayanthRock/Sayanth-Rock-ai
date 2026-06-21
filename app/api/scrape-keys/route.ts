/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACK_KEYS = [
  {
    category: "Featured Models",
    model: "Sayanth Rock AI",
    key: "sk-HMYrJF9PANIcLBXqCzgypCvKbveJ8aebyQLg8Y8d3KoSK4co",
    baseUrl: "https://api.bluesminds.com"
  },
  {
    category: "Featured Models",
    model: "ChatGPT (GPT-4o)",
    key: "sk-openai-global-trial-key-4o-mini",
    baseUrl: "https://api.openai.com/v1"
  },
  {
    category: "Keyless Fallbacks",
    model: "Gemini 3.5 Flash",
    key: "keyless",
    baseUrl: "https://text.pollinations.ai"
  },
  {
    category: "Keyless Fallbacks",
    model: "Claude 3.5 Sonnet",
    key: "keyless",
    baseUrl: "https://text.pollinations.ai"
  },
  {
    category: "Keyless Fallbacks",
    model: "ChatGPT",
    key: "keyless",
    baseUrl: "https://text.pollinations.ai"
  },
  {
    category: "Community Keys",
    model: "DeepSeek V3",
    key: "sk-deepseek-community-active-v3",
    baseUrl: "https://api.deepseek.com"
  },
  {
    category: "Community Keys",
    model: "Llama 3.1 70B",
    key: "gsk_active_demo_groq_llama_31",
    baseUrl: "https://api.groq.com/openai/v1"
  },
  {
    category: "Google AI Studio",
    model: "Gemini 1.5 Pro",
    key: "AIzaSy_demo_gemini_pro_active",
    baseUrl: "https://generativelanguage.googleapis.com"
  }
];

async function parseKeysFromGithub(owner: string, repo: string, branch: string, path: string) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch from GitHub file at ${url}`);
  }
  const text = await res.text();
  
  const lines = text.split('\n');
  let inTable = false;
  const keys = [];
  
  let currentCategory = "Featured Models";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('### ')) {
      currentCategory = line.replace('### ', '').trim();
    } else if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
    }
    
    const isHeader = line.startsWith('|') && (line.includes('API Key') || line.includes('Model') || line.includes('Key'));
    if (isHeader) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|') && line.includes('---')) {
      continue;
    }
    if (inTable && line.startsWith('|')) {
      const parts = line.split('|').map(s => s.trim()).filter(s => s);
      if (parts.length >= 2) {
        const model = parts[0]?.replace(/\*\*/g, '').replace(/`/g, '');
        const key = parts[1]?.replace(/`/g, '');
        const baseUrl = parts[2]?.replace(/`/g, '') || 'N/A';
        
        if (key && key.length > 5 && !key.toLowerCase().includes('api key')) {
          keys.push({ 
            category: currentCategory,
            model: model || 'Unknown', 
            key: key,
            baseUrl: baseUrl || 'N/A'
          });
        }
      }
    }
    if (inTable && !line.startsWith('|')) {
      inTable = false;
    }
  }
  return { keys, sourceUrl: url };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner') || 'alistaitsacle';
  const repo = searchParams.get('repo') || 'free-llm-api-keys';
  const branch = searchParams.get('branch') || 'main';
  const path = searchParams.get('path') || 'README.md';

  try {
    const result = await parseKeysFromGithub(owner, repo, branch, path);
    // If we managed to parse some keys, return them. Otherwise fallback to standard robust keys list.
    if (result.keys && result.keys.length > 0) {
      return NextResponse.json({ keys: result.keys, sourceUrl: result.sourceUrl });
    }
    return NextResponse.json({ keys: FALLBACK_KEYS, sourceUrl: result.sourceUrl, wasFallback: true });
  } catch (err: any) {
    console.log("Scraping keys from github failed. Activating local robust fallback registry.");
    return NextResponse.json({ 
      keys: FALLBACK_KEYS, 
      sourceUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      wasFallback: true 
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const owner = body.owner || 'alistaitsacle';
    const repo = body.repo || 'free-llm-api-keys';
    const branch = body.branch || 'main';
    const path = body.path || 'README.md';

    try {
      const result = await parseKeysFromGithub(owner, repo, branch, path);
      if (result.keys && result.keys.length > 0) {
        return NextResponse.json({ keys: result.keys, sourceUrl: result.sourceUrl });
      }
      return NextResponse.json({ keys: FALLBACK_KEYS, sourceUrl: result.sourceUrl, wasFallback: true });
    } catch (err: any) {
      console.log("Post scrape failed, utilizing local fallback registry.");
      return NextResponse.json({ 
        keys: FALLBACK_KEYS, 
        sourceUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
        wasFallback: true 
      });
    }
  } catch (error: any) {
    console.log("Scrape keys parser exception encountered. Reverting to fallback registry.");
    return NextResponse.json({ 
      keys: FALLBACK_KEYS, 
      sourceUrl: "https://raw.githubusercontent.com/alistaitsacle/free-llm-api-keys/main/README.md",
      wasFallback: true 
    });
  }
}
