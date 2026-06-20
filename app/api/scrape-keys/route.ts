/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner') || 'alistaitsacle';
    const repo = searchParams.get('repo') || 'free-llm-api-keys';
    const branch = searchParams.get('branch') || 'main';
    const path = searchParams.get('path') || 'README.md';

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
       throw new Error(`Failed to fetch from GitHub file at ${url}`);
    }
    const text = await res.text();
    
    const lines = text.split('\n');
    let inTable = false;
    let keys = [];
    
    let currentCategory = "Featured models";

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
               let baseUrl = parts[2]?.replace(/`/g, '') || 'N/A';
               
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
    
    return NextResponse.json({ keys, sourceUrl: url });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const owner = body.owner || 'alistaitsacle';
    const repo = body.repo || 'free-llm-api-keys';
    const branch = body.branch || 'main';
    const path = body.path || 'README.md';

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
       throw new Error(`Failed to fetch from GitHub file at ${url}`);
    }
    const text = await res.text();
    
    const lines = text.split('\n');
    let inTable = false;
    let keys = [];
    
    let currentCategory = "Featured models";

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
               let baseUrl = parts[2]?.replace(/`/g, '') || 'N/A';
               
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
    
    return NextResponse.json({ keys, sourceUrl: url });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

