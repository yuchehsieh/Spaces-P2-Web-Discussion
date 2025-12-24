import React, { useState, useMemo } from 'react';
import { 
  Search, 
  History, 
  Plus, 
  MessageSquare, 
  Play, 
  Download, 
  X, 
  Clock, 
  Video, 
  Tag, 
  BrainCircuit,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface VLMResult {
  id: string;
  thumbnail: string;
  title: string;
  timestamp: string;
  confidence: number;
  aiDescription: string;
  camera: string;
  objects: string[];
}

const MOCK_RESULTS: VLMResult[] = [
  {
    id: 'v-1',
    thumbnail: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_1.jpg?raw=true',
    title: 'Blue truck backing into the dock.',
    timestamp: '2023-10-27 15:45:30',
    confidence: 97,
    aiDescription: 'Blue truck backing into the dock.',
    camera: 'Loading Dock',
    objects: ['truck', 'vehicle', 'loading']
  },
  {
    id: 'v-2',
    thumbnail: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_2.jpg?raw=true',
    title: 'Person in red jacket crossing perimeter.',
    timestamp: '2023-10-27 14:12:05',
    confidence: 92,
    aiDescription: 'Detected a single person wearing a bright red jacket entering the restricted zone from the north entrance.',
    camera: 'Main Gate',
    objects: ['person', 'clothing:red', 'restricted_area']
  }
];

const SUGGESTIONS = [
  "DELIVERY TRUCK ARRIVING",
  "PERSON IN RED JACKET",
  "FORKLIFT MOVEMENT IN WAREHOUSE",
  "UNAUTHORIZED ENTRY"
];

const VLMTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [results, setResults] = useState<VLMResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<VLMResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (term: string = searchTerm) => {
    if (!term.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden relative">
      
      {/* VLM Specific Sidebar - Collapsible */}
      <div className={`transition-all duration-300 border-r border-slate-800 bg-[#0b1121]/50 flex flex-col shrink-0 ${isHistoryOpen ? 'w-60' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <History size={14} className="text-blue-500" />
              Recent Searches
           </h3>
           <button onClick={() => setIsHistoryOpen(false)} className="text-slate-600 hover:text-white transition-colors">
              <PanelLeftClose size={16} />
           </button>
        </div>
        
        <div className="p-4">
           <button onClick={() => {setResults([]); setSearchTerm('');}} className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 transition-all">
              <Plus size={14} /> New Search
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
           {results.length > 0 ? (
             <button className="w-full text-left px-3 py-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300 font-bold truncate flex items-center gap-3">
                <MessageSquare size={14} className="shrink-0" />
                {searchTerm}
             </button>
           ) : (
             <div className="mt-8 flex flex-col items-center justify-center opacity-20 py-10 text-center px-4">
                <BrainCircuit size={32} />
                <span className="text-[10px] mt-4 font-bold uppercase tracking-widest leading-relaxed">No search history yet</span>
             </div>
           )}
        </div>
      </div>

      {/* Main Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
           
           {/* Initial State UI (Logo + Big Search Bar) */}
           {results.length === 0 && !isSearching && (
             <>
               {!isHistoryOpen && (
                  <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className="absolute top-6 left-6 z-20 p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-all animate-in fade-in shadow-xl"
                  >
                     <PanelLeftOpen size={18} />
                  </button>
                )}
               <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in zoom-in duration-500 -mt-10">
                  <div className="flex items-center gap-4 mb-6">
                     <img 
                      src="https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/LOGO_SKS_NEW2.png?raw=true" 
                      alt="SKS" 
                      className="h-14 w-auto"
                     />
                     <h1 className="text-5xl font-black text-white italic tracking-tighter flex items-center">
                       <span className="text-blue-500 ml-1">AI</span>
                     </h1>
                  </div>
                  <h2 className="text-[10px] font-black text-slate-600 tracking-[0.4em] uppercase mb-8">Advanced Vision Intelligence</h2>
                  
                  <p className="text-sm text-slate-500 font-medium italic mb-10 text-center max-w-md leading-relaxed">
                    Search your distributed camera network using natural language.
                  </p>

                  <div className="w-full relative group mb-8">
                     <div className="absolute inset-0 bg-blue-600/5 blur-[40px] rounded-full transition-opacity group-focus-within:opacity-100 opacity-0"></div>
                     <input 
                      type="text" 
                      placeholder="Ask SKS AI to find events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full bg-[#111827] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-base font-bold text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-slate-800 relative z-10"
                     />
                     <Search size={20} className="absolute left-4 top-4 text-slate-700 group-focus-within:text-blue-500 transition-colors z-10" />
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                     {SUGGESTIONS.map(s => (
                       <button 
                        key={s} 
                        onClick={() => { setSearchTerm(s); handleSearch(s); }}
                        className="px-4 py-2 bg-[#111827] border border-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 transition-all"
                       >
                          {s}
                       </button>
                     ))}
                  </div>
               </div>
             </>
           )}

           {/* Searching State */}
           {isSearching && (
             <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                <div className="relative w-16 h-16 mb-6">
                   <div className="absolute inset-0 border-2 border-blue-600/10 rounded-full"></div>
                   <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                      <BrainCircuit size={24} className="animate-pulse" />
                   </div>
                </div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">SKS AI is analyzing network...</span>
             </div>
           )}

           {/* Results State (Modified Header to prevent overlap) */}
           {results.length > 0 && !isSearching && (
             <div className="w-full h-full flex flex-col pt-6 animate-in fade-in duration-300">
                {/* Result Header Row - Contains Toggle and Search Bar Together */}
                <div className="flex items-center gap-4 mb-10 shrink-0">
                   {!isHistoryOpen && (
                      <button 
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all shadow-lg flex-shrink-0"
                      >
                         <PanelLeftOpen size={18} />
                      </button>
                   )}
                   <div className="relative flex-1 max-w-lg">
                      <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                      <Search size={16} className="absolute left-3.5 top-3 text-slate-600" />
                   </div>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-2">Found {results.length} matches</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {results.map(res => (
                        <div 
                         key={res.id} onClick={() => setSelectedResult(res)}
                         className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-blue-500/40 transition-all shadow-2xl"
                        >
                           <div className="relative aspect-video overflow-hidden bg-black">
                              <img src={res.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" />
                              <div className="absolute top-4 right-4">
                                 <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-md shadow-lg border border-blue-400/30">
                                    {res.confidence}% Match
                                 </div>
                              </div>
                              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] font-mono font-bold text-white bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5">
                                 <Clock size={10}/> {res.timestamp}
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                                    <Play size={24} className="text-white ml-1" />
                                 </div>
                              </div>
                           </div>
                           <div className="p-8">
                              <h4 className="text-xl font-black text-white tracking-tight mb-3 group-hover:text-blue-400 transition-colors leading-tight">{res.title}</h4>
                              <div className="flex items-center gap-2">
                                <Video size={14} className="text-slate-600" />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Source: {res.camera}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Detail Modal Overlay */}
      {selectedResult && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="relative max-w-6xl w-full bg-[#0b1121] border border-slate-800 rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,0.9)] overflow-hidden flex h-[75vh] ring-1 ring-white/5">
              
              <div className="flex-1 bg-black relative flex items-center justify-center group overflow-hidden">
                  <img src={selectedResult.thumbnail} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute top-8 left-8 z-10">
                     <div className="bg-red-600 text-white px-5 py-2 rounded-xl text-[12px] font-black tracking-widest flex items-center gap-3 shadow-2xl uppercase">
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                        Playback: {selectedResult.camera}
                     </div>
                  </div>
                  <Play size={100} className="text-white/20 group-hover:text-white/40 cursor-pointer transition-all drop-shadow-2xl" />
                  <div className="absolute bottom-8 left-8 right-8 flex items-center gap-6 px-6 py-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                         <div className="absolute top-0 left-0 h-full bg-blue-600 w-1/3 shadow-[0_0_20px_rgba(37,99,235,0.8)]"></div>
                      </div>
                      <span className="text-[11px] font-mono font-black text-white/60">00:04 / 00:15</span>
                  </div>
              </div>

              <div className="w-96 bg-[#0b1121] border-l border-slate-800 p-10 flex flex-col">
                  <div className="flex justify-between items-start mb-10">
                     <div className="space-y-1">
                        <h5 className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Event Detail</h5>
                        <p className="text-base font-mono font-bold text-slate-500">{selectedResult.timestamp}</p>
                     </div>
                     <button onClick={() => setSelectedResult(null)} className="p-2 text-slate-600 hover:text-white transition-colors bg-slate-800/30 rounded-xl"><X size={28} /></button>
                  </div>

                  <div className="space-y-3 mb-10">
                     <h6 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">AI Description</h6>
                     <p className="text-xl font-black text-white leading-tight italic">{selectedResult.aiDescription}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 py-8 border-y border-slate-800/50 mb-10">
                     <div className="space-y-1">
                        <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Camera</h6>
                        <span className="text-sm font-black text-slate-200">{selectedResult.camera}</span>
                     </div>
                     <div className="space-y-1">
                        <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Confidence</h6>
                        <span className="text-sm font-black text-blue-500">{selectedResult.confidence}% Match</span>
                     </div>
                  </div>

                  <div className="space-y-4 mb-10 flex-1">
                     <h6 className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-2 tracking-widest"><Tag size={12}/> Detected Objects</h6>
                     <div className="flex flex-wrap gap-2.5">
                        {selectedResult.objects.map(obj => (
                          <span key={obj} className="px-4 py-2 bg-slate-800 border border-slate-700/50 text-[10px] font-black text-slate-400 rounded-xl uppercase tracking-wider shadow-lg">{obj}</span>
                        ))}
                     </div>
                  </div>

                  <button className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-4 group">
                     <Download size={20} className="group-hover:translate-y-0.5 transition-transform" /> Download Full Clip
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default VLMTab;