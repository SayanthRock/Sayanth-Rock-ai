'use client'
import React from 'react';
import { History, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function ImageGallery({ history, onLoadPrompt }: { 
    history: Array<{ url: string; prompt: string; aspectRatio: string; timestamp: number }>;
    onLoadPrompt: (prompt: string, aspectRatio: string) => void;
}) {
    if (history.length === 0) return null;

    return (
        <div className="mt-12">
            <h2 className="flex items-center gap-2 font-mono text-sm text-zinc-400 uppercase tracking-widest mb-6">
                <History className="w-4 h-4 text-[#FFCC00]" /> Generation History
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {history.map((item, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                        className="group relative border border-zinc-800 bg-[#0A0A0A] overflow-hidden"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt="History" className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                            <button 
                                onClick={() => onLoadPrompt(item.prompt, item.aspectRatio)}
                                className="bg-[#FFCC00] text-black p-2 rounded-full hover:scale-110 transition-transform"
                                title="Load Prompt"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
