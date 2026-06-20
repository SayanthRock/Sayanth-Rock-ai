/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  CheckCircle2,
  CodeXml,
  Download,
  Github,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Upload,
  User,
  Wand2,
} from 'lucide-react';

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '3:4', '4:3'] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];
type ActiveTab = 'image' | 'chat' | 'status';

type ChatMessage = {
  sender: 'user' | 'assistant';
  text: string;
};

const getImageSize = (ratio: AspectRatio) => {
  switch (ratio) {
    case '16:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '3:4':
      return { width: 900, height: 1200 };
    case '4:3':
      return { width: 1200, height: 900 };
    default:
      return { width: 1024, height: 1024 };
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hi! I am Sayanth Rock AI. This GitHub Pages build runs as a static app, so image generation and chat use browser-side public endpoints instead of Next.js server API routes.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) return;

    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
      const { width, height } = getImageSize(aspectRatio);
      const seed = Math.floor(Math.random() * 1_000_000_000);
      const finalPrompt = [
        prompt.trim() || 'A cinematic futuristic AI interface, premium lighting, high detail',
        referenceImage ? 'inspired by the uploaded reference image mood and composition' : '',
        'ultra detailed, cinematic lighting, sharp focus, high quality',
      ]
        .filter(Boolean)
        .join(', ');

      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;
      setResult(imageUrl);
    } catch (err: any) {
      setError(err?.message || 'Image generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || chatInput;
    if (!rawText.trim() || isSendingMessage) return;

    const userMessage: ChatMessage = { sender: 'user', text: rawText };
    const currentHistory = [...chatMessages, userMessage];

    setChatMessages(currentHistory);
    if (!textToSend) setChatInput('');
    setIsSendingMessage(true);

    try {
      const messages = currentHistory.map(message => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            {
              role: 'system',
              content:
                'You are Sayanth Rock AI, a helpful creative assistant for image prompts, web design, Android APK builds, and GitHub deployment fixes. Be direct and practical.',
            },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat endpoint returned HTTP ${response.status}`);
      }

      const reply = await response.text();
      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply || 'No response received.' }]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `I could not reach the public chat endpoint from this static build. ${err?.message || 'Try again later.'}`,
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `sayanth-rock-ai-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#050505] text-[#EAEAEA] font-sans selection:bg-[#FFCC00] selection:text-black">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-10 border-b border-zinc-800 pb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-end"
        >
          <div>
            <div className="flex items-center gap-2 text-[#FFCC00] text-sm uppercase tracking-widest font-mono mb-4">
              <ImageIcon className="w-4 h-4" />
              <span>Static AI Studio</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-white uppercase tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
              Sayanth <span className="text-[#FFCC00]">Rock AI</span>
            </h1>
          </div>
          <p className="text-zinc-500 font-mono text-sm max-w-sm md:text-right">
            GitHub Pages ready, APK WebView ready, no server API routes required.
          </p>
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
              onClick={() => setActiveTab('status')}
              className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-colors ${activeTab === 'status' ? 'bg-[#FFCC00] text-black shadow-[0_0_15px_rgba(255,204,0,0.2)]' : 'text-zinc-400 hover:text-white'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Build Status
            </button>
          </div>
        </div>

        {activeTab === 'image' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-10"
            >
              <div className="bg-[#0A0A0A] border border-zinc-800 p-6 relative group transform transition-all duration-300 hover:border-zinc-700">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-[#FFCC00] transition-colors duration-500" />
                <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest mb-4">
                  <Terminal className="w-4 h-4 text-[#FFCC00]" /> Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  placeholder="Example: premium futuristic AI dashboard, glassmorphism, golden light, cinematic details"
                  className="w-full h-32 bg-transparent text-white p-2 text-lg focus:outline-none font-sans resize-none placeholder:text-zinc-700 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                  <Upload className="w-4 h-4 text-[#FFCC00]" /> Reference Image Mood
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[150px] relative overflow-hidden group ${referenceImage ? 'border-[#FFCC00] bg-zinc-900/50' : 'border-zinc-800 bg-[#0A0A0A] hover:border-zinc-600'}`}
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
                      <span className="font-mono text-xs uppercase text-zinc-500">Click to upload reference mood</span>
                    </>
                  )}
                </div>
                {referenceImage && (
                  <button onClick={() => setReferenceImage(null)} className="text-zinc-500 text-xs font-mono uppercase hover:text-red-400 transition-colors">
                    Remove Reference Image
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                  <Wand2 className="w-4 h-4 text-[#FFCC00]" /> Aspect Ratio
                </label>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-5 py-3 font-mono text-xs tracking-wider transition-all duration-300 border ${aspectRatio === ratio ? 'bg-[#FFCC00] text-black border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.3)]' : 'bg-[#0A0A0A] border-zinc-800 text-zinc-400 hover:border-[#FFCC00] hover:text-[#FFCC00]'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={(!prompt.trim() && !referenceImage) || isGenerating}
                className="w-full relative group overflow-hidden border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-[#FFCC00] transition-transform duration-300 group-hover:scale-[1.02]" />
                <div className="relative flex items-center justify-center gap-3 px-8 py-5 text-black font-mono text-sm uppercase tracking-widest font-bold">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Generating Render...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Generate Image
                    </>
                  )}
                </div>
              </button>
            </motion.div>

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
                    Open
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex-1 w-full h-[500px] xl:h-full relative flex items-center justify-center bg-zinc-950/50 mt-14">
                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center p-8 bg-black z-10">
                      <div className="bg-red-500/10 border border-red-500/30 p-6 max-w-sm text-center shadow-2xl">
                        <Terminal className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <h3 className="text-red-500 font-mono text-xs uppercase tracking-widest mb-3">System Exception</h3>
                        <p className="text-zinc-400 font-sans text-sm">{error}</p>
                      </div>
                    </motion.div>
                  ) : result ? (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result} alt="Generated Image Output" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center text-zinc-700 font-mono text-xs uppercase tracking-widest">
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
          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto text-left space-y-6">
            <div className="bg-[#0A0A0A] border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col min-h-[550px] max-h-[650px] rounded-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 hover:bg-[#FFCC00] transition-colors duration-500" />
              <div className="border-b border-zinc-900 px-6 py-4 flex justify-between items-center bg-[#070707] text-xs font-mono tracking-wider text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 block animate-pulse" />
                  <span className="text-[#FFCC00] uppercase font-bold text-xs">AI Core</span>
                </div>
                <span className="font-mono text-[10px] tracking-widest text-[#FFCC00]">STATIC MODE</span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((message, index) => (
                  <motion.div
                    key={`${message.sender}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[#121210] border border-[#FFCC00]/30 flex items-center justify-center flex-shrink-0 text-[#FFCC00] shadow-[0_0_8px_rgba(255,204,0,0.1)]">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`p-4 font-sans text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap rounded-sm border ${message.sender === 'user' ? 'bg-[#141414] border-r-2 border-r-[#FFCC00] border-zinc-700/80 text-white' : 'bg-[#0E0E0E] border-l-2 border-l-zinc-700 border-zinc-800 text-zinc-300'}`}>
                      <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5 opacity-60">
                        {message.sender === 'user' ? 'User' : 'Assistant'}
                      </div>
                      <div>{message.text}</div>
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-[#161616] border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isSendingMessage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-full bg-[#121210] border border-[#FFCC00]/30 flex items-center justify-center flex-shrink-0 text-[#FFCC00]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-[#0E0E0E] border border-zinc-800 p-4 rounded-sm text-zinc-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                      Synthesizing reply...
                    </div>
                  </motion.div>
                )}

                <div ref={chatBottomRef} />
              </div>

              <div className="bg-[#080808] border-t border-[#121212] p-4">
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-3">Suggested queries:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'Draft a cinematic portrait prompt for Instagram 4:5',
                    'Fix a GitHub Pages Next.js deploy error',
                    'Create a premium glassmorphism website hero prompt',
                    'Explain how to convert a website to Android APK',
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isSendingMessage}
                      className="text-left px-3 py-2 border border-zinc-900 bg-[#0A0A0A] hover:border-zinc-700 text-xs text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50 font-sans truncate"
                    >
                      ⚡ {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#121212] p-4 bg-[#070707] flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={event => setChatInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Ask Sayanth Rock AI..."
                  disabled={isSendingMessage}
                  className="flex-1 bg-[#050505] border border-zinc-800 focus:border-[#FFCC00] text-sm text-white px-4 py-3 placeholder:text-zinc-700 outline-none transition-colors animate-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,204,0,0.15)] disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'status' && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'GitHub Pages',
                text: 'Uses static export and uploads the out folder for Pages deployment.',
              },
              {
                title: 'Android APK',
                text: 'Capacitor wraps the live GitHub Pages URL inside an Android WebView.',
              },
              {
                title: 'No API Routes',
                text: 'Server-only Next.js API routes were removed from the static build path.',
              },
            ].map(card => (
              <div key={card.title} className="bg-[#0A0A0A] border border-zinc-800 p-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover:bg-[#FFCC00] transition-colors duration-500" />
                <CheckCircle2 className="w-7 h-7 text-[#FFCC00] mb-4" />
                <h2 className="text-white font-display uppercase tracking-tight text-2xl mb-3">{card.title}</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">{card.text}</p>
              </div>
            ))}

            <a
              href="https://github.com/SayanthRock/Sayanth-Rock-ai/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="md:col-span-3 bg-[#FFCC00] text-black px-6 py-4 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 transition-all"
            >
              <Github className="w-4 h-4" /> Open GitHub Actions
            </a>
          </motion.div>
        )}
      </section>
    </main>
  );
}
