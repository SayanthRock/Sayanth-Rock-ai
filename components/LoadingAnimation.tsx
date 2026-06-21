
import React from 'react';
import { motion } from 'motion/react';

export default function LoadingAnimation() {
  return (
    <motion.div 
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 font-mono text-xs uppercase tracking-widest bg-zinc-950/90 backdrop-blur-md"
    >
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-t-2 border-l-2 border-indigo-500 rounded-full animate-spin" />
        <div className="absolute inset-2 border-r-2 border-b-2 border-zinc-700 rounded-full animate-spin [animation-direction:reverse] [animation-duration:2s]" />
        <div className="absolute inset-8 bg-indigo-500/20 rounded-full animate-pulse" />
      </div>
      <span className="animate-pulse tracking-[0.2em] font-bold">Rendering Image...</span>
    </motion.div>
  );
}
