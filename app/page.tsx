/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, Check, Plus, Terminal, CodeXml, Loader2, Image as ImageIcon, Wand2, Upload, Key, Server, Copy, Github, Search, RefreshCw, ExternalLink, MessageSquare, Send, Bot, User, Volume2, VolumeX, Sliders, Cpu, Trash2, History } from 'lucide-react';
import Image from 'next/image';

// Raw Audio Synthesis for tactile, immersive sound design feedback
let audioCtx: AudioContext | null = null;
const playSound = (type: 'message' | 'response' | 'click' | 'power') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // We create a sound wave in Real-Time
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'message') {
      // Sleek ascending chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc.frequency.setValueAtTime(780, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.012, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.012, audioCtx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'response') {
      // Delightful notification chord
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.08); // C6
      gain.gain.setValueAtTime(0.012, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } else if (type === 'power') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.32);
    }
  } catch (e) {
    console.warn('Audio Context interaction failed or blocked:', e);
  }
};

// Inline Markdown utility supporting Code blocks with Synthesis forwarding, Lists, Tables and Styling
function renderMarkdown(
  text: string, 
  onCopyCode: (str: string) => void, 
  onSendToPrompt: (str: string) => void
) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : 'text';
      const code = match ? match[2] : part.slice(3, -3);
      
      const isImagePrompt = code.trim().length > 10;

      return (
        <div key={index} className="my-3 border border-zinc-800 rounded bg-black overflow-hidden text-left shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950/80 text-[10px] font-mono text-zinc-500 uppercase tracking-widest select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00]" />
              <span>{lang || 'snippet'}</span>
            </div>
            <div className="flex items-center gap-4">
              {isImagePrompt && (
                <button 
                  onClick={() => onSendToPrompt(code)}
                  className="text-[#FFCC00] hover:text-white flex items-center gap-1 transition-colors cursor-pointer text-[10px] font-bold"
                  title="Move to Image Generator Tab"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Synthesize Render</span>
                </button>
              )}
              <button 
                onClick={() => onCopyCode(code)}
                className="hover:text-[#FFCC00] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
          </div>
          <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-300 leading-relaxed max-w-full whitespace-pre select-all">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    const lines = part.split('\n');
    return (
      <div key={index} className="space-y-1.5 mt-1">
        {lines.map((line, lIdx) => {
          if (line.trim() === '---') {
            return <hr key={lIdx} className="my-3 border-zinc-900" />;
          }

          const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
          if (headerMatch) {
            const level = headerMatch[1].length;
            const content = headerMatch[2];
            const childrenNode = parseInlineMarks(content);
            if (level === 1) return <h1 key={lIdx} className="text-base font-bold font-sans text-white uppercase tracking-wider mt-4 mb-1.5">{childrenNode}</h1>;
            if (level === 2) return <h2 key={lIdx} className="text-sm font-bold font-sans text-[#FFCC00] uppercase tracking-wide mt-3 mb-1">{childrenNode}</h2>;
            return <h3 key={lIdx} className="text-xs font-semibold font-sans text-white/90 mt-2 mb-0.5">{childrenNode}</h3>;
          }

          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return (
              <ul key={lIdx} className="list-disc pl-5 space-y-1.5 my-1 text-zinc-300">
                <li className="marker:text-[#FFCC00]/60">{parseInlineMarks(line.trim().substring(2))}</li>
              </ul>
            );
          }

          const numListMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
          if (numListMatch) {
            return (
              <ol key={lIdx} className="list-decimal pl-5 space-y-1.5 my-1 text-zinc-300">
                <li value={parseInt(numListMatch[1])}>{parseInlineMarks(numListMatch[2])}</li>
              </ol>
            );
          }

          if (line.trim() === '') {
            return <div key={lIdx} className="h-1.5" />;
          }

          return <p key={lIdx} className="text-zinc-300 leading-relaxed font-sans">{parseInlineMarks(line)}</p>;
        })}
      </div>
    );
  });
}

function parseInlineMarks(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, partIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={partIdx} className="text-[#FFCC00] font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={partIdx} className="px-1.5 py-0.5 font-mono text-[11px] bg-[#141414] border border-zinc-800 rounded text-[#FFCC00]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}


const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "3:4", "4:3"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'image' | 'chat' | 'keys'>('image');
  
  // Image Generation State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [customKeys, setCustomKeys] = useState<any[]>([]);
  const [newKeyEntry, setNewKeyEntry] = useState('sk-HMYrJF9PANIcLBXqCzgypCvKbveJ8aebyQLg8Y8d3KoSK4co');
  const [newModelName, setNewModelName] = useState('Sayanth Rock AI');
  const [newBaseUrl, setNewBaseUrl] = useState('https://api.bluesminds.com');
  const [newCategoryName, setNewCategoryName] = useState('Custom');
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [gitOwner, setGitOwner] = useState('alistaitsacle');
  const [gitRepo, setGitRepo] = useState('free-llm-api-keys');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitPath, setGitPath] = useState('README.md');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sourceUrl, setSourceUrl] = useState('https://raw.githubusercontent.com/alistaitsacle/free-llm-api-keys/main/README.md');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Chat AI State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; modelUsed?: string }>>([
    { sender: 'assistant', text: 'Hi! I am the Sayanth Rock AI, your ultra high-performance dynamic intelligence. You can chat with me about anything, or ask me to draft detailed visual prompts for the image generation engine!', modelUsed: 'System Core' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Active Engine State
  const [activeModelTier, setActiveModelTier] = useState<'gemini' | 'chatgpt' | 'claude' | 'custom'>('gemini');
  const [activeModel, setActiveModel] = useState<any>({
    key: 'sk-HMYrJF9PANIcLBXqCzgypCvKbveJ8aebyQLg8Y8d3KoSK4co',
    model: 'Sayanth Rock AI',
    baseUrl: 'https://api.bluesminds.com',
    category: 'Custom'
  });

  // Custom Interactive AI Tuning Board States
  const [chatSystemStyle, setChatSystemStyle] = useState<'prompter' | 'technical' | 'cyberpunk' | 'guide'>('prompter');
  const [chatTemperature, setChatTemperature] = useState(0.7);
  const [chatMaxTokens, setChatMaxTokens] = useState(2000);
  const [chatSoundEnabled, setChatSoundEnabled] = useState(true);
  const [toasterMessage, setToasterMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const triggerToaster = (msg: string) => {
    setToasterMessage(msg);
    setTimeout(() => {
      setToasterMessage(null);
    }, 4000);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('custom_api_keys');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // If the key is already stored, make sure its endpoint is updated to https://api.bluesminds.com
          let updated = false;
          const mapped = parsed.map((item: any) => {
            if (item.key === 'sk-HMYrJF9PANIcLBXqCzgypCvKbveJ8aebyQLg8Y8d3KoSK4co' && item.baseUrl !== 'https://api.bluesminds.com') {
              updated = true;
              return { ...item, baseUrl: 'https://api.bluesminds.com' };
            }
            return item;
          });
          
          if (updated) {
            setCustomKeys(mapped);
            localStorage.setItem('custom_api_keys', JSON.stringify(mapped));
          } else {
            setCustomKeys(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const initialKeys = [
          {
            key: 'sk-HMYrJF9PANIcLBXqCzgypCvKbveJ8aebyQLg8Y8d3KoSK4co',
            model: 'Sayanth Rock AI',
            baseUrl: 'https://api.bluesminds.com',
            category: 'Custom'
          }
        ];
        setCustomKeys(initialKeys);
        localStorage.setItem('custom_api_keys', JSON.stringify(initialKeys));
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || chatInput;
    if (!rawText.trim() || isSendingMessage) return;

    const userMessage = { sender: 'user' as const, text: rawText };
    setChatMessages(prev => [...prev, userMessage]);
    if (!textToSend) setChatInput('');
    setIsSendingMessage(true);
    if (chatSoundEnabled) playSound('message');

    try {
      const currentHistory = chatMessages.concat(userMessage);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: currentHistory,
          systemStyle: chatSystemStyle,
          temperature: chatTemperature,
          maxTokens: chatMaxTokens,
          modelTier: activeModelTier,
          customModel: {
            key: activeModel.key,
            baseUrl: activeModel.baseUrl,
            model: activeModel.model
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }
      setChatMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: data.reply,
        modelUsed: data.modelUsed
      }]);
      if (chatSoundEnabled) playSound('response');
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: `Error synthesizing: ${err.message || 'System was unable to reach the neural engine.'}` 
      }]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const combinedKeys = [...customKeys, ...apiKeys];
  const categories = ['All', ...Array.from(new Set(combinedKeys.map(k => k.category).filter(Boolean)))];
  const filteredKeys = combinedKeys.filter(k => {
    const modelStr = k.model || '';
    const catStr = k.category || '';
    const urlStr = k.baseUrl || '';
    const matchesSearch = modelStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          catStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          urlStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || k.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddCustomKey = () => {
    if (!newKeyEntry.trim() || !newModelName.trim()) {
      triggerToaster("Model name and API key are required!");
      return;
    }
    
    if (customKeys.some(k => k.key === newKeyEntry.trim())) {
      triggerToaster("This key is already in your registry!");
      return;
    }

    const updated = [
      {
        key: newKeyEntry.trim(),
        model: newModelName.trim(),
        baseUrl: newBaseUrl.trim() || "https://api.openai.com/v1",
        category: newCategoryName.trim() || "Custom"
      },
      ...customKeys
    ];
    setCustomKeys(updated);
    localStorage.setItem('custom_api_keys', JSON.stringify(updated));
    triggerToaster("Custom key added to local registry!");
    
    setNewKeyEntry('');
  };

  const handleDeleteCustomKey = (keyToDelete: string) => {
    const updated = customKeys.filter(k => k.key !== keyToDelete);
    setCustomKeys(updated);
    localStorage.setItem('custom_api_keys', JSON.stringify(updated));
    triggerToaster("Custom key removed.");
  };

  const fetchKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/scrape-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: gitOwner,
          repo: gitRepo,
          branch: gitBranch,
          path: gitPath
        })
      });
      const data = await res.json();
      if (!res.ok) {
         throw new Error(data.error || 'Failed to fetch keys');
      }
      if (data.keys) {
         setApiKeys(data.keys);
      }
      if (data.sourceUrl) {
         setSourceUrl(data.sourceUrl);
      }
    } catch (err: any) {
      console.error(err);
      triggerToaster(err.message || 'Error fetching keys from GitHub repository.');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
     if (activeTab === 'keys' && apiKeys.length === 0) {
        fetchKeys();
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) return;
    setIsGenerating(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           prompt, 
           aspectRatio, 
           referenceImage, 
           isEditing: !!referenceImage 
        })
      });
      
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        }
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
        throw new Error(errorData.error || 'Failed to generate');
      }
      
      const data = await res.json();
      setResult(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error generating image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-sans selection:bg-[#FFCC00] selection:text-black">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-10 border-b border-zinc-800 pb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-end"
        >
          <div>
            <div className="flex items-center gap-2 text-[#FFCC00] text-sm uppercase tracking-widest font-mono mb-4">
               <ImageIcon className="w-4 h-4" />
              <span>Image Engine</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-white uppercase tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
              Image <span className="text-[#FFCC00]">Transformer AI</span>
            </h1>
          </div>
          <div className="text-zinc-500 font-mono text-sm max-w-sm md:text-right">
            Intelligent Image Generation & Free LLM API Key Directory
          </div>
        </motion.header>

        <div className="flex justify-center mb-12">
           <div className="inline-flex bg-[#0A0A0A] border border-zinc-800 p-1 flex-wrap justify-center gap-1">
              <button 
                onClick={() => setActiveTab('image')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-colors ${activeTab === 'image' ? 'bg-[#FFCC00] text-black shadow-[0_0_15px_rgba(255,204,0,0.2)]' : 'text-zinc-400 hover:text-white'}`}
              >
                <ImageIcon className="w-4 h-4" /> Generate Image
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-colors ${activeTab === 'chat' ? 'bg-[#FFCC00] text-black shadow-[0_0_15px_rgba(255,204,0,0.2)]' : 'text-zinc-400 hover:text-white'}`}
              >
                <MessageSquare className="w-4 h-4" /> Chat AI
              </button>
              <button 
                onClick={() => setActiveTab('keys')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-colors ${activeTab === 'keys' ? 'bg-[#FFCC00] text-black shadow-[0_0_15px_rgba(255,204,0,0.2)]' : 'text-zinc-400 hover:text-white'}`}
              >
                <Key className="w-4 h-4" /> Free API Keys
              </button>
           </div>
        </div>

        {activeTab === 'image' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-24">
           {/* Left Column: Input */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="space-y-10"
           >
             {/* Textarea */}
             <div className="bg-[#0A0A0A] border border-zinc-800 p-6 relative group transform transition-all duration-300 hover:border-zinc-700">
               <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-[#FFCC00] transition-colors duration-500" />
               <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest mb-4">
                 <Terminal className="w-4 h-4 text-[#FFCC00]" /> Prompts
               </label>
               <textarea
                 value={prompt}
                 onChange={e => setPrompt(e.target.value)}
                 placeholder="e.g., A sprawling futuristic city in the rain, cinematic lighting, 8k..."
                 className="w-full h-32 bg-transparent text-white p-2 text-lg focus:outline-none font-sans resize-none placeholder:text-zinc-700 transition-colors"
               />
             </div>

             {/* Reference Image Upload */}
             <div className="space-y-4">
                <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                 <Upload className="w-4 h-4 text-[#FFCC00]" /> Edit / Reference Image (Optional)
               </label>
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[150px] relative overflow-hidden group
                   ${referenceImage ? 'border-[#FFCC00] bg-zinc-900/50' : 'border-zinc-800 bg-[#0A0A0A] hover:border-zinc-600'}`}
               >
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={fileInputRef} 
                   onChange={handleImageUpload} 
                 />
                 
                 {referenceImage ? (
                   <div className="absolute inset-0">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={referenceImage} alt="Reference" className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <span className="bg-black/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#FFCC00]">Replace Image</span>
                     </div>
                   </div>
                 ) : (
                   <>
                     <ImageIcon className="w-8 h-8 text-zinc-600 mb-2 group-hover:text-[#FFCC00] transition-colors" />
                     <span className="font-mono text-xs uppercase text-zinc-500">Click to upload reference image</span>
                   </>
                 )}
               </div>
               {referenceImage && (
                 <button onClick={() => setReferenceImage(null)} className="text-zinc-500 text-xs font-mono uppercase hover:text-red-400 transition-colors">
                   Remove Reference Image
                 </button>
               )}
             </div>

             {/* Aspect Ratio Picker */}
             <div className="space-y-4">
               <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                 <Wand2 className="w-4 h-4 text-[#FFCC00]" /> Aspect Ratio
               </label>
               <div className="flex flex-wrap gap-2">
                 {ASPECT_RATIOS.map(r => (
                   <button
                     key={r}
                     onClick={() => setAspectRatio(r)}
                     className={`px-5 py-3 font-mono text-xs tracking-wider transition-all duration-300 border ${
                       aspectRatio === r 
                         ? 'bg-[#FFCC00] text-black border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.3)]' 
                         : 'bg-[#0A0A0A] border-zinc-800 text-zinc-400 hover:border-[#FFCC00] hover:text-[#FFCC00]'
                     }`}
                   >
                     {r}
                   </button>
                 ))}
               </div>
             </div>

             {/* Generate Button */}
             <button
               onClick={handleGenerate}
               disabled={(!prompt.trim() && !referenceImage) || isGenerating}
               className="w-full relative group overflow-hidden border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <div className="absolute inset-0 bg-[#FFCC00] transition-transform duration-300 group-hover:scale-[1.02]" />
               <div className="relative flex items-center justify-center gap-3 px-8 py-5 text-black font-mono text-sm uppercase tracking-widest font-bold">
                 {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Render...
                    </>
                 ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {referenceImage ? "Edit Image" : "Generate Image"}
                    </>
                 )}
               </div>
             </button>
           </motion.div>
           
           {/* Right Column: Output */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8, delay: 0.4 }}
             className="bg-[#0A0A0A] border border-zinc-800 h-full min-h-[500px] flex flex-col relative shadow-2xl overflow-hidden"
           >
             <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black/40 backdrop-blur-sm z-20 absolute top-0 left-0 w-full">
               <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                 <CodeXml className="w-4 h-4 text-[#FFCC00]" /> Visual Output
               </div>
               {result && (
                  <button onClick={downloadImage} className="flex items-center gap-2 text-[#FFCC00] font-mono text-xs uppercase tracking-widest hover:text-white transition-colors">
                     Download
                     <Download className="w-4 h-4" />
                  </button>
               )}
             </div>
             
             <div className="flex-1 w-full h-[500px] xl:h-full relative flex items-center justify-center bg-zinc-950/50 mt-14">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                     <motion.div 
                       key="loading"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="absolute inset-0 flex flex-col items-center justify-center text-[#FFCC00] font-mono text-xs uppercase tracking-widest bg-[#0A0A0A]"
                     >
                       <Loader2 className="w-8 h-8 mb-4 animate-spin text-[#FFCC00]" />
                       <span className="animate-pulse">Rendering Image Data...</span>
                     </motion.div>
                  ) : error ? (
                     <motion.div 
                       key="error"
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black z-10"
                     >
                       <div className="bg-red-500/10 border border-red-500/30 p-6 max-w-sm text-center shadow-2xl">
                          <Terminal className="w-8 h-8 text-red-500 mx-auto mb-4" />
                          <h3 className="text-red-500 font-mono text-xs uppercase tracking-widest mb-3">System Exception</h3>
                          <p className="text-zinc-400 font-sans text-sm">{error}</p>
                       </div>
                     </motion.div>
                  ) : result ? (
                     <motion.div 
                       key="result"
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="w-full h-full relative"
                     >
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img 
                          src={result} 
                          alt="Generated Image Output" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                       />
                     </motion.div>
                  ) : (
                     <motion.div 
                       key="empty"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="absolute inset-0 flex items-center justify-center text-zinc-700 font-mono text-xs uppercase tracking-widest"
                     >
                       <div className="text-center">
                         <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                         Awaiting Render Engine
                       </div>
                     </motion.div>
                  )}
                </AnimatePresence>
             </div>
           </motion.div>
        </div>
        )}

        {activeTab === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto text-left space-y-6"
          >
            {/* Interactive Workspace with Dual-Pane Layout (Chat Console + Parameters Deck) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#09090A] border border-[#ffcc00]/10 rounded shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden min-h-[600px]">
              
              {/* PRIMARY COLUMN: Chat Log & Input (8 cols out of 12) */}
              <div className="lg:col-span-8 flex flex-col h-[650px] relative border-b lg:border-b-0 lg:border-r border-zinc-900">
                {/* Thin custom border top line that blinks/glows */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#ffcc00] via-zinc-800 to-[#ffcc00]/20 animate-pulse z-20" />

                {/* Console header bar */}
                <div className="px-6 py-4 border-b border-zinc-900 bg-[#060607]/95 flex justify-between items-center text-xs font-mono select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-[#FFCC00] absolute" />
                    <span className="text-white uppercase font-bold tracking-wider">Neural Stream 4.0</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-500 text-[10px]">
                    <span className="bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00] px-2 py-0.5 rounded-sm uppercase text-[9px] tracking-widest font-bold">
                      {chatSystemStyle} mode
                    </span>
                    <span className="hidden sm:inline">TEMP: {chatTemperature}</span>
                  </div>
                </div>

                {/* Message Log Scroll Screen with customized look */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/[0.15] scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'assistant' && (
                        <div className="w-9 h-9 rounded-full bg-[#0E0E10] border border-[#FFCC00]/20 flex items-center justify-center flex-shrink-0 text-[#FFCC00] shadow-[0_0_12px_rgba(255,204,0,0.1)]">
                          <Bot className="w-4.5 h-4.5 animate-pulse" />
                        </div>
                      )}

                      <div className="max-w-[85%] flex flex-col space-y-1.5">
                        <div
                          className={`p-5 rounded-sm relative border transition-all duration-300 group
                            ${msg.sender === 'user'
                              ? 'bg-[#0E0E0F]/90 border-r-[3px] border-r-[#FFCC00] border-zinc-800/80 text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                              : 'bg-[#050506]/95 border-l-[3px] border-l-zinc-700/80 border-zinc-900 text-zinc-200 shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:border-zinc-800'}`}
                        >
                          {/* Inner metadata label */}
                          <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-2.5 flex justify-between items-center opacity-60 pointer-events-none select-none">
                            <span className="flex items-center gap-1">
                              {msg.sender === 'user' ? (
                                <>
                                  <User className="w-3 h-3 text-zinc-400" /> User Identity
                                </>
                              ) : (
                                <>
                                  <Cpu className="w-3 h-3 text-[#FFCC00]" /> {msg.modelUsed || "Sayanth Rock Intelligence"}
                                </>
                              )}
                            </span>
                            <span className="text-[8px] font-mono opacity-50 ml-6">
                              {mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          {/* Message markup parser wrapper */}
                          <div className="text-[13.5px] leading-relaxed break-words font-sans selection:bg-[#FFCC00]/30">
                            {msg.sender === 'user' ? (
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            ) : (
                              renderMarkdown(
                                msg.text,
                                (code) => {
                                  navigator.clipboard.writeText(code);
                                  if (chatSoundEnabled) playSound('click');
                                  triggerToaster("Copied code to clipboard");
                                },
                                (promptText) => {
                                  // Clean the prompt (strip triple ticks, lang tags or markdown quotes)
                                  const formatted = promptText.replace(/```\w*\n?/g, '').replace(/```/g, '').trim();
                                  setPrompt(formatted);
                                  setActiveTab('image');
                                  if (chatSoundEnabled) playSound('power');
                                  triggerToaster("Forwarded visual prompt to Render Engine!");
                                }
                              )
                            )}
                          </div>
                        </div>

                        {/* Quick action buttons row below assistant message */}
                        {msg.sender === 'assistant' && (
                          <div className="flex gap-3 items-center pl-1 font-mono text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 select-none">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                if (chatSoundEnabled) playSound('click');
                                triggerToaster("Message saved to clipboard");
                              }}
                              className="hover:text-[#FFCC00] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy full response"
                            >
                              <Copy className="w-3 h-3" /> Copy Text
                            </button>
                            <span>|</span>
                            <button
                              onClick={() => {
                                // Extract code blocks or use full text for prompter
                                const hasCode = msg.text.includes('```');
                                let targetContent = msg.text;
                                if (hasCode) {
                                  const match = msg.text.match(/```(?:text|prompt|md|json)?\n?([\s\S]*?)```/);
                                  if (match) targetContent = match[1];
                                }
                                setPrompt(targetContent.trim());
                                setActiveTab('image');
                                if (chatSoundEnabled) playSound('power');
                                triggerToaster("Visual architecture mapped successfully!");
                              }}
                              className="hover:text-white text-[#FFCC00]/80 hover:brightness-110 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Send to Draw Engine"
                            >
                              <Sparkles className="w-3 h-3 text-[#FFCC00]" /> Use as Prompter
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-9 h-9 rounded-full bg-[#121214] border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                          <User className="w-4.5 h-4.5 animate-none" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isSendingMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 justify-start"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#0E0E10] border border-[#FFCC00]/20 flex items-center justify-center flex-shrink-0 text-[#FFCC00]">
                        <Loader2 className="w-4.5 h-4.5 animate-spin text-[#FFCC00]" />
                      </div>
                      <div className="bg-[#050506]/95 border border-[#ffcc00]/10 p-4 rounded-sm text-zinc-400 font-mono text-[11px] uppercase tracking-widest flex items-center gap-2.5 shadow-md">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFCC00] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFCC00]"></span>
                        </span>
                        <span>Synthesizing cognitive response...</span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Interactive Preset suggestions list above the input console */}
                <div className="bg-[#050506] border-t border-zinc-900 p-4 select-none">
                  <div className="flex items-center gap-1 mb-2.5">
                    <Sparkles className="w-3 h-3 text-[#FFCC00]" />
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Suggested Prompt blueprints:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        title: "Cyberpunk Rainscape",
                        desc: "Visual prompt with glowing holograms & chrome details",
                        promptText: "A hyper-detailed photorealistic cyberpunk city street in torrential rain, towering glowing holographic billboards in violet and neon amber, reflecting off wet asphalt, flying shuttle vehicles, ultra high resolution 8k, photorealistic octane render."
                      },
                      {
                        title: "Fantasy Castle ruins",
                        desc: "Surreal ethereal fantasy prompt in twilight golden light",
                        promptText: "Ethereal ruins of an ancient gothic castle sitting on a steep high cliff at celestial twilight, floating glowing runic islands in the sky, warm golden rays, painterly soft hyperrealistic style, highly detailed fantasy environment."
                      }
                    ].map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          if (chatSoundEnabled) playSound('click');
                          handleSendMessage(suggestion.promptText);
                        }}
                        disabled={isSendingMessage}
                        className="text-left p-2.5 border border-zinc-900 bg-[#080809] hover:border-[#FFCC00]/30 hover:bg-[#0A0A0C]/80 text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 rounded-sm group flex flex-col justify-between"
                      >
                        <span className="text-[#FFCC00]/90 font-mono text-[11px] font-bold group-hover:text-white transition-colors">⚡ {suggestion.title}</span>
                        <span className="text-zinc-500 font-sans text-[10px] mt-0.5 group-hover:text-zinc-400 truncate w-full">{suggestion.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Console Input Panels */}
                <div className="border-t border-zinc-950 p-4 bg-[#050506] flex gap-3 z-10">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Compose structured query in ${chatSystemStyle} mode...`}
                    disabled={isSendingMessage}
                    className="flex-1 bg-[#020202] border border-zinc-900 focus:border-[#FFCC00] rounded-sm text-sm text-white px-4 py-3 placeholder:text-zinc-700 outline-none transition-all duration-200 font-sans"
                  />
                  <button
                    onClick={() => {
                      if (chatSoundEnabled) playSound('click');
                      handleSendMessage();
                    }}
                    disabled={!chatInput.trim() || isSendingMessage}
                    className="bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,204,0,0.2)] disabled:opacity-50 disabled:shadow-none font-bold rounded-sm cursor-pointer select-none"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Stream</span>
                  </button>
                </div>
              </div>

              {/* SECONDARY COLUMN: Advanced Parameters Tuning Deck (4 cols out of 12) */}
              <div className="lg:col-span-4 bg-[#050506]/98 p-6 flex flex-col justify-between font-mono text-xs text-zinc-400 select-none">
                
                {/* Section header */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-zinc-900">
                    <Sliders className="w-4 h-4 text-[#FFCC00]" />
                    <span className="text-white uppercase font-bold text-xs tracking-wider">Parameters Deck</span>
                  </div>

                  {/* Active LLM Model Selection Engine */}
                  <div className="space-y-3 pb-6 border-b border-zinc-900" style={{ contentVisibility: 'auto' }}>
                    <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      <Server className="w-3.5 h-3.5 text-[#FFCC00]" /> ACTIVE CHAT ENGINE:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'gemini', label: 'Gemini', subtitle: '3.5 Flash' },
                        { id: 'chatgpt', label: 'ChatGPT', subtitle: 'GPT-4o / Fallback' },
                        { id: 'claude', label: 'Claude', subtitle: 'Sonnet / Fallback' },
                        { id: 'custom', label: 'Custom Key', subtitle: activeModel.model || 'Select Card' },
                      ].map((tier) => {
                        const isActive = activeModelTier === tier.id;
                        return (
                          <button
                            key={tier.id}
                            onClick={() => {
                              setActiveModelTier(tier.id as any);
                              if (chatSoundEnabled) playSound('click');
                              triggerToaster(`Chat engine updated to ${tier.label}!`);
                            }}
                            className={`px-3 py-2 border transition-all duration-200 text-left rounded-sm font-bold flex flex-col justify-between cursor-pointer
                              ${isActive 
                                ? 'bg-[#FFCC00]/10 border-[#FFCC00] text-white shadow-[0_0_12px_rgba(255,204,0,0.1)]' 
                                : 'bg-black/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-white font-normal'}`}
                          >
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-[#FFCC00]' : ''}`}>{tier.label}</span>
                            <span className="text-[9px] opacity-70 mt-0.5 truncate max-w-full">{tier.subtitle}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* If custom or custom key is chosen, provide direct lookup selector */}
                    {activeModelTier === 'custom' && (
                      <div className="space-y-1.5 mt-2">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Select Custom Key Card:</span>
                        <select
                          value={activeModel.key}
                          onChange={(e) => {
                            const matched = [...customKeys, ...apiKeys].find(k => k.key === e.target.value);
                            if (matched) {
                              setActiveModel({
                                key: matched.key,
                                baseUrl: matched.baseUrl,
                                model: matched.model,
                                category: matched.category || 'Custom'
                              });
                              triggerToaster(`Activated custom model: ${matched.model}`);
                            }
                          }}
                          className="w-full bg-[#050505] border border-zinc-800 text-zinc-300 font-mono text-[11px] rounded-sm p-2 outline-none focus:border-[#FFCC00]"
                        >
                          {[...customKeys, ...apiKeys].map((k, i) => (
                            <option key={k.key + i} value={k.key}>
                              {k.model || 'Unnamed Model'} ({k.category || 'Custom'})
                            </option>
                          ))}
                          {[...customKeys, ...apiKeys].length === 0 && (
                            <option value="">No keys in registry.</option>
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* System personality list */}
                  <div className="space-y-3.5">
                    <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      <Cpu className="w-3.5 h-3.5 text-zinc-600" /> System Flavor:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'prompter', label: 'PrompterAI', title: 'Creative prompts' },
                        { id: 'technical', label: 'AnalystAI', title: 'Code & logic' },
                        { id: 'cyberpunk', label: 'ConsoleAI', title: 'Sci-fi immersion' },
                        { id: 'guide', label: 'GuideAI', title: 'Friendly conversation' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            setChatSystemStyle(style.id as any);
                            if (chatSoundEnabled) playSound('click');
                            triggerToaster(`Switched core mode to ${style.label}!`);
                          }}
                          className={`px-3 py-2.5 border transition-all duration-200 text-left rounded-sm font-bold flex flex-col justify-between cursor-pointer
                            ${chatSystemStyle === style.id 
                              ? 'bg-[#FFCC00] text-black border-transparent shadow-[0_0_12px_rgba(255,204,0,0.15)]' 
                              : 'bg-black/40 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-white font-normal'}`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider">{style.label}</span>
                          <span className="text-[9px] opacity-70 mt-1 truncate">{style.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temperature Slider */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      <span>Neural randomness:</span>
                      <span className="text-white font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{chatTemperature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={chatTemperature}
                      onChange={(e) => {
                        setChatTemperature(parseFloat(e.target.value));
                        if (chatSoundEnabled) playSound('click');
                      }}
                      className="w-full accent-[#FFCC00] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-600">
                      <span>Strict / Precise</span>
                      <span>High Randomness</span>
                    </div>
                  </div>

                  {/* Max token slider */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      <span>Response limit:</span>
                      <span className="text-white font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{chatMaxTokens} tk</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="4096"
                      step="50"
                      value={chatMaxTokens}
                      onChange={(e) => {
                        setChatMaxTokens(parseInt(e.target.value));
                        if (chatSoundEnabled) playSound('click');
                      }}
                      className="w-full accent-[#FFCC00] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-600">
                      <span>Short bullets</span>
                      <span>Deep essays</span>
                    </div>
                  </div>

                  {/* Audio synth state toggle */}
                  <div className="bg-[#09090A] border border-zinc-900 p-4 flex items-center justify-between mt-4">
                    <div className="space-y-0.5" style={{ contentVisibility: 'auto' }}>
                      <p className="text-[10px] text-white uppercase font-bold tracking-wider">Synthesizer FX</p>
                      <p className="text-[9px] text-zinc-500">Enable tactile chimes on interactions</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !chatSoundEnabled;
                        setChatSoundEnabled(next);
                        if (next) playSound('power');
                      }}
                      className={`p-2 border transition-all rounded cursor-pointer ${
                        chatSoundEnabled 
                          ? 'border-[#FFCC00]/40 text-[#FFCC00] hover:bg-[#FFCC00]/5 bg-[#FFCC00]/10 shadow-[0_0_12px_rgba(255,204,0,0.1)]' 
                          : 'border-zinc-800 text-zinc-600 hover:text-zinc-500 bg-transparent'
                      }`}
                      title={chatSoundEnabled ? "Mute audio synthesizer feedback" : "Activate audio synthesizer feedback"}
                    >
                      {chatSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Footer with action logs & clear button */}
                <div className="pt-6 border-t border-zinc-900 space-y-4">
                  <div className="space-y-1.5 text-[9px] text-zinc-500 uppercase">
                    <h3 className="font-bold tracking-widest">Deck Telemetry</h3>
                    <div className="flex justify-between">
                      <span>Messages session:</span>
                      <span className="text-white font-bold">{chatMessages.length} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Session Connection:</span>
                      <span className="text-emerald-400 font-bold">Encrypted Web link</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (chatSoundEnabled) playSound('power');
                      setChatMessages([
                        { sender: 'assistant', text: 'Console memory cleared. Memory space available. Ask me to formulate prompts or queries at your command!' }
                      ]);
                      triggerToaster("Chat history scrubbed successfully");
                    }}
                    className="w-full py-2.5 border border-[#fc4444]/30 hover:border-[#fc4444] text-[#fc4444] rounded-sm hover:bg-[#fc4444]/5 text-center font-bold tracking-widest text-[9px] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Scrub History Logs</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === 'keys' && (

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-left"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* GitHub Interlink Panel */}
                <div className="lg:col-span-7 bg-[#0A0A0A] border border-zinc-800 p-8 shadow-2xl relative overflow-hidden group flex flex-col justify-between">
                  <div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-[#FFCC00] transition-colors duration-500" />
                    
                    <div className="flex flex-col lg:flex-row gap-8 justify-between items-start mb-8 pb-8 border-b border-zinc-900">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-mono text-xs text-[#FFCC00] uppercase tracking-widest">
                          <Github className="w-4 h-4" />
                          <span>GitHub Connect Configuration</span>
                        </div>
                        <h2 className="font-display text-3xl text-white uppercase tracking-tight">
                          Dynamize Key Registry
                        </h2>
                        <p className="text-zinc-500 text-xs font-mono max-w-xl">
                          Point Sayanth Rock AI to any structured markdown tables on GitHub to pull, decode, and cache raw LLM API credentials in real-time.
                        </p>
                      </div>

                      {/* Preset quick links */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mr-2">Presets:</span>
                        <button 
                          onClick={() => {
                            setGitOwner('alistaitsacle');
                            setGitRepo('free-llm-api-keys');
                            setGitBranch('main');
                            setGitPath('README.md');
                          }}
                          className="px-3 py-1.5 border border-zinc-800 text-[10px] font-mono uppercase bg-zinc-950 text-zinc-400 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors cursor-pointer"
                        >
                          Official Free Keys
                        </button>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#050505] p-3 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Hub Owner</label>
                        <input 
                          type="text" 
                          value={gitOwner} 
                          onChange={e => setGitOwner(e.target.value)}
                          className="bg-transparent text-white font-mono text-sm w-full focus:outline-none"
                          placeholder="e.g. alistaitsacle"
                        />
                      </div>
                      <div className="bg-[#050505] p-3 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Repository</label>
                        <input 
                          type="text" 
                          value={gitRepo} 
                          onChange={e => setGitRepo(e.target.value)}
                          className="bg-transparent text-white font-mono text-sm w-full focus:outline-none"
                          placeholder="e.g. free-llm-api-keys"
                        />
                      </div>
                      <div className="bg-[#050505] p-3 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Branch</label>
                        <input 
                          type="text" 
                          value={gitBranch} 
                          onChange={e => setGitBranch(e.target.value)}
                          className="bg-transparent text-white font-mono text-sm w-full focus:outline-none"
                          placeholder="e.g. main"
                        />
                      </div>
                      <div className="bg-[#050505] p-3 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">File Path</label>
                        <input 
                          type="text" 
                          value={gitPath} 
                          onChange={e => setGitPath(e.target.value)}
                          className="bg-transparent text-white font-mono text-sm w-full focus:outline-none"
                          placeholder="e.g. README.md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-zinc-900/60">
                    {/* Source Link & Status Pill */}
                    <div className="flex items-center gap-3">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500 hover:text-[#FFCC00] flex items-center gap-1.5 transition-colors truncate max-w-sm">
                        Src: github.com/{gitOwner}/{gitRepo}
                      </span>
                    </div>

                    <button 
                      onClick={fetchKeys}
                      disabled={isLoadingKeys}
                      className="px-6 py-3 bg-[#FFCC00] text-black font-mono text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,204,0,0.2)] disabled:opacity-50 cursor-pointer font-bold rounded-sm border-none"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingKeys ? 'animate-spin' : ''}`} />
                      {isLoadingKeys ? 'Interlinking...' : 'Establish Handshake'}
                    </button>
                  </div>
                </div>

                {/* Add Custom Key Panel */}
                <div className="lg:col-span-5 bg-[#0A0A0A] border border-zinc-800 p-8 shadow-2xl relative overflow-hidden group flex flex-col justify-between focus-within:border-[#FFCC00]/50 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-[#FFCC00] transition-colors duration-500" />
                  
                  <div>
                    <div className="space-y-1 mb-6 pb-4 border-b border-zinc-900">
                      <div className="flex items-center gap-2 font-mono text-xs text-[#FFCC00] uppercase tracking-widest">
                        <Key className="w-4 h-4" />
                        <span>Interactive Custom Registry</span>
                      </div>
                      <h2 className="font-display text-2xl text-white uppercase tracking-tight">
                        Register Key
                      </h2>
                      <p className="text-zinc-500 text-xs font-mono">
                        Add and configure your custom credentials instantly with secure client-side storage persistence.
                      </p>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-3.5 mb-6">
                      <div className="bg-[#050505] p-2.5 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Model / Service Name</label>
                        <input 
                          type="text" 
                          value={newModelName} 
                          onChange={e => setNewModelName(e.target.value)}
                          className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                          placeholder="e.g. Sayanth Rock AI"
                        />
                      </div>
                      <div className="bg-[#050505] p-2.5 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Base Endpoint URL</label>
                        <input 
                          type="text" 
                          value={newBaseUrl} 
                          onChange={e => setNewBaseUrl(e.target.value)}
                          className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                          placeholder="e.g. https://api.openai.com/v1"
                        />
                      </div>
                      <div className="bg-[#050505] p-2.5 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Secret Key String</label>
                        <input 
                          type="text" 
                          value={newKeyEntry} 
                          onChange={e => setNewKeyEntry(e.target.value)}
                          className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                          placeholder="e.g. sk-HMYr..."
                        />
                      </div>
                      <div className="bg-[#050505] p-2.5 border border-zinc-800 focus-within:border-[#FFCC00] transition-colors">
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Category Group</label>
                        <input 
                          type="text" 
                          value={newCategoryName} 
                          onChange={e => setNewCategoryName(e.target.value)}
                          className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                          placeholder="e.g. Custom, OpenAI, Claude"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-900/60">
                    <button 
                      onClick={handleAddCustomKey}
                      className="px-6 py-3 w-full bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black font-mono text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,204,0,0.2)] font-bold rounded-sm border-none cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Commit Custom Key
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtering Control Suite */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
                {/* Search query input */}
                <div className="relative flex-1 max-w-md bg-[#0A0A0A] border border-zinc-800 flex items-center px-4 hover:border-zinc-700 focus-within:border-[#FFCC00] transition-colors">
                  <Search className="w-4 h-4 text-zinc-500 mr-2" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by model, category, or URL..."
                    className="w-full bg-transparent py-3 text-white text-xs font-mono focus:outline-none placeholder:text-zinc-600"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-zinc-500 hover:text-white font-mono text-[10px] uppercase transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Status stats metadata */}
                <div className="flex items-center gap-6 px-4 py-2 border border-zinc-900 bg-[#090909] max-w-xs md:max-w-none text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                  <div>Extracted: <span className="text-[#FFCC00] font-bold">{apiKeys.length}</span></div>
                  <div>Filtered: <span className="text-white font-bold">{filteredKeys.length}</span></div>
                </div>
              </div>

              {/* Categories filters */}
              <div className="flex flex-wrap gap-2 pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-[10px] uppercase font-mono tracking-wider border transition-all ${
                      selectedCategory === cat 
                        ? 'bg-[#FFCC00] text-black border-transparent font-semibold shadow-[0_0_12px_rgba(255,204,0,0.25)]' 
                        : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Keys Cards Grid */}
              {isLoadingKeys ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500 font-mono text-xs uppercase">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin text-[#FFCC00]" />
                  Synchronizing endpoint database...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredKeys.map((k, i) => {
                      const isKeyCopied = copiedKey === k.key;
                      const isUrlCopied = copiedKey === k.baseUrl;

                      return (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          key={k.key + i} 
                          className="bg-[#0A0A0A] border border-zinc-800 p-6 flex flex-col justify-between group hover:border-zinc-700 transition-all duration-300 relative overflow-hidden shadow-xl"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-[#FFCC00] transition-colors duration-500" />
                          
                          <div className="mb-6">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[#FFCC00] text-[10px] uppercase tracking-widest font-mono">
                                {k.category}
                              </span>
                              {customKeys.some(ck => ck.key === k.key) && (
                                <button 
                                  onClick={() => handleDeleteCustomKey(k.key)}
                                  className="text-[#fc4444] hover:text-[#fc4444]/80 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-colors border-none bg-transparent"
                                  title="Remove custom key"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                            <h3 className="text-white font-medium text-lg leading-tight font-sans truncate" title={k.model}>
                              {k.model}
                            </h3>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-[#050505] border border-zinc-900 p-3 flex items-center justify-between group/url">
                              <div className="flex flex-col overflow-hidden mr-2">
                                <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Base URL</span>
                                <span className="text-xs text-zinc-400 font-mono truncate" title={k.baseUrl}>
                                  {k.baseUrl}
                                </span>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(k.baseUrl)}
                                className="text-zinc-600 hover:text-white transition-colors flex-shrink-0"
                                title="Copy Base URL"
                              >
                                {isUrlCopied ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            <div className="bg-[#050505] border border-zinc-900 p-3 flex items-center justify-between group/key">
                              <div className="flex flex-col overflow-hidden mr-2">
                                <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">API Key</span>
                                <span className="text-xs text-[#FFCC00] font-mono truncate" title={k.key}>
                                  ••••••••{k.key.substring(k.key.length - 8)}
                                </span>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(k.key)}
                                className="text-zinc-600 hover:text-[#FFCC00] transition-colors flex-shrink-0"
                                title="Copy API Key"
                              >
                                {isKeyCopied ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Key className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filteredKeys.length === 0 && !isLoadingKeys && (
                    <div className="col-span-full py-16 text-center border border-dashed border-zinc-900/60 text-zinc-600 uppercase text-xs tracking-widest font-mono">
                      No matching endpoints found matching criteria.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
         )}
      </div>

      {/* Floating Sparkle Toaster Banner */}
      <AnimatePresence>
        {toasterMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0B0B0C] border border-[#FFCC00]/50 p-4 shadow-[0_0_30px_rgba(255,204,0,0.25)] flex items-center gap-3.5 rounded-sm max-w-sm font-sans"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFCC00]/10 flex items-center justify-center text-[#FFCC00] flex-shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] font-bold text-[#FFCC00] uppercase tracking-widest">Cognitive Core Event</p>
              <p className="text-zinc-300 text-xs mt-0.5 font-medium leading-relaxed">{toasterMessage}</p>
            </div>
            <button 
              onClick={() => setToasterMessage(null)}
              className="text-zinc-500 hover:text-white font-mono text-[10px] uppercase cursor-pointer pl-2 self-start"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
