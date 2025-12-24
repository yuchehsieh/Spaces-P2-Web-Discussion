import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  Download, 
  ChevronRight, 
  AlertTriangle, 
  Clock,
  LayoutList,
  CheckCircle2,
  ChevronLeft,
  Settings2,
  MapPin,
  PlayCircle,
  Layers,
  HeartPulse,
  Server,
  Info,
  Fingerprint,
  Cpu
} from 'lucide-react';
import { MOCK_EVENTS } from '../constants';
import EventManagementView from './EventManagementView';

type EventSubNavType = 'list' | 'settings';

const EventTab: React.FC = () => {
  const [activeSubNav, setActiveSubNav] = useState<EventSubNavType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => {
      const matchesSearch = event.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || event.type === filterType.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [searchTerm, filterType]);

  const activeEvent = useMemo(() => 
    MOCK_EVENTS.find(e => e.id === viewingEventId), 
    [viewingEventId]
  );

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden relative">
      {/* Sub-Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0 p-6">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Bell size={20} />
             </div>
             Events
          </h2>
        </div>
        <nav className="space-y-2">
          {[
            { id: 'list', label: '歷史事件紀錄', icon: <LayoutList size={18} />, desc: 'Event Logs & History' },
            { id: 'settings', label: '管理事件', icon: <Settings2 size={18} />, desc: 'Custom Rules' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveSubNav(item.id as EventSubNavType); setViewingEventId(null); }}
              className={`w-full group flex items-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 border ${
                activeSubNav === item.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' 
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className={`mt-0.5 p-2 rounded-xl ${activeSubNav === item.id ? 'bg-white/20' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'}`}>
                {item.icon}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold tracking-tight">{item.label}</div>
                <div className={`text-[10px] font-medium opacity-60 ${activeSubNav === item.id ? 'text-blue-100' : ''}`}>{item.desc}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050914] p-10">
        {/* --- 歷史事件紀錄列表 --- */}
        {activeSubNav === 'list' && !viewingEventId && (
          <div className="max-w-[1500px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-12 pb-8 border-b border-slate-800/50">
                <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Event Center <span className="text-blue-600">.</span></h1>
                   <p className="text-sm text-slate-500 font-medium">查看與管理全場域安全事件，包括 AI 辨識、入侵告警與設備連動紀錄</p>
                </div>
                <div className="flex items-center gap-3">
                   <button className="px-6 py-2.5 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-slate-800">
                      <Download size={16} /> 匯出事件日誌
                   </button>
                   <button className="px-6 py-2.5 bg-blue-900/20 border border-blue-700/50 text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-blue-900/40">
                      <CheckCircle2 size={16} /> 全部標記已讀
                   </button>
                </div>
             </div>

             <div className="flex items-center justify-between gap-4 mb-8">
                <div className="relative flex-1 max-w-2xl">
                    <input 
                      type="text" 
                      placeholder="搜尋事件訊息、發生地點..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all shadow-xl" 
                    />
                    <Search size={18} className="absolute left-4 top-3 text-slate-600" />
                </div>
                <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-2xl">
                    {['ALL', 'VLM', 'ALERT', 'INFO'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setFilterType(tab)}
                          className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all tracking-widest uppercase ${filterType === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
             </div>

             <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-black/20 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <th className="px-8 py-6 w-24">STATUS</th>
                        <th className="px-8 py-6">PRECISE TIME</th>
                        <th className="px-8 py-6">EVENT DETAILS</th>
                        <th className="px-8 py-6">PROPERTIES</th>
                        <th className="px-8 py-6">LOCATION</th>
                        <th className="px-8 py-6 text-right">ACTIONS</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                     {filteredEvents.map(event => (
                        <tr key={event.id} onClick={() => setViewingEventId(event.id)} className="group hover:bg-white/5 transition-all cursor-pointer">
                           <td className="px-8 py-6"><div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${event.message.includes('SOS') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}><AlertTriangle size={20} /></div></td>
                           <td className="px-8 py-6"><span className="text-sm font-black text-slate-100 font-mono">{event.timestamp}</span></td>
                           <td className="px-8 py-6"><span className="text-sm font-black text-slate-100">{event.message}</span></td>
                           <td className="px-8 py-6"><div className="flex items-center gap-2">{event.linkedSensorId && <div className="px-2 py-1 bg-orange-900/20 border border-orange-500/30 rounded text-[10px] font-black text-orange-400">LINKED</div>}</div></td>
                           <td className="px-8 py-6"><span className="text-sm font-bold text-slate-400">{event.location}</span></td>
                           <td className="px-8 py-6 text-right"><ChevronRight size={18} className="inline text-slate-600 group-hover:text-blue-400 transition-colors"/></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {/* --- 事件詳細資訊頁面 --- */}
        {activeSubNav === 'list' && viewingEventId && activeEvent && (
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
             <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800 shrink-0">
                <button onClick={() => setViewingEventId(null)} className="p-3 bg-[#1e293b] hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all shadow-xl"><ChevronLeft size={24} /></button>
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tighter">事件詳細資訊 <span className="text-blue-600">.</span></h1>
                   <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                      <span className="flex items-center gap-1.5 text-blue-500"><MapPin size={14}/> {activeEvent.location}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="flex items-center gap-1.5"><Clock size={14}/> {activeEvent.timestamp}</span>
                   </div>
                </div>
             </div>
             {/* ... Detail content remains for History view ... */}
             <div className="flex-1 flex gap-8 min-h-0 overflow-hidden pb-12">
                <div className="w-80 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                   <div className="bg-[#111827] border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden ring-1 ring-white/5">
                      <div className="flex items-center gap-3 mb-6"><Fingerprint size={20} className="text-blue-500" /><span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">數位存證證書</span></div>
                      <div className="space-y-4">
                         <div className="space-y-1"><span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">數位簽章 (SHA-256)</span><p className="text-[10px] text-slate-400 font-mono break-all leading-tight tracking-tighter">f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2f7a8b9c0</p></div>
                         <div className="space-y-1"><span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">存證節點</span><p className="text-sm font-black text-slate-200 tracking-tight">SKS_MAIN_HQ_01</p></div>
                         <div className="pt-4 border-t border-slate-800"><div className="h-1.5 bg-green-500/10 rounded-full overflow-hidden mb-2"><div className="w-full h-full bg-green-500"></div></div><span className="text-[10px] font-black text-green-500 uppercase tracking-widest">VERIFIED</span></div>
                      </div>
                   </div>
                </div>
                <div className="flex-1 flex flex-col bg-[#0b1121] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                   <div className="flex-1 bg-black relative group/viewer flex flex-col items-center justify-center">
                      {activeEvent.message.includes('SOS') ? <AlertTriangle size={64} className="text-red-500 animate-pulse" /> : <PlayCircle size={100} className="text-white/20" />}
                   </div>
                   <div className="h-24 bg-[#111827] border-t border-slate-800 flex items-center justify-end px-10 shrink-0">
                      <button onClick={() => setViewingEventId(null)} className="px-12 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl">確認並關閉</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* --- 管理事件與自訂規則 (重構至子組件) --- */}
        {activeSubNav === 'settings' && <EventManagementView />}
      </div>
    </div>
  );
};

export default EventTab;