
import React from 'react';
import { Settings, Sliders, Shield, AlertTriangle, Info, Image as ImageIcon, Maximize2, Monitor, Trash2 } from 'lucide-react';
import { SecurityEvent } from '../types';

interface EventPanelProps {
  events: SecurityEvent[];
  onClearEvents?: () => void; // Optional callback to clear events
}

const EventPanel: React.FC<EventPanelProps> = ({ events, onClearEvents }) => {
  return (
    <div className="w-72 bg-[#0b1121] border-l border-slate-800 flex flex-col h-full flex-shrink-0">
        
      {/* Top Controls */}
      <div className="h-10 bg-[#162032] border-b border-slate-700 flex items-center justify-between px-2">
         <div className="flex space-x-1">
             <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Settings"><Settings size={14} /></button>
             <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Filters"><Sliders size={14} /></button>
         </div>
         <div className="flex space-x-1">
            <button 
              onClick={onClearEvents}
              className="px-2 py-0.5 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-900/30 text-[10px] rounded border border-slate-700 flex items-center transition-all group"
              title="清空訊息"
            >
                <Trash2 size={10} className="mr-1 group-hover:text-red-400"/> 清空訊息
            </button>
            <div className="px-2 py-0.5 bg-blue-900 text-blue-200 text-[10px] rounded border border-blue-700 flex items-center cursor-pointer hover:bg-blue-800 transition-colors">
                <Monitor size={10} className="mr-1"/> 暫停刷新
            </div>
             <div className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-600 flex items-center cursor-pointer hover:bg-slate-600 transition-colors">
                <ImageIcon size={10} className="mr-1"/> 流屏
            </div>
         </div>
      </div>

      {/* Grid Controls */}
      <div className="h-10 bg-[#0f172a] border-b border-slate-800 flex items-center justify-end px-2 space-x-2">
          <button className="p-1 bg-blue-600 text-white rounded"><Monitor size={14}/></button>
          <button className="p-1 text-slate-400 hover:text-white transition-colors"><div className="w-3.5 h-3.5 border border-slate-400"></div></button>
          <button className="p-1 text-slate-400 hover:text-white grid grid-cols-2 gap-0.5 w-4 h-4 transition-colors">
            <div className="bg-slate-400"></div><div className="bg-slate-400"></div>
            <div className="bg-slate-400"></div><div className="bg-slate-400"></div>
          </button>
          <button className="p-1 text-slate-400 hover:text-white transition-colors"><Maximize2 size={14}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {events.length > 0 ? events.map((event) => (
          <div key={event.id} className="bg-[#1e293b] border border-slate-700 p-3 rounded flex items-start space-x-3 hover:bg-[#283548] cursor-pointer group transition-all animate-in slide-in-from-right-2">
             {/* Event Icon */}
            <div className={`mt-1 flex-shrink-0 rounded-full p-1.5 ${
                event.type === 'alert' ? 'bg-red-900 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' :
                event.type === 'warning' ? 'bg-orange-900 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]' :
                'bg-blue-900 text-blue-400'
            }`}>
                {event.type === 'alert' ? <AlertTriangle size={16}/> : 
                 event.type === 'warning' ? <Shield size={16}/> : 
                 <Info size={16}/>}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="text-[13px] font-bold text-slate-200 truncate pr-1">{event.message}</h4>
                    <span className="text-[9px] text-slate-500 font-mono bg-slate-900/50 px-1 rounded">{event.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate italic">{event.location}</p>
                <div className="mt-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[10px] bg-slate-700 text-white px-2 py-0.5 rounded hover:bg-blue-600 transition-colors">Playback</button>
                    <button className="text-[10px] bg-slate-700 text-white px-2 py-0.5 rounded hover:bg-slate-600 transition-colors">Ack</button>
                </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center h-40 opacity-20 select-none">
            <Trash2 size={40} className="mb-2" />
            <span className="text-sm">尚無訊息</span>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-slate-800 text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
        Event Stream Center
      </div>
    </div>
  );
};

export default EventPanel;
