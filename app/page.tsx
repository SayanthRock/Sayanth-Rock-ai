/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Copy, Check, Terminal, Wand2, CodeXml, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const STYLES = [
  "Cinematic & Dramatic",
  "Photorealistic 8k",
  "Dark Cyberpunk",
  "Ethereal Fantasy",
  "Studio Macro Photography",
  "Minimalist Flat Vector"
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Error generating prompt. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.master_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="mb-16 border-b border-zinc-800 pb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-end"
        >
          <div>
            <div className="flex items-center gap-2 text-[#FFCC00] text-sm uppercase tracking-widest font-mono mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI Prompt Engineering</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-white uppercase tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
              Sayanth <span className="text-[#FFCC00]">Rock AI</span>
            </h1>
          </div>
          <div className="text-zinc-500 font-mono text-sm max-w-sm md:text-right">
            Transform simple ideas into highly structured, professional prompt payloads for elite image generation models.
          </div>
        </motion.header>

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
                 <Terminal className="w-4 h-4 text-[#FFCC00]" /> Raw Idea
               </label>
               <textarea
                 value={prompt}
                 onChange={e => setPrompt(e.target.value)}
                 placeholder="e.g., A sprawling futuristic city in the rain..."
                 className="w-full h-32 bg-transparent text-white p-2 text-lg focus:outline-none font-sans resize-none placeholder:text-zinc-700 transition-colors"
               />
             </div>

             {/* Styles Picker */}
             <div className="space-y-4">
               <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                 <Wand2 className="w-4 h-4 text-[#FFCC00]" /> Aesthetic Profile
               </label>
               <div className="flex flex-wrap gap-2">
                 {STYLES.map(s => (
                   <button
                     key={s}
                     onClick={() => setStyle(s)}
                     className={`px-5 py-3 font-mono text-xs uppercase tracking-wider transition-all duration-300 border ${
                       style === s 
                         ? 'bg-[#FFCC00] text-black border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.3)]' 
                         : 'bg-[#0A0A0A] border-zinc-800 text-zinc-400 hover:border-[#FFCC00] hover:text-[#FFCC00]'
                     }`}
                   >
                     {s}
                   </button>
                 ))}
               </div>
             </div>

             {/* Generate Button */}
             <button
               onClick={handleGenerate}
               disabled={!prompt.trim() || isGenerating}
               className="w-full relative group overflow-hidden border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <div className="absolute inset-0 bg-[#FFCC00] transition-transform duration-300 group-hover:scale-[1.02]" />
               <div className="relative flex items-center justify-center gap-3 px-8 py-5 text-black font-mono text-sm uppercase tracking-widest font-bold">
                 {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Synthesizing Payload...
                    </>
                 ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Engage Enhancement
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
             className="bg-[#0A0A0A] border border-zinc-800 h-full min-h-[500px] flex flex-col relative shadow-2xl"
           >
             <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black/40 backdrop-blur-sm">
               <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                 <CodeXml className="w-4 h-4 text-[#FFCC00]" /> Response Payload Payload
               </div>
               {result && (
                  <button onClick={copyToClipboard} className="flex items-center gap-2 text-[#FFCC00] font-mono text-xs uppercase tracking-widest hover:text-white transition-colors">
                     {copied ? 'Copied' : 'Copy'}
                     {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
               )}
             </div>
             
             <div className="flex-1 p-0 overflow-auto relative">
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
                       <span className="animate-pulse">Processing natural language...</span>
                     </motion.div>
                  ) : result ? (
                     <motion.div 
                       key="result"
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="h-full"
                     >
                       <SyntaxHighlighter
                         language="json"
                         style={vscDarkPlus}
                         customStyle={{ margin: 0, background: 'transparent', padding: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}
                       >
                         {JSON.stringify(result, null, 2)}
                       </SyntaxHighlighter>
                     </motion.div>
                  ) : (
                     <motion.div 
                       key="empty"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="absolute inset-0 flex items-center justify-center text-zinc-700 font-mono text-xs uppercase tracking-widest"
                     >
                       <div className="text-center">
                         <Terminal className="w-12 h-12 mx-auto mb-4 opacity-20" />
                         Awaiting Input Sequence
                       </div>
                     </motion.div>
                  )}
                </AnimatePresence>
             </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
