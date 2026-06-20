/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, Check, Terminal, CodeXml, Loader2, Image as ImageIcon, Wand2, Upload, Key, Server, Copy, Github, Search, RefreshCw, ExternalLink, MessageSquare, Send, Bot, User } from 'lucide-react';
import Image from 'next/image';

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
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { sender: 'assistant', text: 'Hi! I am the Image Transformer AI, your ultra high-performance dynamic intelligence. You can chat with me about anything, or ask me to draft detailed visual prompts for the image generation engine!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

    try {
      const currentHistory = [...chatMessages, userMessage];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentHistory })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }
      setChatMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
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

  const categories = ['All', ...Array.from(new Set(apiKeys.map(k => k.category).filter(Boolean)))];
  const filteredKeys = apiKeys.filter(k => {
    const matchesSearch = k.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          k.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          k.baseUrl.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || k.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      alert(err.message || 'Error fetching keys from GitHub repository.');
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
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
        
        if (res.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
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

  if (!mounted) return null;

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
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto text-left space-y-6"
          >
            {/* Chat container board */}
            <div className="bg-[#0A0A0A] border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col min-h-[550px] max-h-[650px] rounded-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 hover:bg-[#FFCC00] transition-colors duration-500" />
              
              {/* Terminal header line */}
              <div className="border-b border-zinc-900 px-6 py-4 flex justify-between items-center bg-[#070707] text-xs font-mono tracking-wider text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50 block animate-pulse" />
                  <span className="text-[#FFCC00] uppercase font-bold text-xs">AI Core</span>
                </div>
                <span className="font-mono text-[10px] tracking-widest text-[#FFCC00]">STATUS: ACTIVE</span>
              </div>

              {/* Message scroll list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[#121210] border border-[#FFCC00]/30 flex items-center justify-center flex-shrink-0 text-[#FFCC00] shadow-[0_0_8px_rgba(255,204,0,0.1)]">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`p-4 font-sans text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap rounded-sm border ${
                        msg.sender === 'user'
                          ? 'bg-[#141414] border-r-2 border-r-[#FFCC00] border-zinc-700/80 text-white'
                          : 'bg-[#0E0E0E] border-l-2 border-l-zinc-700 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5 flex justify-between items-center opacity-60">
                        <span>{msg.sender === 'user' ? 'User Identity' : 'Sayanth Intelligence'}</span>
                        <span className="text-[8px] font-mono opacity-50 ml-4">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div>{msg.text}</div>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-[#161616] border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isSendingMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#121210] border border-[#FFCC00]/30 flex items-center justify-center flex-shrink-0 text-[#FFCC00] animate-spin">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-[#0E0E0E] border border-zinc-800 p-4 rounded-sm text-zinc-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                      Synthesizing neural reply...
                    </div>
                  </motion.div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Interactive quick starting queries */}
              <div className="bg-[#080808] border-t border-[#121212] p-4">
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-3">Suggested queries to start:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Draft a creative cyberpunk landscape prompt with glowing neon elements",
                    "Create a surreal atmospheric prompt for a medieval high-fantasy scene",
                    "What is the best way to utilize the Free API keys retrieved on this site?",
                    "How do I configure custom aspect ratios for high quality generation?"
                  ].map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isSendingMessage}
                      className="text-left px-3 py-2 border border-zinc-900 bg-[#0A0A0A] hover:border-zinc-700 text-xs text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50 font-sans truncate"
                    >
                      ⚡ {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat input form panel */}
              <div className="border-t border-[#121212] p-4 bg-[#070707] flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                       handleSendMessage();
                    }
                  }}
                  placeholder="Prompt the dynamic AI entity... (e.g. Help me optimize my design)"
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

        {activeTab === 'keys' && (

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-left"
            >
              {/* GitHub Interlink Panel */}
              <div className="bg-[#0A0A0A] border border-zinc-800 p-8 shadow-2xl relative overflow-hidden group">
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
                      Point Image Transformer AI to any structured markdown tables on GitHub to pull, decode, and cache raw LLM API credentials in real-time.
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
                      className="px-3 py-1.5 border border-zinc-800 text-[10px] font-mono uppercase bg-zinc-950 text-zinc-400 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors"
                    >
                      Official Free Keys
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
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
                    className="px-6 py-3 bg-[#FFCC00] text-black font-mono text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,204,0,0.2)] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingKeys ? 'animate-spin' : ''}`} />
                    {isLoadingKeys ? 'Interlinking...' : 'Establish Handshake'}
                  </button>
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
                            <div className="text-[#FFCC00] text-[10px] uppercase tracking-widest font-mono mb-2">
                              {k.category}
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
    </div>
  );
}
