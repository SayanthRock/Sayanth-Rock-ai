/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, Check, Plus, Terminal, CodeXml, Loader2, Image as ImageIcon, Wand2, Upload, Key, Server, Copy, Github, Search, RefreshCw, ExternalLink, MessageSquare, Send, Bot, User, Volume2, VolumeX, Sliders, Cpu, Trash2, History, Radio, Mic, Activity, Video, Play, Square, Compass, MapPin, HelpCircle, Globe } from 'lucide-react';
import Image from 'next/image';
import ImageGallery from '../components/ImageGallery';
import LoadingAnimation from '../components/LoadingAnimation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../components/FirebaseProvider';

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'image' | 'chat' | 'music' | 'video' | 'keys' | 'live' | 'tools'>('image');
  
  // Image Generation State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [imageModel, setImageModel] = useState('gemini-3.1-flash-image');
  const [apiType, setApiType] = useState<'generateContent' | 'interactions'>('generateContent');
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
  const [blueprintCategory, setBlueprintCategory] = useState('All');

  // Chat AI State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; modelUsed?: string }>>([
    { sender: 'assistant', text: 'Hi! I am the Sayanth Rock AI, your ultra high-performance dynamic intelligence. You can chat with me about anything, or ask me to draft detailed visual prompts for the image generation engine!', modelUsed: 'System Core' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Live API Simulation State
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveMicEnabled, setLiveMicEnabled] = useState(false);
  const [liveCameraEnabled, setLiveCameraEnabled] = useState(false);
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(true);
  const [liveSelectedVoice, setLiveSelectedVoice] = useState('Aoede');
  const [liveTerminalLogs, setLiveTerminalLogs] = useState<Array<{ time: string; direction: 'client' | 'server'; type: string; message: string }>>([
    { time: '09:12:27', direction: 'client', type: 'SYS_INIT', message: 'Ready to establish stateful websocket...' }
  ]);
  const [liveTranscripts, setLiveTranscripts] = useState<Array<{ sender: 'user' | 'gemini'; text: string }>>([
    { sender: 'gemini', text: "Welcome! The stateful Live API connection is primed. Toggle inputs or click 'Start Live Session' to establish a real-time WebSocket channel." }
  ]);
  const [liveStreamingActive, setLiveStreamingActive] = useState(false);
  const [activeCodeExplorerTab, setActiveCodeExplorerTab] = useState<'python' | 'js' | 'curl'>('python');
  const [skillsToolMode, setSkillsToolMode] = useState<'skills_sh' | 'context7'>('skills_sh');
  const [skillsSelectTab, setSkillsSelectTab] = useState<'gemini_api_dev' | 'gemini_live_api_dev' | 'gemini_interactions_api'>('gemini_api_dev');

  // Tools Simulator Tab States
  const [toolsActivePreset, setToolsActivePreset] = useState<'calc' | 'place' | 'search_flight' | 'custom_fn'>('calc');
  const [toolsEnabledList, setToolsEnabledList] = useState<string[]>(['search', 'code_exec', 'google_maps']);
  const [toolsInputQuery, setToolsInputQuery] = useState('Calculate the square root of the latest stock price of GOOG.');
  const [toolsActiveCodeTab, setToolsActiveCodeTab] = useState<'python' | 'js' | 'curl'>('python');
  const [toolsStatus, setToolsStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [toolsStepLogs, setToolsStepLogs] = useState<Array<{ step: string; status: 'pending' | 'success' | 'running'; title: string; desc: string; detail?: string }>>([]);
  const [toolsFinalResponse, setToolsFinalResponse] = useState<string>('');

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
  const [imageHistory, setImageHistory] = useState<Array<{ url: string; prompt: string; aspectRatio: string; timestamp: number }>>([]);
  
  // Music Generation
  const [musicPrompt, setMusicPrompt] = useState('');
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  // Video Generation
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const triggerToaster = (msg: string) => {
    setToasterMessage(msg);
    setTimeout(() => {
      setToasterMessage(null);
    }, 4000);
  };

  const handleToggleLiveConnection = () => {
    if (chatSoundEnabled) playSound('power');
    if (liveConnected) {
      setLiveConnected(false);
      setLiveStreamingActive(false);
      setLiveTerminalLogs(prev => [
        { time: new Date().toLocaleTimeString(), direction: 'client', type: 'CONN_CLOSE', message: 'WebSocket connection closed by user request.' },
        ...prev
      ]);
    } else {
      setLiveConnected(true);
      setLiveTerminalLogs([
        { time: new Date().toLocaleTimeString(), direction: 'client', type: 'CONN_REQ', message: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.InteractionsService' },
        { time: new Date().toLocaleTimeString(), direction: 'server', type: 'CONN_ACK', message: 'Upgrade: WebSocket. Status: 101 Switching Protocols' },
        { time: new Date().toLocaleTimeString(), direction: 'server', type: 'SESSION_READY', message: 'Session acknowledged. Active audio codec: PCM 24kHz output.' }
      ]);
      setLiveTranscripts([
        { sender: 'gemini', text: "Channels established. Hello, I am Gemini. I can hear your audio streaming and see your video frames in real-time. What shall we analyze or generate?" }
      ]);
    }
  };

  const handleSendLivePreset = (text: string, responseText: string) => {
    if (!liveConnected) {
      triggerToaster("Please establish a stateful connection first!");
      return;
    }
    if (chatSoundEnabled) playSound('message');
    
    // Add client packet
    const timeNow = new Date().toLocaleTimeString();
    setLiveTerminalLogs(prev => [
      { time: timeNow, direction: 'client', type: 'USER_CONTENT', message: `Sending text payload: "${text}"` },
      ...prev
    ]);

    setLiveTranscripts(prev => [
      ...prev,
      { sender: 'user', text: text }
    ]);

    setLiveStreamingActive(true);

    // Simulate response delay
    setTimeout(() => {
      if (chatSoundEnabled) playSound('response');
      const recvTime = new Date().toLocaleTimeString();
      setLiveTerminalLogs(prev => [
        { time: recvTime, direction: 'server', type: 'MODEL_TURN', message: `Receiving continuous audio frames (24kHz chunk payload)` },
        { time: recvTime, direction: 'server', type: 'TEXT_TRANSCRIPT', message: `Spoken: "${responseText}"` },
        ...prev
      ]);
      setLiveTranscripts(prev => [
        ...prev,
        { sender: 'gemini', text: responseText }
      ]);
      setLiveStreamingActive(false);
    }, 1500);
  };

  const handleSelectToolsPreset = (preset: 'calc' | 'place' | 'search_flight' | 'custom_fn') => {
    setToolsActivePreset(preset);
    setToolsStatus('idle');
    setToolsStepLogs([]);
    setToolsFinalResponse('');
    if (chatSoundEnabled) playSound('click');
    
    switch (preset) {
      case 'calc':
        setToolsInputQuery('Calculate the square root of the latest stock price of GOOG.');
        setToolsEnabledList(['search', 'code_exec']);
        break;
      case 'place':
        setToolsInputQuery('Find five highly rated sushi bars in downtown San Francisco, and render their locations on the map.');
        setToolsEnabledList(['search', 'google_maps']);
        break;
      case 'search_flight':
        setToolsInputQuery('Are there direct flights from Tokyo to San Francisco tomorrow? Search URL and return results.');
        setToolsEnabledList(['search', 'url_context']);
        break;
      case 'custom_fn':
        setToolsInputQuery('Lookup the current fulfillment status of order ID: AI-STUDIO-88931.');
        setToolsEnabledList(['custom_func']);
        break;
    }
  };

  const handleSimulateToolsExecution = () => {
    if (toolsStatus === 'running') return;
    setToolsStatus('running');
    setToolsStepLogs([]);
    setToolsFinalResponse('');
    if (chatSoundEnabled) playSound('power');

    // Sequence generator based on the active preset
    const steps: Array<Array<{ step: string; status: 'running' | 'success' | 'pending'; title: string; desc: string; detail?: string }>> = [];
    let finalAns = '';

    if (toolsActivePreset === 'calc') {
      steps.push([
        { step: 'analyze', status: 'running', title: 'Intent Routing & Tool Selection', desc: 'Gemini structures prompt. Identified dynamic requirements: Web Search (Stock Price) + Code Exec (Math Calculation).' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Intent Routing & Tool Selection', desc: 'Identified Web Search (Stock Price) + Code Exec (Math Calculation).' },
        { step: 'search', status: 'running', title: 'Google Search Grounding', desc: 'Executing search query "GOOG stock price today" on Google search engines.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Intent Routing & Tool Selection', desc: 'Identified Web Search (Stock Price) + Code Exec (Math Calculation).' },
        { step: 'search', status: 'success', title: 'Google Search Grounding', desc: 'Search returned response: "GOOG stock trades at $178.60; up +1.24% on NASDAQ today."', detail: '{"query": "GOOG stock price", "result_count": 12, "top_source": "Google Finance"}' },
        { step: 'code_exec', status: 'running', title: 'Python Code Execution', desc: 'Assembling Python script to compute exact square root on secure cloud container sandbox.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Intent Routing & Tool Selection', desc: 'Identified Web Search (Stock Price) + Code Exec (Math Calculation).' },
        { step: 'search', status: 'success', title: 'Google Search Grounding', desc: 'Search returned response: "GOOG stock trades at $178.60; up +1.24% on NASDAQ today."', detail: '{"query": "GOOG stock price", "result_count": 12, "top_source": "Google Finance"}' },
        { step: 'code_exec', status: 'success', title: 'Python Code Execution', desc: 'Python runtime evaluated script output: 13.364131097838', detail: `import math\nval = 178.60\nprint(math.sqrt(val)) # Result: 13.364131` },
        { step: 'aggregate', status: 'running', title: 'Context Circulation & Formatting', desc: 'Blending math tool streams and internet data inside context weights for final generation.' }
      ]);
      finalAns = 'Grounded in Google Search, the latest trading price of GOOG shares is $178.60. Using built-in Python Code Execution, the square root of $178.60 is calculated as exactly **13.364** (or approximately **13.36**).';
    } else if (toolsActivePreset === 'place') {
      steps.push([
        { step: 'analyze', status: 'running', title: 'Google Maps Place API Query', desc: 'Resolving geographic boundaries of San Francisco and querying localized restaurant nodes.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Google Maps Place API Query', desc: 'Resolved bounds: [37.7749, -122.4194]. Formulating location extraction query.' },
        { step: 'search', status: 'running', title: 'Places Search Handshake', desc: 'Gathering top Sushi Bars with active ratings above 4.5 Stars in downtown quarters.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Google Maps Place API Query', desc: 'Resolved bounds: [37.7749, -122.4194]. Formulating location extraction query.' },
        { step: 'search', status: 'success', title: 'Places Search Handshake', desc: 'Found 5 matches: Akikos, Rintaro, Kusakabe, Robin, Wako.', detail: '[{"name": "Akiko\'s", "lat": 37.7909, "lng": -122.4021, "rating": 4.7}, {"name": "Rintaro", "lat": 37.7684, "lng": -122.4143, "rating": 4.6}]' },
        { step: 'aggregate', status: 'running', title: 'Generating Interactive Map Pins', desc: 'Synthesized geo-coordinates into geoJSON markers for layout map representations.' }
      ]);
      finalAns = 'I have queried Google Maps and found 5 highly rated sushi bars in San Francisco:\n\n1. **Akiko\'s Restaurant** (4.7★, Bush St) - Elegant multi-course omakase.\n2. **Rintaro** (4.6★, 14th St) - Exquisite house-made yakitori & udon.\n3. **Kusakabe** (4.8★, Washington St) - Kyoto-style multi-course dining.\n4. **Robin** (4.6★, Gough St) - Contemporary sushi crafted with local ingredients.\n5. **Wako Sushi** (4.7★, Clement St) - Classic, incredibly precise sushi selections.';
    } else if (toolsActivePreset === 'search_flight') {
      steps.push([
        { step: 'analyze', status: 'running', title: 'Google Search Routing', desc: 'Identifying flight schedules and dates. Searching travel feeds.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Google Search Routing', desc: 'Searching current travel patterns for TYO -> SFO.' },
        { step: 'search', status: 'running', title: 'URL Context Retrieval', desc: 'Evaluating specific flight database indices for direct options tomorrow.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Google Search Routing', desc: 'Searching current travel patterns for TYO -> SFO.' },
        { step: 'search', status: 'success', title: 'URL Context Retrieval', desc: 'Retrieved flights: ANA NH008 (Direct, 12:45 PM), JAL JL002 (Direct, 18:20 PM).', detail: '{"origin": "NRT", "dest": "SFO", "carrier_count": 2, "avg_duration": "9h15m"}' },
        { step: 'aggregate', status: 'running', title: 'Formulating Response', desc: 'Compiling direct times, flight numbers, and availability into clean cards.' }
      ]);
      finalAns = 'Yes! There are **direct flights** available from Tokyo (NRT/HND) to San Francisco (SFO) tomorrow. Grounded in real-time updates:\n\n* **ANA NH008**: Departs Narita at **12:45 PM**, arrives SFO same-day at **06:10 AM** (Duration: 9h25m).\n* **Japan Airlines JL002**: Departs Haneda at **18:20 PM**, arrives SFO at **11:45 AM** (Duration: 9h25m).';
    } else if (toolsActivePreset === 'custom_fn') {
      steps.push([
        { step: 'analyze', status: 'running', title: 'Detecting Custom Function Need', desc: 'Prompt requires private account/database lookup. Formulating client JSON callback payload.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Detecting Custom Function Need', desc: 'Function parameters computed: get_order_status(order_id="AI-STUDIO-88931").' },
        { step: 'search', status: 'running', title: 'Client Handshake Dispatch (Yield)', desc: 'Model returns control to client-side JS runtime. Waiting for app to execute local databases API.' }
      ]);
      steps.push([
        { step: 'analyze', status: 'success', title: 'Detecting Custom Function Need', desc: 'Function parameters computed: get_order_status(order_id="AI-STUDIO-88931").' },
        { step: 'search', status: 'success', title: 'Local DB Evaluation', desc: 'App retrieved order: status="Shipped", delivery_date="June 22, 2026", carrier="FedEx".', detail: '{"order_id": "AI-STUDIO-88931", "client_auth": "token_verified", "sql_time_ms": 3.4}' },
        { step: 'aggregate', status: 'running', title: 'Circulating Decrypted Thoughts', desc: 'Sending private database results back to the Gemini context window for full conversational summarization.' }
      ]);
      finalAns = 'Found order **AI-STUDIO-88931** in your transactions. Current status is **Shipped** (In Transit). It is currently tracked with **FedEx** and scheduled to arrive on **June 22, 2026** before end-of-day. No signature is required and it contains your Google Developers gear.';
    }

    // Interactive timeout loop to render steps
    steps.forEach((stepSet, index) => {
      setTimeout(() => {
        setToolsStepLogs(stepSet);
        if (chatSoundEnabled) playSound('message');
        
        // Final response trigger
        if (index === steps.length - 1) {
          setTimeout(() => {
            setToolsStepLogs(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'success' } : s));
            setToolsFinalResponse(finalAns);
            setToolsStatus('done');
            if (chatSoundEnabled) playSound('response');
            triggerToaster("Cognitive Tool pipeline simulation completed successfully!");
          }, 900);
        }
      }, (index + 1) * 900);
    });
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
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('image_history');
      if (stored) {
        try {
          setImageHistory(JSON.parse(stored));
        } catch (e) { console.error(e); }
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
      
      if (!res.ok) {
        let errMsg = 'Failed to generate response';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          try {
            errMsg = await res.text();
          } catch {}
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
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
      
      if (!res.ok) {
        console.error(`API request failed with status ${res.status}`);
        let errMsg = `Failed to fetch keys (Status: ${res.status})`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await res.json();
            errMsg = errData.error || errData.message || errMsg;
          } else {
            errMsg = await res.text() || errMsg;
          }
        } catch (e) {
          console.error("Failed to parse error response", e);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
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
            isEditing: !!referenceImage,
            model: imageModel,
            apiType
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
      
      const newEntry = { url: data.url, prompt, aspectRatio, timestamp: Date.now() };
      const updatedHistory = [newEntry, ...imageHistory];
      setImageHistory(updatedHistory);
      localStorage.setItem('image_history', JSON.stringify(updatedHistory));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error generating image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    setIsGeneratingMusic(true);
    setMusicUrl(null);
    try {
        const res = await fetch('/api/generate-music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: musicPrompt })
        });
        if (!res.ok) throw new Error('Failed to generate music');
        const data = await res.json();
        setMusicUrl(data.musicUrl);
    } catch (err: any) {
        console.error(err);
        triggerToaster(err.message || 'Error generating music.');
    } finally {
        setIsGeneratingMusic(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    try {
        const res = await fetch('/api/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: videoPrompt, aspectRatio: '16:9' })
        });
        if (!res.ok) throw new Error('Failed to generate video');
        const data = await res.json();
        setVideoUrl(data.operationName);
    } catch (err: any) {
        console.error(err);
        triggerToaster(err.message || 'Error generating video.');
    } finally {
        setIsGeneratingVideo(false);
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
            <div className="flex items-center gap-2 text-indigo-500 text-sm uppercase tracking-widest font-mono mb-4">
               <ImageIcon className="w-4 h-4" />
              <span>Image Engine</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-white uppercase tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
              Sayanth Rock <span className="text-indigo-500">AI</span>
            </h1>
          </div>
          <div className="text-zinc-500 font-mono text-sm max-w-sm md:text-right">
            Sayanth Rock AI Free API Directory.
          </div>
        </motion.header>

        <div className="flex justify-center mb-12">
            <div className="inline-flex bg-zinc-950/50 border border-zinc-800/50 p-1.5 rounded-xl backdrop-blur-sm flex-wrap justify-center gap-1">
              <button 
                onClick={() => setActiveTab('image')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-all rounded-lg ${activeTab === 'image' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <ImageIcon className="w-4 h-4" /> Generate Image
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-all rounded-lg ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <MessageSquare className="w-4 h-4" /> Chat AI
              </button>
              <button 
                onClick={() => setActiveTab('music')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-all rounded-lg ${activeTab === 'music' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Mic className="w-4 h-4" /> Generate Music
              </button>
              <button 
                onClick={() => setActiveTab('video')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-all rounded-lg ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Video className="w-4 h-4" /> Generate Video
              </button>
              <button 
                onClick={() => setActiveTab('keys')}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-all rounded-lg ${activeTab === 'keys' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Key className="w-4 h-4" /> Free API Keys
              </button>
              <button 
                onClick={() => {
                  setActiveTab('live');
                  if (chatSoundEnabled) playSound('click');
                }}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-all rounded-lg ${activeTab === 'live' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Radio className="w-4 h-4" /> Live API (Beta)
              </button>
              <button 
                onClick={() => {
                  setActiveTab('tools');
                  if (chatSoundEnabled) playSound('click');
                }}
                className={`px-6 md:px-8 py-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest transition-all rounded-lg ${activeTab === 'tools' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Sliders className="w-4 h-4" /> Tools API
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

             {/* API Mode Selector (Stable vs Beta) */}
              <div id="api-mode-selector" className="space-y-4 mb-6 p-4 bg-zinc-900/30 border border-zinc-800/80 rounded-sm">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                    <Sliders className="w-4 h-4 text-[#FFCC00]" /> Native Gemini API Mode
                  </label>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/25 uppercase tracking-wider font-semibold">
                    NEW BETA
                  </span>
                </div>
                
                <p className="text-zinc-400 text-xs leading-relaxed font-sans mt-0.5">
                  Choose the underlying Gemini runtime API technique. The new <strong className="text-zinc-200 font-semibold">Interactions API</strong> supports conversation-driven editing and state tracking.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    id="api-mode-stable-btn"
                    type="button"
                    onClick={() => {
                      setApiType('generateContent');
                      if (chatSoundEnabled) playSound('click');
                    }}
                    className={`font-mono text-xs py-2.5 px-3 border transition-all duration-300 flex flex-col items-center gap-1.5 ${
                      apiType === 'generateContent'
                        ? 'bg-zinc-900 border-[#FFCC00] text-white shadow-[0_0_15px_rgba(255,204,0,0.1)]'
                        : 'bg-[#0A0A0A]/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold text-xs">generateContent</span>
                    <span className="text-[9px] text-zinc-400 font-sans tracking-wide uppercase">STABLE (RECOMMENDED)</span>
                  </button>

                  <button
                    id="api-mode-beta-btn"
                    type="button"
                    onClick={() => {
                      setApiType('interactions');
                      if (chatSoundEnabled) playSound('click');
                    }}
                    className={`font-mono text-xs py-2.5 px-3 border transition-all duration-300 flex flex-col items-center gap-1.5 ${
                      apiType === 'interactions'
                        ? 'bg-zinc-900 border-[#FFCC00] text-white shadow-[0_0_15px_rgba(255,204,0,0.1)]'
                        : 'bg-[#0A0A0A]/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1">
                      interactions <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    </span>
                    <span className="text-[9px] text-[#FFCC00] font-sans tracking-wide uppercase">BETA RUNTIME</span>
                  </button>
                </div>
              </div>

             {/* Nano Banana Image Models Selector */}
              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
                  <Bot className="w-4 h-4 text-[#FFCC00]" /> Active Nano Banana Engine
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'gemini-3.1-flash-image', name: 'Nano Banana 2', tag: 'RECOMMENDED', desc: 'Optimized for high-performance speed, dynamic details, and standard production tasks.' },
                    { id: 'gemini-3-pro-image', name: 'Nano Banana Pro', tag: 'HIGH FIDELITY', desc: 'Utilizes advanced reasoning/thinking to accurately render text and highly complex details.' },
                    { id: 'gemini-2.5-flash-image', name: 'Nano Banana', tag: 'LEGACY SPEED', desc: 'Ultra-low latency, optimized for simple lighting styles and rapid prototyping loops.' }
                  ].map((m) => {
                    const isSelected = imageModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setImageModel(m.id);
                          if (chatSoundEnabled) playSound('click');
                        }}
                        className={`text-left p-3.5 border transition-all duration-300 relative group overflow-hidden ${
                          isSelected
                            ? 'bg-zinc-900/90 border-[#FFCC00] shadow-[0_0_20px_rgba(255,204,0,0.15)]'
                            : 'bg-[#0A0A0A]/80 border-zinc-800 text-zinc-400 hover:border-[#FFCC00]/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-[#FFCC00]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                        )}
                        
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm tracking-tight transition-colors ${isSelected ? 'text-[#FFCC00]' : 'text-zinc-200 group-hover:text-white'}`}>
                              {m.name}
                            </span>
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 uppercase tracking-wider">
                              {m.tag}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-[#FFCC00] uppercase tracking-widest border-b border-dashed border-[#FFCC00]/30 pb-0.5">
                            {isSelected ? '■ ACTIVE' : '□ SELECT'}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed font-sans">
                          {m.desc}
                        </p>
                        <div className="mt-2 flex items-center gap-1 font-mono text-[9px] text-[#FFCC00]">
                          <Cpu className="w-3.5 h-3.5 text-[#FFCC00]/70" />
                          <span className="text-zinc-500 uppercase">Code:</span>
                          <span className="font-mono text-zinc-300">{m.id}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
             <ImageGallery history={imageHistory} onLoadPrompt={(p, a) => { setPrompt(p); setAspectRatio(a); }} />
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
                     <LoadingAnimation />
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

        {activeTab === 'music' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-display text-white">Generate Music</h2>
            <textarea value={musicPrompt} onChange={(e) => setMusicPrompt(e.target.value)} className="w-full bg-zinc-900 text-white p-4 rounded" placeholder="Enter music prompt..."></textarea>
            <button onClick={handleGenerateMusic} className="bg-indigo-600 text-white px-6 py-2 rounded-lg" disabled={isGeneratingMusic}>
              {isGeneratingMusic ? 'Generating...' : 'Generate Music'}
            </button>
            {musicUrl && <audio controls src={musicUrl} className="w-full" />}
          </motion.div>
        )}
        {activeTab === 'video' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-display text-white">Generate Video</h2>
            <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} className="w-full bg-zinc-900 text-white p-4 rounded" placeholder="Enter video prompt..."></textarea>
            <button onClick={handleGenerateVideo} className="bg-indigo-600 text-white px-6 py-2 rounded-lg" disabled={isGeneratingVideo}>
              {isGeneratingVideo ? 'Generating...' : 'Generate Video'}
            </button>
            {videoUrl && (
                <div className="text-sm text-zinc-400 bg-zinc-900 p-4 rounded">
                  Video generation started: {videoUrl}
                </div>
            )}
          </motion.div>
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
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#FFCC00]" />
                      <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Suggested Prompt blueprints:</span>
                    </div>
                    <select 
                      value={blueprintCategory}
                      onChange={(e) => setBlueprintCategory(e.target.value)}
                      className="bg-zinc-950 text-zinc-400 font-mono text-[9px] border border-zinc-800 rounded px-2 py-0.5 outline-none hover:border-zinc-700 focus:border-[#FFCC00]"
                    >
                      <option value="All">All Styles</option>
                      <option value="Cinematic">Cinematic</option>
                      <option value="Abstract">Abstract</option>
                      <option value="Technical">Technical</option>
                      <option value="Fantasy">Fantasy</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        title: "Cyberpunk Rainscape",
                        desc: "Visual prompt with glowing holograms & chrome details",
                        promptText: "A hyper-detailed photorealistic cyberpunk city street in torrential rain, towering glowing holographic billboards in violet and neon amber, reflecting off wet asphalt, flying shuttle vehicles, ultra high resolution 8k, photorealistic octane render.",
                        category: "Cinematic"
                      },
                      {
                        title: "Fantasy Castle ruins",
                        desc: "Surreal ethereal fantasy prompt in twilight golden light",
                        promptText: "Ethereal ruins of an ancient gothic castle sitting on a steep high cliff at celestial twilight, floating glowing runic islands in the sky, warm golden rays, painterly soft hyperrealistic style, highly detailed fantasy environment.",
                        category: "Fantasy"
                      },
                      {
                        title: "Data Visualization",
                        desc: "Abstract network structure in high contrast",
                        promptText: "Abstract network visualization of global data streams, glowing nodes connected by fiber optic light trails, dark background, cinematic volumetric lighting, 8k resolution, minimalist style.",
                        category: "Abstract"
                      },
                      {
                        title: "Circuitry Schematic",
                        desc: "Detailed technical PCB design top-down view",
                        promptText: "Top-down macro shot of a complex high-tech PCB board, gold-plated pathways, intricate microscopic components, realistic materials, sharp focus, cinematic lighting, industrial design aesthetic.",
                        category: "Technical"
                      }
                    ].filter(s => blueprintCategory === 'All' || s.category === blueprintCategory).map((suggestion, sIdx) => (
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
                        {user ? (
                          <div className="text-zinc-300 font-mono text-xs">Logged in as {user.email}</div>
                        ) : (
                          <button onClick={async () => {
                            const provider = new GoogleAuthProvider();
                            try {
                                await signInWithPopup(auth, provider);
                                triggerToaster("Logged in successfully!");
                            } catch (error) {
                                console.error("Login failed:", error);
                                triggerToaster("Login failed.");
                            }
                          }} className="text-white font-mono text-xs border border-zinc-700 px-3 py-1 hover:bg-zinc-800 transition-colors">Sign in with Google</button>
                        )}
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

         {activeTab === 'live' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-left"
            >
              {/* Top Summary Banner */}
              <div id="live-api-top-banner" className="bg-[#0A0A0A] border border-zinc-800 p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#FFCC00]" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-900/60 mb-6">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#FFCC00] uppercase tracking-widest">
                      <Radio className="w-4 h-4 animate-pulse text-[#FFCC00]" />
                      <span>STATEFUL MULTIMODAL SERVICE</span>
                    </div>
                    <h2 className="font-display text-3xl text-white uppercase tracking-tight mt-1">
                      Gemini Live API Playground
                    </h2>
                    <p className="text-zinc-500 text-xs font-mono max-w-2xl mt-1">
                      Low-latency, real-time voice and vision interactions with Gemini. Stream continuous raw 16-bit PCM audio, video frames (JPEG &lt;= 1FPS), and text payloads over a stateful WebSockets protocol.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] px-2.5 py-1.5 rounded bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20 uppercase tracking-widest font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,204,0,0.05)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      WSS PROT v1BETA
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-400">
                  <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                    <span className="block font-mono text-[10px] text-[#FFCC00] uppercase tracking-wider mb-1 font-bold">Input Modalities</span>
                    Audio (PCM 16kHz, little-endian), continuous video frames (JPEG &lt;= 1FPS), and textual chunks.
                  </div>
                  <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                    <span className="block font-mono text-[10px] text-[#FFCC00] uppercase tracking-wider mb-1 font-bold">Output Modalities</span>
                    Audio (PCM 24kHz, little-endian) for high fidelity, together with real-time text transcription turns.
                  </div>
                  <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                    <span className="block font-mono text-[10px] text-[#FFCC00] uppercase tracking-wider mb-1 font-bold">Low-latency Features</span>
                    Affective dialogue, immediate barge-in interruption, stateful function tools, and Live Google Search grounding.
                  </div>
                </div>
              </div>

              {/* Playground Simulator Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Column 1: Live API Active Controller (7 Cols) */}
                <div className="lg:col-span-7 bg-[#0A0A0A] border border-zinc-800 p-6 md:p-8 flex flex-col justify-between relative group/ctl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover/ctl:bg-[#FFCC00] transition-colors duration-500" />
                  
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#FFCC00]" />
                        <h3 className="font-mono text-sm uppercase text-white tracking-widest">Active WebSocket Console</h3>
                      </div>
                      <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded border ${
                        liveConnected 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                      }`}>
                        {liveConnected ? 'CONNECTED' : 'STANDBY'}
                      </span>
                    </div>

                    {/* Quick Config Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="bg-zinc-950/60 border border-zinc-900 p-2 text-center rounded-sm">
                        <span className="block text-[8px] text-zinc-500 font-mono uppercase tracking-widest mb-1.5">Voice Model</span>
                        <select 
                          value={liveSelectedVoice} 
                          onChange={(e) => setLiveSelectedVoice(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-white font-mono text-[10px] rounded-sm px-1.5 py-1 focus:outline-none focus:border-[#FFCC00] w-full cursor-pointer"
                        >
                          <option value="Aoede">Aoede (Default)</option>
                          <option value="Charon">Charon (Deep)</option>
                          <option value="Fenrir">Fenrir (Classic)</option>
                          <option value="Kore">Kore (Smooth)</option>
                          <option value="Puck">Puck (Friendly)</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setLiveMicEnabled(!liveMicEnabled);
                          if (chatSoundEnabled) playSound('click');
                        }}
                        className={`flex flex-col items-center justify-center p-2 border rounded-sm transition-all duration-300 cursor-pointer ${
                          liveMicEnabled 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.08)]' 
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5 mb-1" />
                        <span className="font-mono text-[8px] uppercase tracking-wider">PCM Mic {liveMicEnabled ? 'Live' : 'Off'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setLiveCameraEnabled(!liveCameraEnabled);
                          if (chatSoundEnabled) playSound('click');
                        }}
                        className={`flex flex-col items-center justify-center p-2 border rounded-sm transition-all duration-300 cursor-pointer ${
                          liveCameraEnabled 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.08)]' 
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5 mb-1" />
                        <span className="font-mono text-[8px] uppercase tracking-wider">Vision {liveCameraEnabled ? 'Active' : 'Off'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setLiveSearchEnabled(!liveSearchEnabled);
                          if (chatSoundEnabled) playSound('click');
                        }}
                        className={`flex flex-col items-center justify-center p-2 border rounded-sm transition-all duration-300 cursor-pointer ${
                          liveSearchEnabled 
                            ? 'bg-[#FFCC00]/10 border-[#FFCC00] text-[#FFCC00]' 
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5 mb-1" />
                        <span className="font-mono text-[8px] uppercase tracking-wider">Google Search</span>
                      </button>
                    </div>

                    {/* Big Action Connection Button */}
                    <div className="mb-6">
                      <button
                        onClick={handleToggleLiveConnection}
                        className={`w-full py-4 font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer border-none ${
                          liveConnected 
                            ? 'bg-[#fc4444] hover:bg-[#fc4444]/90 text-white shadow-[0_0_20px_rgba(252,68,68,0.2)] animate-pulse' 
                            : 'bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black shadow-[0_0_20px_rgba(255,204,0,0.25)]'
                        }`}
                      >
                        {liveConnected ? (
                          <>
                            <Square className="w-4 h-4 fill-current" />
                            <span>Stop Active Live Session</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Establish Live WebSocket Stream</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Simulated Voice Streaming Indicator */}
                    <div className="bg-zinc-950 border border-zinc-900 p-4 mb-6 rounded-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                          <Activity className={`w-3 h-3 ${liveStreamingActive ? 'animate-spin text-[#FFCC00]' : 'text-zinc-600'}`} />
                          Multimodal Audio Buffer Output Wave
                        </span>
                        {liveStreamingActive && (
                          <span className="font-mono text-[8px] text-[#FFCC00] animate-pulse uppercase font-semibold">Streaming continuous sound...</span>
                        )}
                      </div>
                      
                      {/* Audio frequency simulated bars */}
                      <div className="h-10 flex items-center justify-center gap-1 bg-zinc-900/40 border border-zinc-800/50 rounded-sm overflow-hidden px-4">
                        {Array.from({ length: 42 }).map((_, idx) => (
                          <motion.div
                            key={idx}
                            animate={liveStreamingActive ? {
                              height: [10, Math.floor(Math.random() * 32) + 8, 10],
                            } : { height: 4 }}
                            transition={{
                              duration: 0.3 + (idx % 5) * 0.1,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className={`w-1 rounded-full ${liveStreamingActive ? 'bg-[#FFCC00]' : 'bg-zinc-800'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Pre-recorded Conversation Scenarios */}
                    <div className="space-y-3">
                      <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Interactive Preset Prompts</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          onClick={() => handleSendLivePreset(
                            "Hi Gemini, describe the latest e-commerce and retail Live API usecase!",
                            "Certainly! E-commerce brands are integrating the Live API to power extremely responsive voice-activated shopping assistants. These assistants process raw customer voice cues to fetch listings and offer immediate bargaining/recommendations with no input latency."
                          )}
                          disabled={!liveConnected || liveStreamingActive}
                          className="p-2.5 text-left border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30 text-[10px] text-zinc-400 font-sans leading-relaxed transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                        >
                          <span className="font-semibold text-zinc-200 block mb-0.5">🛍️ Retail Case Study</span>
                          Showcase e-commerce shopping assistants with low latency.
                        </button>
                        
                        <button
                          onClick={() => handleSendLivePreset(
                            "Gemini, switch to French now and translate the phrase: 'I want a personalized shopping companion'.",
                            "Avec plaisir! Voici la traduction en temps réel: 'Je souhaite avoir un compagnon d'achat personnalisé'. You can speak to me in 70+ supported languages seamlessly."
                          )}
                          disabled={!liveConnected || liveStreamingActive}
                          className="p-2.5 text-left border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30 text-[10px] text-zinc-400 font-sans leading-relaxed transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                        >
                          <span className="font-semibold text-zinc-200 block mb-0.5">🇫🇷 Live Translation</span>
                          Translate conversations on the fly in 70+ languages.
                        </button>

                        <button
                          onClick={() => handleSendLivePreset(
                            "Is affective barge-in dialogue supported for NPC game builders?",
                            "Yes, gaming NPCs using the Live API can detect prompt tone and emotion immediately (affective speech). When the gamer speaks unexpectedly, the model immediately halts its audio turn (barge-in interrupt) for dynamic natural gameplay."
                          )}
                          disabled={!liveConnected || liveStreamingActive}
                          className="p-2.5 text-left border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30 text-[10px] text-zinc-400 font-sans leading-relaxed transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                        >
                          <span className="font-semibold text-zinc-200 block mb-0.5">🎮 Dynamic NPCs</span>
                          Check out barge-in and affective dialog mechanics.
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Transcript panel */}
                  <div className="mt-8 border-t border-zinc-900/80 pt-6">
                    <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-3.5">Dialogue Transcript Turning</span>
                    <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2">
                      {liveTranscripts.map((t, idx) => (
                        <div key={idx} className="flex gap-2.5 text-xs text-left font-sans">
                          {t.sender === 'user' ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 uppercase font-mono flex-shrink-0">U</div>
                              <div className="flex-1">
                                <span className="block font-mono text-[9px] text-zinc-500 uppercase font-semibold">User Content Payload</span>
                                <p className="text-zinc-300 mt-0.5 leading-relaxed">{t.text}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-5 h-5 rounded-full bg-[#FFCC00]/10 border border-[#FFCC00]/20 flex items-center justify-center text-[10px] text-[#FFCC00] uppercase font-mono flex-shrink-0">G</div>
                              <div className="flex-1">
                                <span className="block font-mono text-[9px] text-[#FFCC00] uppercase font-semibold">Gemini Live Spoken Content</span>
                                <p className="text-[#FFCC00] mt-0.5 leading-relaxed font-sans">{t.text}</p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Column 2: Live Protocol Log Explorer (5 Cols) */}
                <div className="lg:col-span-5 bg-[#0A0A0A] border border-zinc-800 p-6 flex flex-col justify-between group/term">
                  <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover/term:bg-[#FFCC00] transition-colors duration-500" />
                  
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Terminal className="text-[#FFCC00] w-4 h-4" />
                        <span className="uppercase text-white tracking-widest">WebSocket Packet Stream</span>
                      </div>
                      <button 
                        onClick={() => setLiveTerminalLogs([])}
                        className="text-zinc-600 hover:text-white transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer"
                        title="Clear logs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-[9px] uppercase tracking-wider">Flush</span>
                      </button>
                    </div>

                    <p className="text-zinc-500 text-[10px] font-mono leading-relaxed mb-4 pb-2 border-b border-zinc-900/60">
                      WebSocket server packets capturing raw binary sound frames, frame indicators, and real-time JSON cues.
                    </p>

                    {/* Scrollable logger container */}
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 font-mono text-[10px] select-text">
                      {liveTerminalLogs.map((log, index) => (
                        <div key={index} className="p-2.5 bg-zinc-950/80 border border-zinc-900/80 hover:border-zinc-800 transition-colors rounded-sm flex flex-col gap-1 text-left">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-1 mb-1">
                            <span className="text-zinc-600 text-[8px]">{log.time}</span>
                            <span className={`px-1 rounded text-[8px] font-semibold uppercase tracking-wider ${
                              log.direction === 'client' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {log.direction === 'client' ? '← Client Send' : '→ Server Recv'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#FFCC00] text-[9px] uppercase">{log.type}:</span>
                            <span className="text-zinc-300 break-all">{log.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-zinc-900/60 font-mono text-[9px] text-zinc-600 flex justify-between uppercase">
                    <span>Protocol: WebSocket Stream</span>
                    <span>Format: Binary / JSON</span>
                  </div>
                </div>
              </div>

              {/* Developer Implementation Blueprints tab panel */}
              <div className="bg-[#0A0A0A] border border-zinc-800 p-6 md:p-8 relative group/code text-left">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover/code:bg-[#FFCC00] transition-colors duration-500" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-4 mb-6 gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#FFCC00] uppercase tracking-widest">
                      <CodeXml className="w-4 h-4" />
                      <span>Developer Integration Code Explorer</span>
                    </div>
                    <h3 className="text-white font-display text-xl uppercase tracking-tight mt-1">
                      Integrating Live API WebSockets
                    </h3>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveCodeExplorerTab('python')}
                      className={`px-3 py-1.5 border font-mono text-[10px] uppercase transition-all cursor-pointer rounded-sm ${
                        activeCodeExplorerTab === 'python'
                          ? 'bg-[#FFCC00] text-black border-transparent font-bold'
                          : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      Python GenAI SDK
                    </button>
                    <button
                      onClick={() => setActiveCodeExplorerTab('js')}
                      className={`px-3 py-1.5 border font-mono text-[10px] uppercase transition-all cursor-pointer rounded-sm ${
                        activeCodeExplorerTab === 'js'
                          ? 'bg-[#FFCC00] text-black border-transparent font-bold'
                          : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      Node.js WebSocket
                    </button>
                    <button
                      onClick={() => setActiveCodeExplorerTab('curl')}
                      className={`px-3 py-1.5 border font-mono text-[10px] uppercase transition-all cursor-pointer rounded-sm ${
                        activeCodeExplorerTab === 'curl'
                          ? 'bg-[#FFCC00] text-black border-transparent font-bold'
                          : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      cURL Handshake
                    </button>
                  </div>
                </div>

                {/* Explorer Display */}
                <div className="relative font-mono text-xs select-text">
                  {activeCodeExplorerTab === 'python' && (
                    <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-sm overflow-x-auto text-left leading-relaxed">
                      <p className="text-zinc-600 text-[10px] mb-4">{"# Real-time stateful chat integration using the modern standard google-genai library built for Python async loops."}</p>
                      <pre className="text-zinc-300">
{`from google import genai
from google.genai import types
import asyncio

client = genai.Client()
model_id = 'gemini-2.0-flash-exp'

# Establish stateful bidirectional live session
async def main():
    async with client.aio.live.connect(model=model_id) as session:
        print("WebSocket session connected.")
        
        # Start a sending task for audio stream / video chunks
        async def send_audio():
            while True:
                # Continuously feed raw 16-bit PCM little-endian frames
                pcm_data = get_microphone_stream() 
                await session.send(input=pcm_data, end_of_turn=False)
                await asyncio.sleep(0.1)

        # Start receiving models speech audio
        async def recv_response():
            async for response in session.receive():
                server_content = response.server_content
                if server_content is not None:
                    model_turn = server_content.model_turn
                    if model_turn is not None:
                        for part in model_turn.parts:
                            # Play continuous 24kHz raw PCM back to speakers
                            play_audio_speakers(part.inline_data.data)

        # Drive parallel async streams
        await asyncio.gather(send_audio(), recv_response())

asyncio.run(main())`}
                      </pre>
                    </div>
                  )}

                  {activeCodeExplorerTab === 'js' && (
                    <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-sm overflow-x-auto text-left leading-relaxed">
                      <p className="text-zinc-600 text-[10px] mb-4">{"// Direct Node.js backend proxy connection targeting the Gemini Live API WebSocket endpoint."}</p>
                      <pre className="text-zinc-300">
{`import WebSocket from 'ws';

const apiKey = process.env.GEMINI_API_KEY;
const model = "gemini-2.0-flash-exp";
const host = "generativelanguage.googleapis.com";
const path = \`/ws/google.ai.generativelanguage.v1beta.InteractionsService\`;
const url = \`wss://\${host}\${path}?key=\${apiKey}\`;

console.log("Initiating backend Live API handshake to:", url);
const ws = new WebSocket(url, {
  headers: {
    'Api-Revision': '2026-05-20' // Stateful Interactions service specifier
  }
});

ws.on('open', () => {
  console.log("WebSocket open! Committing setup configuration frame...");
  
  // Inform Gemini about preferred voice model output
  const setupFrame = {
    setup: {
      model: model,
      generation_config: {
        response_modalities: ["AUDIO"],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: "Aoede" // Choose: Aoede, Charon, Fenrir, Kore, Puck
            }
          }
        }
      }
    }
  };
  ws.send(JSON.stringify(setupFrame));
});

ws.on('message', (data) => {
  const json = JSON.parse(data.toString());
  console.log("Received packet stream turn:", json);
  
  if (json.serverContent?.modelTurn?.parts) {
    for (const part of json.serverContent.modelTurn.parts) {
      if (part.inlineData) {
        // base64 biological voice in PCM format which can be piped to user speakers
        const voiceBase64 = part.inlineData.data;
        playAudioBuffer(Buffer.from(voiceBase64, 'base64'));
      }
    }
  }
});`}
                      </pre>
                    </div>
                  )}

                  {activeCodeExplorerTab === 'curl' && (
                    <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-sm overflow-x-auto text-left leading-relaxed">
                      <p className="text-zinc-600 text-[10px] mb-4">{"# Handshake endpoint syntax to verify token authentications or check connection headers via cURL."}</p>
                      <pre className="text-zinc-300">
{`curl -i -N \\
  -H "Upgrade: websocket" \\
  -H "Connection: Upgrade" \\
  -H "Sec-WebSocket-Key: SGVsbG8gd29ybGQ=" \\
  -H "Sec-WebSocket-Version: 13" \\
  -H "Api-Revision: 2026-05-20" \\
  "https://generativelanguage.googleapis.com/v1beta/interactions?key=\${GEMINI_API_KEY}"`}
                      </pre>
                    </div>
                  )}

                  {/* Absolute positioning of copy code button */}
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => {
                        let textToCopy = '';
                        if (activeCodeExplorerTab === 'python') {
                          textToCopy = `from google import genai\nclient = genai.Client()`;
                        } else if (activeCodeExplorerTab === 'js') {
                          textToCopy = `import WebSocket from 'ws';`;
                        } else {
                          textToCopy = `curl -i -N "https://generativelanguage.googleapis.com/...`;
                        }
                        copyToClipboard(textToCopy);
                        triggerToaster("Reference code blueprint copied successfully to clipboard!");
                      }}
                      className="p-2 border border-zinc-800 bg-zinc-950 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors rounded-sm cursor-pointer text-zinc-500"
                      title="Copy Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Enhanced MCP & Skills environment guides */}
              <div id="mcp-skills-section" className="bg-[#0A0A0A] border border-zinc-800 p-6 md:p-8 relative group/setup text-left mt-8 rounded-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover/setup:bg-[#FFCC00] transition-colors duration-500" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-5 mb-8 gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#FFCC00] uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-[#FFCC00]" />
                      <span>COGNITIVE EXTENSION PORTAL</span>
                    </div>
                    <h2 className="text-white font-display text-2xl uppercase tracking-tight mt-1">
                      Gemini Docs MCP & Development Skills
                    </h2>
                    <p className="text-zinc-500 text-xs font-mono max-w-2xl mt-1">
                      Coding assistants utilize training weights that occasionally lag behind the rapid evolution of the Gemini API. Keep environments current with real-time Model Context Protocol (MCP) docs and baked-in context rules.
                    </p>
                  </div>
                  <span className="font-mono text-[9px] px-2.5 py-1.5 rounded bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30 uppercase tracking-widest font-bold">
                    RECOMMENDED ENV SETUP
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left block (5 Columns): Connect Gemini Docs MCP */}
                  <div className="lg:col-span-5 bg-zinc-950/40 border border-zinc-900 p-5 rounded-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-900/60 mb-4">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-[#FFCC00]" />
                          <h4 className="font-mono text-xs uppercase tracking-wider text-white">1. Gemini Docs MCP Server</h4>
                        </div>
                        <span className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded uppercase font-bold">
                          ONLINE
                        </span>
                      </div>
                      
                      <p className="text-zinc-400 text-[11px] leading-relaxed mb-4">
                        Gemini hosts a public Model Context Protocol (MCP) server that provides your coding agent context from the absolute latest official Google documentation files.
                      </p>

                      <div className="space-y-2 mb-6">
                        <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Target Endpoint</span>
                        <div className="bg-zinc-950 border border-zinc-900/80 px-3 py-2 font-mono text-[10px] text-zinc-300 break-all select-all flex items-center justify-between rounded-sm">
                          <span>https://gemini-api-docs-mcp.dev</span>
                        </div>
                      </div>

                      {/* Command box with single-click copy */}
                      <div className="space-y-2">
                        <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Install Command</span>
                          <span className="text-[8px] text-[#FFCC00]">Click copy icon</span>
                        </span>
                        <div className="bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between rounded-sm">
                          <code className="font-mono text-[10px] text-[#FFCC00] select-all">{'npx add-mcp "https://gemini-api-docs-mcp.dev"'}</code>
                          <button
                            onClick={() => {
                              copyToClipboard('npx add-mcp "https://gemini-api-docs-mcp.dev"');
                              triggerToaster("Docs MCP setup command copied successfully to clipboard!");
                            }}
                            className="p-1.5 border border-zinc-800 bg-zinc-900 hover:border-[#FFCC00] hover:text-[#FFCC00] text-zinc-400 transition-all rounded-sm cursor-pointer"
                            title="Copy Command"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-5 border-t border-zinc-900/60 font-mono text-[9px] text-zinc-500 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Registers the <code className="text-zinc-300">search_documentation</code> tool.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Ensures zero stale or deprecated API recommendations.</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block (7 Columns): API Development Skills */}
                  <div className="lg:col-span-7 bg-zinc-950/40 border border-zinc-900 p-5 rounded-sm flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900/60 mb-5">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-[#FFCC00]" />
                          <h4 className="font-mono text-xs uppercase tracking-wider text-white">2. Inject Development Skills</h4>
                        </div>
                        
                        {/* Selector for installation tool */}
                        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-sm">
                          <button
                            onClick={() => {
                              setSkillsToolMode('skills_sh');
                              if (chatSoundEnabled) playSound('click');
                            }}
                            className={`px-2 py-1 font-mono text-[8px] uppercase transition-all cursor-pointer rounded-sm ${
                              skillsToolMode === 'skills_sh'
                                ? 'bg-[#FFCC00] text-black font-semibold'
                                : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                            }`}
                          >
                            skills.sh
                          </button>
                          <button
                            onClick={() => {
                              setSkillsToolMode('context7');
                              if (chatSoundEnabled) playSound('click');
                            }}
                            className={`px-2 py-1 font-mono text-[8px] uppercase transition-all cursor-pointer rounded-sm ${
                              skillsToolMode === 'context7'
                                ? 'bg-[#FFCC00] text-black font-semibold'
                                : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                            }`}
                          >
                            Context7
                          </button>
                        </div>
                      </div>

                      {/* Skill selector tabs */}
                      <div className="grid grid-cols-3 gap-1 px-1 py-1 bg-zinc-950 border border-zinc-900 rounded-sm mb-4">
                        <button
                          onClick={() => {
                            setSkillsSelectTab('gemini_api_dev');
                            if (chatSoundEnabled) playSound('click');
                          }}
                          className={`py-2 px-1 font-mono text-[9px] uppercase tracking-wider text-center transition-all cursor-pointer rounded-sm ${
                            skillsSelectTab === 'gemini_api_dev'
                              ? 'bg-zinc-800 border-zinc-700 text-[#FFCC00]'
                              : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                          }`}
                        >
                          gemini-api
                        </button>
                        <button
                          onClick={() => {
                            setSkillsSelectTab('gemini_live_api_dev');
                            if (chatSoundEnabled) playSound('click');
                          }}
                          className={`py-2 px-1 font-mono text-[9px] uppercase tracking-wider text-center transition-all cursor-pointer rounded-sm ${
                            skillsSelectTab === 'gemini_live_api_dev'
                              ? 'bg-zinc-800 border-zinc-700 text-[#FFCC00]'
                              : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                          }`}
                        >
                          gemini-live-api
                        </button>
                        <button
                          onClick={() => {
                            setSkillsSelectTab('gemini_interactions_api');
                            if (chatSoundEnabled) playSound('click');
                          }}
                          className={`py-2 px-1 font-mono text-[9px] uppercase tracking-wider text-center transition-all cursor-pointer rounded-sm ${
                            skillsSelectTab === 'gemini_interactions_api'
                              ? 'bg-zinc-800 border-zinc-700 text-[#FFCC00]'
                              : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                          }`}
                        >
                          interactions-api
                        </button>
                      </div>

                      {/* Skill descriptive insights */}
                      <div className="min-h-[95px] mb-5">
                        {skillsSelectTab === 'gemini_api_dev' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-sans text-[11px] font-semibold text-zinc-200">API Development Core Skill</span>
                              <span className="font-mono text-[8px] px-1 bg-zinc-900 border border-zinc-800 text-zinc-500 uppercase rounded">V1.5.0</span>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                              Baked-in rules and system instructions direct coding assistants toward the optimal routing of model tiers (Gemini 2.5 Flash), enforcing accurate function calling syntaxes and avoidance of deprecated models.
                            </p>
                          </div>
                        )}
                        {skillsSelectTab === 'gemini_live_api_dev' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-sans text-[11px] font-semibold text-zinc-200">Real-time Live API Skill</span>
                              <span className="font-mono text-[8px] px-1 bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase rounded font-bold">STABLE SPEC</span>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                              Establishes strict constraints for stateful multi-modal socket connections. Handles little-endian raw 16-bit PCM inputs, 24kHz audio playbacks, dynamic voice activity detection configuration (VAD), and low-latency client barge-in.
                            </p>
                          </div>
                        )}
                        {skillsSelectTab === 'gemini_interactions_api' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-sans text-[11px] font-semibold text-zinc-200">Interactions & Agents API Skill</span>
                              <span className="font-mono text-[8px] px-1 bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase rounded">AGENT CORE</span>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                              Structures direct calls for Gemini-integrated agent networks, custom backgrounds, deep research hooks, conversational state buffers, and server-side model turn executions using standard Google TS/Python library implementations.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Command generator based on settings */}
                      <div className="space-y-2">
                        <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Skills Install Execution</span>
                          <span className="text-[8px] text-[#FFCC00]">Copy to terminal</span>
                        </span>
                        <div className="bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between rounded-sm">
                          <code className="font-mono text-[10px] text-[#FFCC00] select-all">
                            {skillsToolMode === 'skills_sh' 
                              ? `npx skills add google-gemini/gemini-skills --skill ${skillsSelectTab} --global`
                              : `npx ctx7 skills install /google-gemini/gemini-skills ${skillsSelectTab}`
                            }
                          </code>
                          <button
                            onClick={() => {
                              const cmd = skillsToolMode === 'skills_sh'
                                ? `npx skills add google-gemini/gemini-skills --skill ${skillsSelectTab} --global`
                                : `npx ctx7 skills install /google-gemini/gemini-skills ${skillsSelectTab}`;
                              copyToClipboard(cmd);
                              triggerToaster(`Skill installation execution copied: ${skillsSelectTab}`);
                            }}
                            className="p-1.5 border border-zinc-800 bg-zinc-900 hover:border-[#FFCC00] hover:text-[#FFCC00] text-zinc-400 transition-all rounded-sm cursor-pointer"
                            title="Copy Command"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                    </div>

                    <div className="pt-5 mt-5 border-t border-zinc-900/60 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-zinc-600">SOURCE: GITHUB.COM/GOOGLE-GEMINI/GEMINI-SKILLS</span>
                      <a 
                        href="https://github.com/google-gemini/gemini-skills"
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 transition-colors bg-transparent border-none decoration-none"
                      >
                        Source Repo
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Verification Sandbox - Terminal simulation loop */}
                <div className="mt-8 bg-zinc-950 border border-zinc-900 p-5 rounded-sm">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="text-[#FFCC00] w-4 h-4" />
                      <span className="uppercase text-white tracking-widest text-[11px]">Interactive Verification CLI</span>
                    </div>
                    <span className="text-zinc-600 text-[9px]">SIMULATOR ACTIVE</span>
                  </div>

                  <p className="text-zinc-500 text-[10px] font-mono leading-relaxed mb-4">
                    Confirm that your coding assistant connects to the Gemini Docs MCP server and utilizes the newly installed skills properly by launching simulation verification queries:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => {
                        if (chatSoundEnabled) playSound('message');
                        // Add packet sequence to simulator logs
                        setLiveTerminalLogs(prev => [
                          { time: new Date().toLocaleTimeString(), direction: 'client', type: 'CLI_EXEC', message: 'exec: /mcp' },
                          { time: new Date().toLocaleTimeString(), direction: 'server', type: 'MCP_RESP', message: 'Connected servers: [https://gemini-api-docs-mcp.dev]. Active tools: [search_documentation]' },
                          ...prev
                        ]);
                        triggerToaster("CLI command '/mcp' processed. Scanned live server connections.");
                      }}
                      className="p-3 border border-zinc-800 bg-zinc-900 hover:border-[#FFCC00]/50 text-left cursor-pointer transition-colors hover:bg-zinc-900/50 rounded-sm"
                    >
                      <span className="block font-mono text-[9px] text-[#FFCC00] font-bold tracking-wider uppercase mb-1">Verify Docs MCP</span>
                      <code className="text-zinc-300 font-mono text-[10px]">$ /mcp</code>
                      <span className="block text-[9px] text-zinc-500 mt-1">Queries connections & active tools list.</span>
                    </button>

                    <button
                      onClick={() => {
                        if (chatSoundEnabled) playSound('message');
                        // Add packet sequence to simulator logs
                        setLiveTerminalLogs(prev => [
                          { time: new Date().toLocaleTimeString(), direction: 'client', type: 'CLI_EXEC', message: 'exec: /skills status' },
                          { time: new Date().toLocaleTimeString(), direction: 'server', type: 'SKILLS_RESP', message: `Manifest OK. Registered behaviors: [${skillsSelectTab}]` },
                          ...prev
                        ]);
                        triggerToaster(`CLI skills list processed. Located ${skillsSelectTab} in system memory.`);
                      }}
                      className="p-3 border border-zinc-800 bg-zinc-900 hover:border-[#FFCC00]/50 text-left cursor-pointer transition-colors hover:bg-zinc-900/50 rounded-sm"
                    >
                      <span className="block font-mono text-[9px] text-[#FFCC00] font-bold tracking-wider uppercase mb-1">Verify Active Skills</span>
                      <code className="text-zinc-300 font-mono text-[10px]">$ /skills list</code>
                      <span className="block text-[9px] text-zinc-500 mt-1">Loads registered active behavioral rules.</span>
                    </button>

                    <button
                      onClick={() => {
                        if (chatSoundEnabled) playSound('message');
                        // Add packet sequence to simulator logs
                        setLiveTerminalLogs(prev => [
                          { time: new Date().toLocaleTimeString(), direction: 'client', type: 'CLI_QUERY', message: 'Ask Agent: How to use context caching?' },
                          { time: new Date().toLocaleTimeString(), direction: 'server', type: 'SDK_CODE', message: 'Using skill: gemini-api-dev response: "cache = client.caches.create(model=\'gemini-2.5-flash\', config=types.CreateCachedContentConfig(...))"' },
                          ...prev
                        ]);
                        triggerToaster("Cognitive caching prompt executed. Checked cache code response.");
                      }}
                      className="p-3 border border-zinc-800 bg-zinc-900 hover:border-[#FFCC00]/50 text-left cursor-pointer transition-colors hover:bg-zinc-900/50 rounded-sm"
                    >
                      <span className="block font-mono text-[9px] text-[#FFCC00] font-bold tracking-wider uppercase mb-1">Verify Prompts Grounding</span>
                      <code className="text-zinc-300 font-mono text-[10px]">$ context caching test</code>
                      <span className="block text-[9px] text-zinc-500 mt-1">Evaluates agent cache coding accuracy output.</span>
                    </button>
                  </div>

                  <p className="text-[10px] font-mono text-zinc-500 text-right uppercase">
                    Tips: Click any CLI card above to feed outputs in real-time into the <span className="text-[#FFCC00]">WebSocket Packet Stream</span>!
                  </p>
                </div>
              </div>

            </motion.div>
         )}

         {activeTab === 'tools' && (
           <motion.div
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="space-y-10"
           >
             {/* Built-in & Custom Tools Overview Card */}
             <div id="tools-top-banner" className="bg-zinc-950 border border-indigo-500/30 p-8 shadow-lg shadow-indigo-500/10 rounded-2xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-900/60 mb-6">
                 <div>
                   <div className="flex items-center gap-2 font-mono text-xs text-[#FFCC00] uppercase tracking-widest">
                     <Sliders className="w-4 h-4 text-[#FFCC00]" />
                     <span>GEMINI BUILT-IN & CUSTOM TOOLS</span>
                   </div>
                   <h1 className="text-white font-display text-4xl uppercase tracking-tight mt-1">
                     Multi-Agent Grounding & Handshakes
                   </h1>
                   <p className="text-zinc-500 text-xs font-mono max-w-3xl mt-1">
                     Models achieve autonomy by calling fully-managed helpers (Search, Maps, Code Sandbox, URLs) or client-defined custom functions. Experience the exact handshake sequence of the modern Gemini API.
                   </p>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="font-mono text-[9px] px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest rounded-sm font-semibold">
                     COMPATIBLE: GEMINI 2.5 & 3.0
                   </span>
                 </div>
               </div>

               {/* Interactive Preset Cards Row */}
               <div>
                 <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-3">CONVERSATIONAL SCENARIOS (SELECT TO INITIALIZE)</span>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   <button
                     onClick={() => handleSelectToolsPreset('calc')}
                     className={`p-4 border text-left cursor-pointer transition-all relative ${
                       toolsActivePreset === 'calc'
                         ? 'bg-zinc-950 border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.08)]'
                         : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/85'
                     } rounded-sm`}
                   >
                     {toolsActivePreset === 'calc' && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#FFCC00] m-2 rounded-full animate-pulse" />}
                     <div className="flex items-center gap-2 mb-1.5">
                       <CodeXml className={`w-4 h-4 ${toolsActivePreset === 'calc' ? 'text-[#FFCC00]' : 'text-zinc-500'}`} />
                       <span className="font-sans text-xs font-bold text-white uppercase">Math & Stock Sand</span>
                     </div>
                     <p className="text-zinc-400 text-[10px] leading-relaxed">
                       Runs a Python compiler in a cloud sandbox using live NASDAQ feeds.
                     </p>
                     <span className="inline-block mt-2 font-mono text-[8px] bg-zinc-900 text-zinc-500 px-1 py-0.5 uppercase rounded">
                       Search + Code Exec
                     </span>
                   </button>

                   <button
                     onClick={() => handleSelectToolsPreset('place')}
                     className={`p-4 border text-left cursor-pointer transition-all relative ${
                       toolsActivePreset === 'place'
                         ? 'bg-zinc-950 border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.08)]'
                         : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/85'
                     } rounded-sm`}
                   >
                     {toolsActivePreset === 'place' && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#FFCC00] m-2 rounded-full animate-pulse" />}
                     <div className="flex items-center gap-2 mb-1.5">
                       <MapPin className={`w-4 h-4 ${toolsActivePreset === 'place' ? 'text-[#FFCC00]' : 'text-zinc-500'}`} />
                       <span className="font-sans text-xs font-bold text-white uppercase">Google Maps Tracker</span>
                     </div>
                     <p className="text-zinc-400 text-[10px] leading-relaxed">
                       Finds coordinates, rating curves, and stores active location pins.
                     </p>
                     <span className="inline-block mt-2 font-mono text-[8px] bg-zinc-900 text-zinc-500 px-1 py-0.5 uppercase rounded">
                       Maps Grounding
                     </span>
                   </button>

                   <button
                     onClick={() => handleSelectToolsPreset('search_flight')}
                     className={`p-4 border text-left cursor-pointer transition-all relative ${
                       toolsActivePreset === 'search_flight'
                         ? 'bg-zinc-950 border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.08)]'
                         : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/85'
                     } rounded-sm`}
                   >
                     {toolsActivePreset === 'search_flight' && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#FFCC00] m-2 rounded-full animate-pulse" />}
                     <div className="flex items-center gap-2 mb-1.5">
                       <Globe className={`w-4 h-4 ${toolsActivePreset === 'search_flight' ? 'text-[#FFCC00]' : 'text-zinc-500'}`} />
                       <span className="font-sans text-xs font-bold text-white uppercase">Deep Web Crawler</span>
                     </div>
                     <p className="text-zinc-400 text-[10px] leading-relaxed">
                       Resolves live flight tables across real-time ticketing platforms.
                     </p>
                     <span className="inline-block mt-2 font-mono text-[8px] bg-zinc-900 text-zinc-500 px-1 py-0.5 uppercase rounded">
                       Search + URL Context
                     </span>
                   </button>

                   <button
                     onClick={() => handleSelectToolsPreset('custom_fn')}
                     className={`p-4 border text-left cursor-pointer transition-all relative ${
                       toolsActivePreset === 'custom_fn'
                         ? 'bg-zinc-950 border-[#FFCC00] shadow-[0_0_15px_rgba(255,204,0,0.08)]'
                         : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/85'
                     } rounded-sm`}
                   >
                     {toolsActivePreset === 'custom_fn' && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#FFCC00] m-2 rounded-full animate-pulse" />}
                     <div className="flex items-center gap-2 mb-1.5">
                       <Server className={`w-4 h-4 ${toolsActivePreset === 'custom_fn' ? 'text-[#FFCC00]' : 'text-zinc-500'}`} />
                       <span className="font-sans text-xs font-bold text-white uppercase">Private SQL Endpoint</span>
                     </div>
                     <p className="text-zinc-400 text-[10px] leading-relaxed">
                       Yields control to client to run custom Postgres/Drizzle selectors.
                     </p>
                     <span className="inline-block mt-2 font-mono text-[8px] bg-zinc-900 text-zinc-500 px-1 py-0.5 uppercase rounded">
                       Function Calling
                     </span>
                   </button>
                 </div>
               </div>
             </div>

             {/* Interactive Configuration Map Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
               {/* Left Block (5 columns): Active Pipeline Controllers */}
               <div className="lg:col-span-5 bg-[#0A0A0A] border border-zinc-800 p-6 rounded-sm">
                 <div className="pb-4 border-b border-zinc-900 mb-5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Sliders className="w-4 h-4 text-[#FFCC00]" />
                     <h3 className="font-mono text-xs uppercase tracking-wider text-white">Pipeline Parameters</h3>
                   </div>
                   <span className="font-mono text-[9px] text-[#FFCC00] uppercase font-bold">CLIENT CONTROL</span>
                 </div>

                 {/* Engines */}
                 <div className="space-y-2 mb-5">
                   <label className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Selected AI Agent Model</label>
                   <select 
                     disabled
                     className="w-full bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs text-zinc-300 outline-none rounded-sm"
                   >
                     <option>gemini-2.5-flash (Standard)</option>
                     <option>gemini-3.0-pro (Advanced Reasoning)</option>
                   </select>
                 </div>

                 {/* Available Tools Checklist */}
                 <div className="space-y-3 mb-6">
                   <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Enabled Active Tools</span>
                   <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-sm space-y-2.5 font-mono text-[10px]">
                     <div className="flex items-center justify-between py-1 border-b border-zinc-900/55">
                       <span className={toolsEnabledList.includes('search') ? 'text-zinc-200' : 'text-zinc-600'}>🌐 Google Search Grounding</span>
                       <span className={`text-[8px] px-1 py-0.5 rounded ${toolsEnabledList.includes('search') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                         {toolsEnabledList.includes('search') ? 'ACTIVE' : 'OFF'}
                       </span>
                     </div>
                     <div className="flex items-center justify-between py-1 border-b border-zinc-900/55">
                       <span className={toolsEnabledList.includes('code_exec') ? 'text-zinc-200' : 'text-zinc-600'}>🐍 Python Code Execution</span>
                       <span className={`text-[8px] px-1 py-0.5 rounded ${toolsEnabledList.includes('code_exec') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                         {toolsEnabledList.includes('code_exec') ? 'ACTIVE' : 'OFF'}
                       </span>
                     </div>
                     <div className="flex items-center justify-between py-1 border-b border-zinc-900/55">
                       <span className={toolsEnabledList.includes('google_maps') ? 'text-zinc-200' : 'text-zinc-600'}>📍 Google Maps Platform</span>
                       <span className={`text-[8px] px-1 py-0.5 rounded ${toolsEnabledList.includes('google_maps') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                         {toolsEnabledList.includes('google_maps') ? 'ACTIVE' : 'OFF'}
                       </span>
                     </div>
                     <div className="flex items-center justify-between py-1 border-b border-zinc-900/55">
                       <span className={toolsEnabledList.includes('url_context') ? 'text-zinc-200' : 'text-zinc-600'}>📑 URL Document Context</span>
                       <span className={`text-[8px] px-1 py-0.5 rounded ${toolsEnabledList.includes('url_context') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                         {toolsEnabledList.includes('url_context') ? 'ACTIVE' : 'OFF'}
                       </span>
                     </div>
                     <div className="flex items-center justify-between py-1">
                       <span className={toolsEnabledList.includes('custom_func') ? 'text-zinc-200' : 'text-zinc-600'}>⚙️ Client-Side Custom Handshake</span>
                       <span className={`text-[8px] px-1 py-0.5 rounded ${toolsEnabledList.includes('custom_func') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                         {toolsEnabledList.includes('custom_func') ? 'ACTIVE' : 'OFF'}
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Query Input Box */}
                 <div className="space-y-2 mb-6">
                   <label className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                     <span>Prompt / Question</span>
                     <span className="text-zinc-600">Max 250 chars</span>
                   </label>
                   <textarea
                     className="w-full h-24 bg-zinc-950 border border-zinc-800 p-3.5 font-sans text-xs text-zinc-200 outline-none focus:border-[#FFCC00] transition-colors rounded-sm leading-relaxed"
                     value={toolsInputQuery}
                     onChange={(e) => setToolsInputQuery(e.target.value)}
                     maxLength={250}
                   />
                 </div>

                 {/* Execute Button */}
                 <button
                   onClick={handleSimulateToolsExecution}
                   disabled={toolsStatus === 'running'}
                   className={`w-full py-4 px-6 font-mono text-xs uppercase tracking-widest select-none cursor-pointer transition-all flex items-center justify-center gap-2.5 ${
                     toolsStatus === 'running'
                       ? 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                       : 'bg-[#FFCC00] hover:bg-[#E6B800] text-black font-bold shadow-[0_0_20px_rgba(255,204,0,0.15)]'
                   } rounded-sm`}
                 >
                   {toolsStatus === 'running' ? (
                     <>
                       <Loader2 className="w-4 h-4 animate-spin text-[#FFCC00]" />
                       <span>Circulating Tool States...</span>
                     </>
                   ) : (
                     <>
                       <Play className="w-4 h-4 fill-current" />
                       <span>Run Active Tools Pipeline</span>
                     </>
                   )}
                 </button>
               </div>

               {/* Right Block (7 columns): Pipeline Log Trace Handshake */}
               <div className="lg:col-span-7 bg-[#0A0A0A] border border-zinc-800 p-6 rounded-sm min-h-[460px] flex flex-col justify-between">
                 <div>
                   <div className="pb-4 border-b border-zinc-900 mb-5 flex items-center justify-between font-mono text-xs">
                     <div className="flex items-center gap-2">
                       <Terminal className="w-4 h-4 text-[#FFCC00]" />
                       <span className="text-white uppercase tracking-wider">Live Pipeline Logs & Decrypted Thoughts</span>
                     </div>
                     <span className="text-zinc-600">EXEC_TRACE_0x9A</span>
                   </div>

                   {/* Trace Steps container */}
                   <div className="space-y-4 mb-6">
                     {toolsStepLogs.length === 0 ? (
                       <div className="text-center py-12 border border-zinc-900/60 bg-zinc-950/30 rounded-sm">
                         <HelpCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                         <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">No Active Pipeline Execution</p>
                         <p className="text-zinc-600 text-xs mt-1 max-w-sm mx-auto">
                           Press the &apos;Run Active Tools Pipeline&apos; command button to feed the user query into the stateful loop.
                         </p>
                       </div>
                     ) : (
                       <div className="space-y-3.5">
                         {toolsStepLogs.map((log, idx) => (
                           <div key={idx} className="bg-zinc-950/90 border border-zinc-900 p-4 relative overflow-hidden rounded-sm">
                             <div className="flex items-center justify-between border-b border-zinc-900/50 pb-2 mb-2">
                               <div className="flex items-center gap-2 font-mono text-[10px]">
                                 <span className="text-zinc-500 uppercase">STEP_0{idx + 1} {"//"}</span>
                                 <h5 className="font-bold text-zinc-300 uppercase">{log.title}</h5>
                               </div>
                               <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded ${
                                 log.status === 'success' 
                                   ? 'bg-emerald-500/15 text-emerald-400' 
                                   : 'bg-[#FFCC00]/15 text-[#FFCC00] animate-pulse'
                               }`}>
                                 {log.status === 'success' ? 'COMPLETED' : 'PROCESSING'}
                               </span>
                             </div>
                             <p className="text-zinc-400 text-xs leading-relaxed">{log.desc}</p>
                             
                             {/* Optional Structured payload view */}
                             {log.detail && (
                               <div className="mt-3 bg-zinc-900 p-2.5 border border-zinc-900 rounded-sm font-mono text-[9px] text-zinc-500 overflow-x-auto">
                                 <span className="block text-[#FFCC00]/70 font-semibold mb-1">Encrypted Payload Signature:</span>
                                 <pre className="text-zinc-300 select-all leading-normal">{log.detail}</pre>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Aggregated Output Panel */}
                 <div className="border-t border-zinc-900 pt-5 mt-4">
                   <span className="block font-mono text-[9px] text-[#FFCC00] uppercase tracking-widest mb-2.5">AGGREGATED COGNITIVE FINAL RESPONSE</span>
                   <div className="bg-zinc-950 p-4 border border-zinc-900 min-h-[90px] flex items-center justify-start rounded-sm">
                     {toolsStatus === 'running' && !toolsFinalResponse ? (
                       <div className="flex items-center gap-3 text-zinc-500 text-xs font-mono">
                         <Loader2 className="w-4 h-4 animate-spin text-[#FFCC00]" />
                         <span>Compiling groundings and writing responses. Please wait...</span>
                       </div>
                     ) : toolsFinalResponse ? (
                       <div className="text-zinc-300 font-sans text-xs leading-relaxed text-left w-full">
                         {renderMarkdown(
                            toolsFinalResponse,
                            (code) => {
                              navigator.clipboard.writeText(code);
                              if (chatSoundEnabled) playSound('click');
                              triggerToaster("Copied code block successfully");
                            },
                            (code) => {
                              setPrompt(code);
                              if (chatSoundEnabled) playSound('click');
                              triggerToaster("Promoted code block to image sandbox prompt");
                            }
                          )}
                       </div>
                     ) : (
                       <span className="text-zinc-600 font-mono text-[10px] uppercase">Awaiting pipeline output...</span>
                     )}
                   </div>
                 </div>
               </div>
             </div>

             {/* Code Grounding SDK Spec panel */}
             <div className="bg-[#0A0A5A]/5 border border-zinc-800 p-6 rounded-sm text-left relative group/code">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 group-hover/code:bg-[#FFCC00] transition-colors duration-500" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-905 mb-6">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#FFCC00] uppercase tracking-widest">
                      <CodeXml className="w-4 h-4" />
                      <span>DEVELOPER DEPLOYMENT BLUEPRINTS</span>
                    </div>
                    <span className="block text-zinc-400 font-display text-lg uppercase mt-0.5 font-bold">Integration SDK Context and Syntax</span>
                  </div>

                  {/* Code selector tabs */}
                  <div className="flex gap-1 bg-zinc-950 border border-zinc-900 p-0.5 rounded-sm self-start">
                    <button
                      onClick={() => {
                        setToolsActiveCodeTab('python');
                        if (chatSoundEnabled) playSound('click');
                      }}
                      className={`px-3 py-1.5 font-mono text-[9px] uppercase transition-all cursor-pointer rounded-sm ${
                        toolsActiveCodeTab === 'python'
                          ? 'bg-zinc-850 text-[#FFCC00] font-semibold'
                          : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                      }`}
                    >
                      Python SDK
                    </button>
                    <button
                      onClick={() => {
                        setToolsActiveCodeTab('js');
                        if (chatSoundEnabled) playSound('click');
                      }}
                      className={`px-3 py-1.5 font-mono text-[9px] uppercase transition-all cursor-pointer rounded-sm ${
                        toolsActiveCodeTab === 'js'
                          ? 'bg-zinc-850 text-[#FFCC00] font-semibold'
                          : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                      }`}
                    >
                      NodeJS Client
                    </button>
                    <button
                      onClick={() => {
                        setToolsActiveCodeTab('curl');
                        if (chatSoundEnabled) playSound('click');
                      }}
                      className={`px-3 py-1.5 font-mono text-[9px] uppercase transition-all cursor-pointer rounded-sm ${
                        toolsActiveCodeTab === 'curl'
                          ? 'bg-zinc-850 text-[#FFCC00] font-semibold'
                          : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-none'
                      }`}
                    >
                      cURL REST
                    </button>
                  </div>
                </div>

                <div className="relative font-mono text-xs select-text">
                  {toolsActiveCodeTab === 'python' && (
                    <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-sm overflow-x-auto text-left leading-relaxed">
                      <p className="text-zinc-600 text-[10px] mb-4">{"# Multi-tool pipeline registration for python async client loops targeting standard Gemini 3 engine nodes."}</p>
                      <pre className="text-zinc-300">
{`from google import genai
from google.genai import types

# Initialize with lazy credentials binding
client = genai.Client()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='${toolsInputQuery}',
    config=types.GenerateContentConfig(
        # Inject standard Google Search Grounding and Sandbox Code Execution pipelines
        tools=[
            types.Tool(google_search=types.GoogleSearch()),
            types.Tool(code_execution=types.CodeExecution()),
            types.Tool(
                function_declarations=[
                    types.FunctionDeclaration(
                        name='get_order_status',
                        description='Get current status of a user purchase order',
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                'order_id': types.Schema(
                                    type=types.Type.STRING,
                                    description='alphanumeric order ID'
                                )
                            },
                            required=['order_id']
                        )
                    )
                ]
            )
        ]
    )
)

print(response.text)`}
                      </pre>
                    </div>
                  )}

                  {toolsActiveCodeTab === 'js' && (
                    <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-sm overflow-x-auto text-left leading-relaxed">
                      <p className="text-zinc-600 text-[10px] mb-4">{"// Server-side integration targeting high-performance async await threads using the standard @google/genai module."}</p>
                      <pre className="text-zinc-300">
{`import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: '${toolsInputQuery}',
  config: {
    // Both built-in and client-side custom schema tool maps are loaded dynamically
    tools: [
      { googleSearch: {} },
      { codeExecution: {} },
      { googleMaps: {} },
      {
        functionDeclarations: [{
          name: 'get_order_status',
          description: 'Get details of user order fulfillment status',
          parameters: {
            type: Type.OBJECT,
            properties: {
              order_id: { type: Type.STRING, description: 'order string lookup ID' }
            },
            required: ['order_id']
          }
        }]
      }
    ]
  }
});

console.log(response.text);`}
                      </pre>
                    </div>
                  )}

                  {toolsActiveCodeTab === 'curl' && (
                    <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-sm overflow-x-auto text-left leading-relaxed">
                      <p className="text-zinc-600 text-[10px] mb-4">{"# Direct REST POST payload mapping both built-in features and custom API schema bindings."}</p>
                      <pre className="text-zinc-300">
{`curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${GEMINI_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{"parts": [{"text": "${toolsInputQuery}"}]}],
    "tools": [
      { "google_search": {} },
      { "code_execution": {} },
      {
        "function_declarations": [{
          "name": "get_order_status",
          "description": "Fulfillment status lookup",
          "parameters": {
            "type": "OBJECT",
            "properties": {
              "order_id": { "type": "STRING" }
            },
            "required": ["order_id"]
          }
        }]
      }
    ]
  }'`}
                      </pre>
                    </div>
                  )}
                </div>
             </div>
           </motion.div>
         )}
      </div>

      {/* Start of Floating Sparkle Toaster Banner */}
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
