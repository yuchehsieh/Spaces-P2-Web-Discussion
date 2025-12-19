import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Settings2, 
  Search, 
  Download, 
  ChevronRight, 
  AlertTriangle, 
  Info, 
  ShieldAlert,
  Clock,
  LayoutList,
  Mail,
  Smartphone,
  Link as LinkIcon,
  Video,
  CheckCircle2,
  ChevronLeft,
  Activity,
  Shield,
  Cpu,
  Database,
  Plus,
  ToggleRight,
  MoreVertical,
  BatteryLow,
  WifiOff,
  Check,
  Webhook,
  Zap,
  Maximize,
  Fingerprint,
  MapPin,
  History,
  PlayCircle,
  Layers,
  X,
  FileText,
  Server,
  Lightbulb,
  Power
} from 'lucide-react';
import { MOCK_EVENTS, SITE_TREE_DATA } from '../constants';
import { SecurityEvent, SiteNode } from '../types';

type EventSubNavType = 'list' | 'settings';

interface CustomEventRule {
  id: string;
  name: string;
  isEnabled: boolean;
  creator: string;
  type: 'default' | 'user';
  category: 'battery' | 'signal' | 'custom' | 'vlm';
  description: string;
}

const EventTab: React.FC = () => {
  const [activeSubNav, setActiveSubNav] = useState<EventSubNavType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  
  // --- Create Event Form States (Row 1) ---
  const [isCreating, setIsCreating] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<'camera' | 'sensor' | 'energy'>('sensor');
  const [selectedTriggerLogics, setSelectedTriggerLogics] = useState<string[]>(['Extreme Values']);
  const [selectedVlmFeatures, setSelectedVlmFeatures] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>(['notify']);
  const [selectedNotifyMediums, setSelectedNotifyMediums] = useState<string[]>(['email', 'app']);
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Scope State (Row 1)
  const [selectedScopeDevices, setSelectedScopeDevices] = useState<string[]>(['env', 'water']);
  // Receiver State (Row 1)
  const [selectedReceivers, setSelectedReceivers] = useState<string[]>(['admin', 'bob']);

  // --- Linked Assets States (Row 2) ---
  const [selectedRow2AssetCategory, setSelectedRow2AssetCategory] = useState<'camera' | 'sensor' | 'energy'>('camera');
  const [enableRow2Recording, setEnableRow2Recording] = useState(false);
  const [row2RecordingDuration, setRow2RecordingDuration] = useState('10s');
  const [enableRow2Deterrence, setEnableRow2Deterrence] = useState(false);
  const [row2DeterrenceDuration, setRow2DeterrenceDuration] = useState('5s');
  const [enableRow2Flash, setEnableRow2Flash] = useState(false);
  const [enableRow2Start, setEnableRow2Start] = useState(false); 
  const [enableRow2Stop, setEnableRow2Stop] = useState(false);   
  const [selectedRow2ScopeDevices, setSelectedRow2ScopeDevices] = useState<string[]>([]);
  const [selectedRow2Actions, setSelectedRow2Actions] = useState<string[]>([]);

  // --- Linked Assets States (Row 3) ---
  const [selectedRow3AssetCategory, setSelectedRow3AssetCategory] = useState<'energy' | 'camera' | 'sensor'>('energy');
  const [enableRow3Start, setEnableRow3Start] = useState(false);
  const [enableRow3Stop, setEnableRow3Stop] = useState(false);
  const [enableRow3Recording, setEnableRow3Recording] = useState(false); 
  const [row3RecordingDuration, setRow3RecordingDuration] = useState('10s');
  const [enableRow3Deterrence, setEnableRow3Deterrence] = useState(false);
  const [row3DeterrenceDuration, setRow3DeterrenceDuration] = useState('5s');
  const [enableRow3Flash, setEnableRow3Flash] = useState(false);
  const [selectedRow3ScopeDevices, setSelectedRow3ScopeDevices] = useState<string[]>([]);

  // 設備映射表
  const deviceMap = useMemo(() => {
    const map: Record<string, { type: string; label: string }> = {};
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') {
        map[node.id] = { type: node.deviceType || 'unknown', label: node.label };
      }
      node.children?.forEach(traverse);
    };
    SITE_TREE_DATA.forEach(traverse);
    return map;
  }, []);

  const [customEventRules] = useState<CustomEventRule[]>([
    { 
      id: 'rule-low-batt', 
      name: '低電量告警', 
      isEnabled: true, 
      creator: 'Admin', 
      type: 'default',
      category: 'battery',
      description: '當無線感測器電量低於 20% 時自動觸發通知。'
    },
    { 
      id: 'rule-offline', 
      name: '斷訊告警', 
      isEnabled: true, 
      creator: 'Admin', 
      type: 'default', 
      category: 'signal',
      description: '當設備與閘道器失去連線超過 5 分鐘時觸發。'
    }
  ]);

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

  const getEventFeatures = (event: SecurityEvent) => {
    const isLinked = !!event.linkedSensorId;
    const mainDevice = event.sensorId ? deviceMap[event.sensorId] : null;
    const linkedDevice = event.linkedSensorId ? deviceMap[event.linkedSensorId] : null;
    const hasVideo = event.type === 'vlm' || mainDevice?.type === 'camera' || linkedDevice?.type === 'camera';
    return { isLinked, hasVideo };
  };

  const toggleTriggerLogic = (logic: string) => {
    setSelectedTriggerLogics(prev => 
      prev.includes(logic) ? prev.filter(l => l !== logic) : [...prev, logic]
    );
  };

  const toggleVlmFeature = (feature: string) => {
    setSelectedVlmFeatures(prev => 
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const toggleRow2Action = (action: string) => {
    setSelectedRow2Actions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const toggleNotifyMedium = (medium: string) => {
    setSelectedNotifyMediums(prev => 
      prev.includes(medium) ? prev.filter(m => m !== medium) : [...prev, medium]
    );
  };

  const toggleScopeDevice = (id: string) => {
    setSelectedScopeDevices(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleRow2ScopeDevice = (id: string) => {
    setSelectedRow2ScopeDevices(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleRow3ScopeDevice = (id: string) => {
    setSelectedRow3ScopeDevices(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleReceiver = (id: string) => {
    setSelectedReceivers(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isExtremeValuesActive = selectedTriggerLogics.includes('Extreme Values');

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden">
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
            { id: 'list', label: '事件列表', icon: <LayoutList size={18} />, desc: 'Event Logs & History' },
            { id: 'settings', label: '自訂事件設定', icon: <Settings2 size={18} />, desc: 'Custom Rules' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveSubNav(item.id as EventSubNavType); setViewingEventId(null); setIsCreating(false); }}
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
        {/* --- 事件列表頁面 --- */}
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
                        <th className="px-8 py-6">STATUS</th>
                        <th className="px-8 py-6">PRECISE TIME</th>
                        <th className="px-8 py-6">EVENT DETAILS</th>
                        <th className="px-8 py-6">PROPERTIES</th>
                        <th className="px-8 py-6">LOCATION</th>
                        <th className="px-8 py-6 text-right">ACTIONS</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                     {filteredEvents.map(event => {
                       const { isLinked, hasVideo } = getEventFeatures(event);
                       const isSos = event.message.includes('SOS');
                       const isInfo = event.type === 'info';
                       
                       return (
                        <tr 
                          key={event.id} 
                          onClick={() => setViewingEventId(event.id)}
                          className="group hover:bg-white/5 transition-all cursor-pointer"
                        >
                           <td className="px-8 py-6">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                isSos ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-lg shadow-red-900/10' :
                                isInfo ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-[#1e293b] text-slate-400 border-slate-700'
                              }`}>
                                 {isSos ? <AlertTriangle size={20} /> : isInfo ? <Info size={20} /> : <ShieldAlert size={20} />}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-100 font-mono tracking-tight">{event.timestamp}</span>
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">DEC 18, 2025</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-0.5">
                                 <span className="text-sm font-black text-slate-100 tracking-tight">{event.message}</span>
                                 <span className="text-[10px] text-slate-500 font-bold font-mono tracking-tighter uppercase">ID: {event.id.toUpperCase()} • SRC: {event.sensorId?.toUpperCase() || 'SYS'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 {hasVideo && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-900/20 border border-blue-500/30 rounded-lg text-[10px] font-black text-blue-400 tracking-widest uppercase">
                                       <Video size={12} /> VIDEO
                                    </div>
                                 )}
                                 {isLinked && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-900/20 border border-orange-500/30 rounded-lg text-[10px] font-black text-orange-400 tracking-widest uppercase">
                                       <LinkIcon size={12} /> LINKED
                                    </div>
                                 )}
                                 {!hasVideo && !isLinked && <span className="text-[10px] text-slate-700 font-black tracking-widest italic uppercase">N/A</span>}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-bold text-slate-400">{event.location}</span>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="p-1.5 bg-slate-800/50 rounded-lg text-slate-600 group-hover:text-blue-400 group-hover:bg-blue-400/10 transition-all inline-block">
                                 <ChevronRight size={18} />
                              </div>
                           </td>
                        </tr>
                       );
                     })}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {/* --- 事件詳細資訊頁面 --- */}
        {activeSubNav === 'list' && viewingEventId && activeEvent && (
          <div className="max-w-[1500px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full overflow-hidden">
             {/* Header */}
             <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-800">
                <button 
                  onClick={() => setViewingEventId(null)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all shadow-xl"
                >
                   <ChevronLeft size={24} />
                </button>
                <div className="h-10 w-px bg-slate-800 mx-2"></div>
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tighter">事件詳細資訊 <span className="text-blue-600">.</span></h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                         <MapPin size={12} className="text-blue-500" /> {activeEvent.location}
                      </span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                         <Clock size={12} className="text-blue-500" /> {activeEvent.timestamp}
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex flex-1 gap-8 min-h-0">
                {/* Sidebar Section (Metadata) */}
                <div className="w-80 shrink-0 space-y-8 overflow-y-auto custom-scrollbar pr-2">
                   <div className="bg-[#111827] border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[30px] rounded-full"></div>
                      <div className="flex items-center gap-3 mb-6 relative z-10">
                         <Fingerprint size={20} className="text-blue-500" />
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">數位存證證書</h4>
                      </div>
                      <div className="space-y-4 relative z-10">
                         <div className="space-y-1">
                            <span className="block text-[9px] text-slate-600 font-black uppercase tracking-widest">數位簽章 (SHA-256)</span>
                            <span className="block text-[11px] text-slate-400 font-mono break-all leading-tight">f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2f7a8b9c0</span>
                         </div>
                         <div className="space-y-1">
                            <span className="block text-[9px] text-slate-600 font-black uppercase tracking-widest">存證節點</span>
                            <span className="block text-[12px] text-slate-300 font-black uppercase">SKS_MAIN_HQ_01</span>
                         </div>
                         <div className="pt-2 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-green-500/10 rounded-full overflow-hidden">
                               <div className="w-full h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                            </div>
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Verified</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-400">
                         <Info size={16} className="text-blue-500" />
                         <h4 className="text-[10px] font-black uppercase tracking-widest">元數據摘要</h4>
                      </div>
                      <div className="space-y-3 px-1">
                         <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest border-b border-slate-800/50 pb-2">
                            <span className="text-slate-600">設備來源</span>
                            <span className="text-slate-300 font-bold uppercase">{activeEvent.sensorId || 'System'}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest border-b border-slate-800/50 pb-2">
                            <span className="text-slate-600">事件類型</span>
                            <span className="text-blue-400 uppercase font-bold">{activeEvent.type}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest border-b border-slate-800/50 pb-2">
                            <span className="text-slate-600">優先等級</span>
                            <span className={activeEvent.message.includes('SOS') ? 'text-red-500 font-bold' : 'text-orange-400 font-bold'}>CRITICAL</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest pb-2">
                            <span className="text-slate-600">狀態</span>
                            <span className="text-green-500 font-bold">UNPROCESSED</span>
                         </div>
                      </div>
                   </div>

                   {getEventFeatures(activeEvent).hasVideo && activeEvent.type === 'vlm' && (
                     <div className="space-y-4 pt-4 border-t border-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-400">
                           <Cpu size={16} className="text-orange-500" />
                           <h4 className="text-[10px] font-black uppercase tracking-widest">AI 識標摘要</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 px-1">
                           <span className="px-4 py-1.5 bg-orange-900/20 text-orange-400 text-[10px] font-black rounded-lg border border-orange-500/30 uppercase tracking-widest">青年</span>
                           {activeEvent.vlmData?.gender === 'male' && (
                             <span className="px-4 py-1.5 bg-blue-900/20 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/30 uppercase tracking-widest">男性 (M)</span>
                           )}
                        </div>
                     </div>
                   )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col bg-[#0b1121] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                   {getEventFeatures(activeEvent).hasVideo ? (
                     <>
                        <div className="absolute top-8 left-8 right-8 z-10 pointer-events-none flex justify-between items-start">
                           <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3 bg-red-600/90 px-4 py-1.5 rounded-lg text-[11px] font-black tracking-[0.2em] text-white shadow-2xl">
                                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                 REPLAY
                              </div>
                              <div className="text-[10px] text-white/50 font-mono tracking-tighter bg-black/40 px-3 py-1 rounded backdrop-blur-sm self-start border border-white/5 uppercase">
                                 Node_Auth: Pass_SKS_Evidence
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <div className="text-3xl font-mono font-black text-white tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                                 {activeEvent.timestamp}<span className="text-lg opacity-60 ml-1">.483</span>
                              </div>
                              <div className="text-[10px] font-black text-white/40 tracking-[0.4em] uppercase">CAM_UTC+8_028</div>
                           </div>
                        </div>

                        <div className="flex-1 relative flex items-center justify-center bg-black">
                           <img 
                              src={activeEvent.vlmData?.fullSceneUrl || `https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_1.jpg?raw=true`}
                              className="w-full h-full object-cover opacity-80"
                              alt="Playback Frame"
                           />
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="relative mb-6 cursor-pointer hover:scale-105 transition-transform">
                                 <div className="absolute -inset-16 bg-blue-500/10 rounded-full blur-[60px] animate-pulse"></div>
                                 <PlayCircle size={96} className="text-white/40 relative drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
                              </div>
                              <span className="text-white/30 font-black text-sm tracking-[0.5em] uppercase animate-pulse">Playback Ready</span>
                           </div>
                        </div>

                        <div className="absolute bottom-28 left-8 right-8 z-10 pointer-events-none flex justify-between items-end">
                           <div className="flex gap-8">
                              <div className="flex flex-col">
                                 <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Longitude</span>
                                 <span className="text-sm text-white/70 font-mono font-bold">121.5796° E</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">Latitude</span>
                                 <span className="text-sm text-white/70 font-mono font-bold">25.0629° N</span>
                              </div>
                           </div>
                           <div className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl">
                              <Layers size={20} className="text-white/40" />
                           </div>
                        </div>

                        <div className="h-20 bg-black/60 border-t border-white/5 shrink-0 px-8 flex items-center gap-8 backdrop-blur-xl">
                           <div className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"><History size={20}/></div>
                           <div className="flex-1 h-1.5 bg-white/10 rounded-full relative group cursor-pointer overflow-hidden">
                              <div className="absolute top-0 left-0 h-full bg-blue-600 w-1/4 shadow-[0_0_20px_rgba(37,99,235,0.8)]"></div>
                              <div className="absolute top-0 left-1/4 h-full bg-blue-400/20 w-1/2"></div>
                           </div>
                           <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3">
                              <span className="text-blue-400 font-black text-sm">00:15</span>
                              <span className="opacity-30">/</span>
                              <span className="font-black">02:00</span>
                           </div>
                        </div>
                     </>
                   ) : (
                     <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center animate-in zoom-in duration-500">
                        <div className={`w-32 h-32 lg:w-44 lg:h-44 rounded-full flex items-center justify-center mb-8 lg:mb-12 border-4 shadow-2xl relative ${activeEvent.message.includes('SOS') ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-red-900/20' : 'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-900/20'}`}>
                           <div className={`absolute inset-0 rounded-full blur-[40px] opacity-20 ${activeEvent.message.includes('SOS') ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                           {activeEvent.message.includes('SOS') ? <AlertTriangle size={64} className="animate-pulse relative z-10 lg:w-20 lg:h-20" /> : <FileText size={64} className="relative z-10 lg:w-20 lg:h-20" />}
                        </div>
                        <div className="max-w-3xl space-y-4 mb-12">
                           <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-2 leading-none uppercase italic">{activeEvent.message}</h2>
                           <p className="text-lg lg:text-2xl text-slate-500 font-bold tracking-tight">{activeEvent.location}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                           <div className="p-8 bg-[#162032]/60 border border-slate-700/50 rounded-[2.5rem] text-left group hover:border-blue-500/40 transition-all shadow-xl backdrop-blur-sm">
                              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                 <Clock size={14} className="text-blue-500" /> 發生時間
                              </span>
                              <div className="text-3xl font-mono font-black text-slate-100 tracking-wider">{activeEvent.timestamp}</div>
                              <span className="text-[10px] text-slate-600 font-black uppercase mt-1.5 block tracking-widest">DEC 18, 2025</span>
                           </div>
                           <div className="p-8 bg-[#162032]/60 border border-slate-700/50 rounded-[2.5rem] text-left group hover:border-blue-500/40 transition-all shadow-xl backdrop-blur-sm">
                              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <Server size={14} className="text-blue-500" /> 來源設備 ID
                              </span>
                              <div className="text-3xl font-mono font-black text-slate-100 tracking-wider">{activeEvent.sensorId || 'N/A'}</div>
                              <span className="text-[10px] text-slate-600 font-black uppercase mt-1.5 block tracking-widest">SECURED_LINK_NODE</span>
                           </div>
                        </div>
                        <div className="mt-12 opacity-30">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Hardware Link Verified • Encrypted Protocol</p>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             <div className="mt-8 flex items-center justify-between p-8 bg-[#111827] border border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-blue-500/5 to-transparent"></div>
                <div className="flex items-center gap-10 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/10 rounded-2xl text-green-500 border border-green-500/20">
                         <Activity size={20} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">系統健康度</span>
                         <span className="text-xs font-black text-green-500 uppercase tracking-widest tracking-tighter">OPTIMAL PERFORMANCE</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                         <Shield size={20} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">資料存儲節點</span>
                         <span className="text-xs font-black text-blue-400 uppercase tracking-widest tracking-tighter">SK-DATA-SEC-B</span>
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 relative z-10">
                   <button className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] border border-slate-700 flex items-center justify-center gap-3 shadow-xl group">
                      <Download size={18} className="text-blue-400 group-hover:translate-y-0.5 transition-transform" /> 
                      下載數位存證
                   </button>
                   <button 
                     onClick={() => setViewingEventId(null)}
                     className="px-12 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40"
                   >
                      確認並關閉
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* --- 自訂事件設定頁面 --- */}
        {activeSubNav === 'settings' && !isCreating && (
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-800/50">
                <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-2">自訂事件設定 <span className="text-blue-600">.</span></h1>
                   <p className="text-sm text-slate-500 font-medium">根據個人需求自訂感測器通知規則</p>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/30 flex items-center gap-3 group"
                >
                   <Plus size={18} className="group-hover:rotate-90 transition-transform" /> 新增自訂事件
                </button>
             </div>

             <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-black/20 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                         <th className="px-8 py-6">Event Type</th>
                         <th className="px-8 py-6">Rule Name</th>
                         <th className="px-8 py-6">Enabled</th>
                         <th className="px-8 py-6">Creator</th>
                         <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/50">
                      {customEventRules.map((rule) => (
                        <tr key={rule.id} className="group hover:bg-white/5 transition-all">
                           <td className="px-8 py-6">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                rule.category === 'battery' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                rule.category === 'signal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                 {rule.category === 'battery' ? <BatteryLow size={24} /> : rule.category === 'signal' ? <WifiOff size={24} /> : <Settings2 size={24} />}
                              </div>
                           </td>
                           <td className="px-8 py-6"><span className="text-base font-black text-white">{rule.name}</span></td>
                           <td className="px-8 py-6">
                              {rule.type === 'default' ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Always Enabled</span>
                                </div>
                              ) : (
                                <div className={`relative inline-flex items-center h-6 w-11 rounded-full ${rule.isEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${rule.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} /></div>
                              )}
                           </td>
                           <td className="px-8 py-6"><span className="text-sm font-bold text-slate-300">{rule.creator}</span></td>
                           <td className="px-8 py-6 text-right"><MoreVertical className="inline-block text-slate-600"/></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] flex items-start gap-6">
                   <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg">
                      <Info size={24} />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white tracking-tight mb-2">什麼是自訂事件？</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        自訂事件允許您針對特定的硬體狀態（如電量、連線）或單一感測器觸發設定通知規則。
                        這些規則獨立於安防中心的設防狀態，無論保全是否開啟，符合條件時系統皆會發送通知。
                      </p>
                   </div>
                </div>
                <div className="p-8 bg-slate-800/20 border border-slate-700/50 rounded-[2.5rem] flex items-start gap-6">
                   <div className="p-4 bg-slate-700 rounded-2xl text-slate-400">
                      <Shield size={24} />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white tracking-tight mb-2">預設保護規則</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        系統包含核心運行所必需的預設規則（如斷訊告警）。這些規則由系統管理員維護，
                        確保監控架構的完整性，因此無法被刪除。預設規則設為 <strong>Always Enabled</strong> 以確保基礎安防功能。
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* --- 新增自訂事件 表單 --- */}
        {activeSubNav === 'settings' && isCreating && (
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
             <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                   <button onClick={() => setIsCreating(false)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all"><ChevronLeft size={24} /></button>
                   <div>
                      <h1 className="text-3xl font-black text-white tracking-tighter">新增自訂事件 <span className="text-blue-600">.</span></h1>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Configure automated rules and responses</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <button onClick={() => setIsCreating(false)} className="px-6 py-3 bg-transparent text-slate-400 hover:text-white text-xs font-black tracking-widest uppercase transition-all">Cancel</button>
                   <button className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/30">Create</button>
                </div>
             </div>

             <div className="mb-10">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 block">Event Name</label>
                <input 
                   type="text" 
                   placeholder="Event Name"
                   value={newEventName}
                   onChange={(e) => setNewEventName(e.target.value)}
                   className="w-full max-w-md bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-4 text-base font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                />
             </div>

             {/* 第一列: Row 1 */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in duration-500">
                {/* Column 1: Assets */}
                <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                   <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Database size={20} className="text-blue-500" /> Assets</h3>
                   <div className="space-y-8 flex-1">
                      <div className="grid grid-cols-3 gap-2">
                         {[
                           { id: 'camera', label: 'VLM', icon: <Video size={14}/> },
                           { id: 'sensor', label: 'SENSORS', icon: <Cpu size={14}/> },
                           { id: 'energy', label: 'ENERGY', icon: <Zap size={14}/> },
                         ].map(cat => (
                           <button key={cat.id} onClick={() => { setSelectedAssetCategory(cat.id as any); setSelectedTriggerLogics([]); }} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all text-[9px] font-black tracking-widest ${selectedAssetCategory === cat.id ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                              {cat.icon}
                              {cat.label}
                           </button>
                         ))}
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Trigger Logic</label>
                         {selectedAssetCategory === 'sensor' && (
                           <UnifiedCheckbox label="Extreme Values" desc="感測器數值異常偏移 (極值告警)" checked={selectedTriggerLogics.includes('Extreme Values')} onChange={() => toggleTriggerLogic('Extreme Values')} />
                         )}
                         {selectedAssetCategory === 'camera' && (
                           <div className="space-y-3">
                             <UnifiedCheckbox label="Human Search" checked={selectedTriggerLogics.includes('Human Search')} onChange={() => toggleTriggerLogic('Human Search')} />
                             <UnifiedCheckbox label="Vehicle Search" checked={selectedTriggerLogics.includes('Vehicle Search')} onChange={() => toggleTriggerLogic('Vehicle Search')} />
                             <div className="space-y-2">
                                <UnifiedCheckbox label="VLM Feature Match" checked={selectedTriggerLogics.includes('VLM Feature Match')} onChange={() => toggleTriggerLogic('VLM Feature Match')} />
                                {selectedTriggerLogics.includes('VLM Feature Match') && (
                                   <div className="pl-6 pt-1 space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                      <UnifiedCheckbox label="Face (人臉辨識)" checked={selectedVlmFeatures.includes('Face')} onChange={() => toggleVlmFeature('Face')} small />
                                      <UnifiedCheckbox label="License Plate (車牌辨識)" checked={selectedVlmFeatures.includes('License')} onChange={() => toggleVlmFeature('License')} small />
                                      <UnifiedCheckbox label="Uniform (制服辨識)" checked={selectedVlmFeatures.includes('Uniform')} onChange={() => toggleVlmFeature('Uniform')} small />
                                   </div>
                                )}
                             </div>
                           </div>
                         )}
                         {selectedAssetCategory === 'energy' && (
                           <div className="space-y-3">
                             <UnifiedCheckbox label="High Power Load" checked={selectedTriggerLogics.includes('High Load')} onChange={() => toggleTriggerLogic('High Load')} />
                             <UnifiedCheckbox label="Unusual Voltage Drop" checked={selectedTriggerLogics.includes('Voltage Drop')} onChange={() => toggleTriggerLogic('Voltage Drop')} />
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                {/* Column 2: Scope */}
                <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                   <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Maximize size={20} className="text-blue-500" /> Scope</h3>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Applicable Devices</label>
                      <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                         {selectedAssetCategory === 'sensor' && (
                           <>
                              <UnifiedScopeItem label="Environmental Sensors" icon={<Activity size={16}/>} sub="Temp, Humidity" checked={selectedScopeDevices.includes('env')} onChange={() => toggleScopeDevice('env')} />
                              <UnifiedScopeItem label="Water Leak Sensors" icon={<Shield size={16}/>} sub="Flooding Detection" checked={selectedScopeDevices.includes('water')} onChange={() => toggleScopeDevice('water')} />
                              <UnifiedScopeItem label="PIR" icon={<Zap size={16}/>} sub="Motion Detection" disabled={isExtremeValuesActive} />
                              <UnifiedScopeItem label="WDI" icon={<ToggleRight size={16}/>} sub="Input Interface" disabled={isExtremeValuesActive} />
                              <UnifiedScopeItem label="SOS Button" icon={<Bell size={16}/>} sub="Emergency Signal" disabled={isExtremeValuesActive} />
                           </>
                         )}
                         {selectedAssetCategory === 'camera' && (
                           <>
                              <UnifiedScopeItem label="Entrance Camera 01" icon={<Video size={16}/>} sub="HQ-Zone-A" checked={selectedScopeDevices.includes('cam1')} onChange={() => toggleScopeDevice('cam1')} />
                              <UnifiedScopeItem label="Backdoor Camera 04" icon={<Video size={16}/>} sub="HQ-Zone-B" checked={selectedScopeDevices.includes('cam2')} onChange={() => toggleScopeDevice('cam2')} />
                              <UnifiedScopeItem label="Warehouse Camera 02" icon={<Video size={16}/>} sub="ZS-Zone-C" checked={selectedScopeDevices.includes('cam3')} onChange={() => toggleScopeDevice('cam3')} />
                           </>
                         )}
                         {selectedAssetCategory === 'energy' && (
                           <>
                              <UnifiedScopeItem label="Smart Meter - Main" icon={<Zap size={16}/>} sub="Total Consumption" checked={selectedScopeDevices.includes('meter1')} onChange={() => toggleScopeDevice('meter1')} />
                              <UnifiedScopeItem label="Smart Meter - Server Rm" icon={<Zap size={16}/>} sub="Data Center Feed" checked={selectedScopeDevices.includes('meter2')} onChange={() => toggleScopeDevice('meter2')} />
                           </>
                         )}
                      </div>
                   </div>
                </div>

                {/* Column 3: Action */}
                <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                   <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Zap size={20} className="text-blue-500" /> Action</h3>
                   <div className="space-y-8 flex-1 flex flex-col">
                      <div className="grid grid-cols-3 gap-2">
                         {[
                           { id: 'notify', label: 'NOTIFY', icon: <Bell size={14}/> },
                           { id: 'link', label: 'LINK ASSETS', icon: <LinkIcon size={14}/> },
                           { id: 'webhook', label: 'WebHook', icon: <Webhook size={14}/> },
                         ].map(action => (
                           <button key={action.id} onClick={() => toggleAction(action.id)} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all text-[9px] font-black tracking-widest ${selectedActions.includes(action.id) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                              {selectedActions.includes(action.id) ? <CheckCircle2 size={14} className="animate-in zoom-in" /> : action.icon}
                              {action.label}
                           </button>
                         ))}
                      </div>

                      <div className="space-y-8 flex-1 flex flex-col">
                         {selectedActions.includes('notify') && (
                           <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Notification Medium</label>
                                 <div className="flex gap-4">
                                    <NotifyMediumButton label="Email" icon={<Mail size={16}/>} active={selectedNotifyMediums.includes('email')} onClick={() => toggleNotifyMedium('email')} />
                                    <NotifyMediumButton label="App" icon={<Smartphone size={16}/>} active={selectedNotifyMediums.includes('app')} onClick={() => toggleNotifyMedium('app')} />
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Select Receiver</label>
                                 <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                                    <UnifiedCheckbox label="Admin (admin@sks.com.tw)" checked={selectedReceivers.includes('admin')} onChange={() => toggleReceiver('admin')} small />
                                    <UnifiedCheckbox label="Bob (bob@sks.com.tw)" checked={selectedReceivers.includes('bob')} onChange={() => toggleReceiver('bob')} small />
                                    <UnifiedCheckbox label="Mary (mary@sks.com.tw)" checked={selectedReceivers.includes('mary')} onChange={() => toggleReceiver('mary')} small />
                                 </div>
                              </div>
                           </div>
                         )}
                         {selectedActions.includes('webhook') && (
                           <div className="space-y-3 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">WebHook Configuration</label>
                              <div className="space-y-3">
                                <input type="url" placeholder="WEBHOOK URL (https://...)" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full bg-[#050914] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-blue-500 shadow-inner" />
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             {/* 第二列: Row 2 - LINK ASSETS LEVEL 1 */}
             {selectedActions.includes('link') && (
                <div className="animate-in slide-in-from-top-8 fade-in duration-700 mb-12">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-slate-800 flex-1"></div>
                      <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <LinkIcon size={12}/> Linked Level 1 Assets Configuration (Level 2)
                      </div>
                      <div className="h-px bg-slate-800 flex-1"></div>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Column 1: Row 2 Assets */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col relative overflow-hidden">
                        <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Video size={20} className="text-blue-400" /> Assets</h3>
                        <div className="space-y-8 flex-1">
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setSelectedRow2AssetCategory('camera')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-[8px] font-black tracking-widest ${selectedRow2AssetCategory === 'camera' ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}><Video size={12}/>CAMERA</button>
                                <button onClick={() => setSelectedRow2AssetCategory('sensor')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-[8px] font-black tracking-widest ${selectedRow2AssetCategory === 'sensor' ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}><Cpu size={12}/>SENSORS</button>
                                <button onClick={() => setSelectedRow2AssetCategory('energy')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-[8px] font-black tracking-widest ${selectedRow2AssetCategory === 'energy' ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}><Zap size={12}/>ENERGY</button>
                            </div>
                            {selectedRow2AssetCategory === 'camera' && (
                               <div className="space-y-6 animate-in fade-in duration-500">
                                  <div className="space-y-3">
                                     <UnifiedCheckbox label="開啟錄影功能" checked={enableRow2Recording} onChange={() => setEnableRow2Recording(!enableRow2Recording)} small />
                                     {enableRow2Recording && (
                                        <div className="pl-6 animate-in slide-in-from-left-2 fade-in">
                                           <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">錄影時長</label>
                                           <DurationSelector value={row2RecordingDuration} onChange={setRow2RecordingDuration} />
                                        </div>
                                     )}
                                  </div>
                                  <div className="space-y-3">
                                     <UnifiedCheckbox label="開啟嚇阻功能" checked={enableRow2Deterrence} onChange={() => setEnableRow2Deterrence(!enableRow2Deterrence)} small />
                                     {enableRow2Deterrence && (
                                        <div className="pl-6 space-y-4 animate-in slide-in-from-left-2 fade-in">
                                           <div><label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">嚇阻時長</label><DurationSelector value={row2DeterrenceDuration} onChange={setRow2DeterrenceDuration} /></div>
                                           <UnifiedCheckbox label="閃爍燈源" checked={enableRow2Flash} onChange={() => setEnableRow2Flash(!enableRow2Flash)} small />
                                        </div>
                                     )}
                                  </div>
                               </div>
                            )}
                            {selectedRow2AssetCategory === 'energy' && (
                               <div className="space-y-4 animate-in fade-in duration-500">
                                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Energy Control</label>
                                  <UnifiedCheckbox label="啟動設備" checked={enableRow2Start} onChange={() => setEnableRow2Start(!enableRow2Start)} small />
                                  <UnifiedCheckbox label="關閉設備" checked={enableRow2Stop} onChange={() => setEnableRow2Stop(!enableRow2Stop)} small />
                               </div>
                            )}
                        </div>
                      </div>

                      {/* Column 2: Row 2 Scope */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                         <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Maximize size={20} className="text-blue-500" /> Scope</h3>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Linked Devices</label>
                            <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                               {selectedRow2AssetCategory === 'camera' && (
                                  <>
                                     <UnifiedScopeItem label="辦公室 攝影機" icon={<Video size={16}/>} sub="Office-Area-1" checked={selectedRow2ScopeDevices.includes('r2_cam1')} onChange={() => toggleRow2ScopeDevice('r2_cam1')} />
                                     <UnifiedScopeItem label="總公司門口 槍型攝影機" icon={<Video size={16}/>} sub="HQ-Main-Entrance" checked={selectedRow2ScopeDevices.includes('r2_cam2')} onChange={() => toggleRow2ScopeDevice('r2_cam2')} />
                                  </>
                               )}
                               {selectedRow2AssetCategory === 'energy' && (
                                  <>
                                     <UnifiedScopeItem label="大廳 電燈電源" icon={<Lightbulb size={16}/>} sub="Power-Node-Lobby" checked={selectedRow2ScopeDevices.includes('r2_p1')} onChange={() => toggleRow2ScopeDevice('r2_p1')} />
                                     <UnifiedScopeItem label="辦公室 電燈電源" icon={<Lightbulb size={16}/>} sub="Power-Node-Office" checked={selectedRow2ScopeDevices.includes('r2_p2')} onChange={() => toggleRow2ScopeDevice('r2_p2')} />
                                  </>
                               )}
                               {selectedRow2AssetCategory === 'sensor' && (
                                  <div className="text-[10px] text-slate-600 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">請選擇感測分區...</div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Column 3: Row 2 Action */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                         <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Zap size={20} className="text-blue-500" /> Action</h3>
                         <div className="space-y-8 flex-1">
                            <button onClick={() => toggleRow2Action('link')} className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all text-[9px] font-black tracking-widest ${selectedRow2Actions.includes('link') ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                               {selectedRow2Actions.includes('link') ? <CheckCircle2 size={14} /> : <LinkIcon size={14}/>}
                               LINK ASSETS (LEVEL 3)
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {/* 第三列: Row 3 - LINK ASSETS LEVEL 2 */}
             {selectedActions.includes('link') && selectedRow2Actions.includes('link') && (
                <div className="animate-in slide-in-from-top-8 fade-in duration-700">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-slate-800 flex-1"></div>
                      <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <LinkIcon size={12}/> Linked Level 2 Assets Configuration (LEVEL 3)
                      </div>
                      <div className="h-px bg-slate-800 flex-1"></div>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Column 1: Row 3 Assets */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col relative overflow-hidden">
                        <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Zap size={20} className="text-blue-400" /> Assets</h3>
                        <div className="space-y-8 flex-1">
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setSelectedRow3AssetCategory('camera')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-[8px] font-black tracking-widest ${selectedRow3AssetCategory === 'camera' ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}><Video size={12}/>CAMERA</button>
                                <button onClick={() => setSelectedRow3AssetCategory('sensor')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-[8px] font-black tracking-widest ${selectedRow3AssetCategory === 'sensor' ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}><Cpu size={12}/>SENSORS</button>
                                <button onClick={() => setSelectedRow3AssetCategory('energy')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-[8px] font-black tracking-widest ${selectedRow3AssetCategory === 'energy' ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}><Zap size={12}/>ENERGY</button>
                            </div>

                            {selectedRow3AssetCategory === 'energy' && (
                               <div className="space-y-4 animate-in fade-in duration-500">
                                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Energy Control</label>
                                  <UnifiedCheckbox label="啟動設備" checked={enableRow3Start} onChange={() => setEnableRow3Start(!enableRow3Start)} small />
                                  <UnifiedCheckbox label="關閉設備" checked={enableRow3Stop} onChange={() => setEnableRow3Stop(!enableRow3Stop)} small />
                               </div>
                            )}
                            {selectedRow3AssetCategory === 'camera' && (
                               <div className="space-y-6 animate-in fade-in duration-500">
                                  <div className="space-y-3">
                                     <UnifiedCheckbox label="開啟錄影功能" checked={enableRow3Recording} onChange={() => setEnableRow3Recording(!enableRow3Recording)} small />
                                     {enableRow3Recording && (
                                        <div className="pl-6 animate-in slide-in-from-left-2 fade-in">
                                           <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">錄影時長</label>
                                           <DurationSelector value={row3RecordingDuration} onChange={setRow3RecordingDuration} />
                                        </div>
                                     )}
                                  </div>
                                  <div className="space-y-3">
                                     <UnifiedCheckbox label="開啟嚇阻功能" checked={enableRow3Deterrence} onChange={() => setEnableRow3Deterrence(!enableRow3Deterrence)} small />
                                     {enableRow3Deterrence && (
                                        <div className="pl-6 space-y-4 animate-in slide-in-from-left-2 fade-in">
                                           <div><label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 block">嚇阻時長</label><DurationSelector value={row3DeterrenceDuration} onChange={setRow3DeterrenceDuration} /></div>
                                           <UnifiedCheckbox label="閃爍燈源" checked={enableRow3Flash} onChange={() => setEnableRow3Flash(!enableRow3Flash)} small />
                                        </div>
                                     )}
                                  </div>
                               </div>
                            )}
                        </div>
                      </div>

                      {/* Column 2: Row 3 Scope */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                         <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Maximize size={20} className="text-blue-500" /> Scope</h3>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Linked Devices</label>
                            <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                               {selectedRow3AssetCategory === 'energy' && (
                                  <>
                                     <UnifiedScopeItem label="大廳 電燈電源" icon={<Lightbulb size={16}/>} sub="Power-Node-Lobby" checked={selectedRow3ScopeDevices.includes('r3_p1')} onChange={() => toggleRow3ScopeDevice('r3_p1')} />
                                     <UnifiedScopeItem label="辦公室 電燈電源" icon={<Lightbulb size={16}/>} sub="Power-Node-Office" checked={selectedRow3ScopeDevices.includes('r3_p2')} onChange={() => toggleRow3ScopeDevice('r3_p2')} />
                                  </>
                               )}
                               {selectedRow3AssetCategory === 'camera' && (
                                  <>
                                     <UnifiedScopeItem label="辦公室 攝影機" icon={<Video size={16}/>} sub="Office-Area-1" checked={selectedRow3ScopeDevices.includes('r3_cam1')} onChange={() => toggleRow3ScopeDevice('r3_cam1')} />
                                     <UnifiedScopeItem label="總公司門口 槍型攝影機" icon={<Video size={16}/>} sub="HQ-Main-Entrance" checked={selectedRow3ScopeDevices.includes('r3_cam2')} onChange={() => toggleRow3ScopeDevice('r3_cam2')} />
                                  </>
                               )}
                               {selectedRow3AssetCategory === 'sensor' && (
                                  <div className="text-[10px] text-slate-600 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">請選擇感測分區...</div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Column 3: Row 3 Action */}
                      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center justify-center">
                         <div className="text-center p-6 bg-slate-900/40 border border-slate-800 rounded-3xl w-full">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-4 mx-auto border border-slate-700">
                               <X size={20} />
                            </div>
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">No Further Action Support</h4>
                            <p className="text-[10px] text-slate-600 leading-relaxed italic">
                               當前系統僅支援兩層連動邏輯（Level 3 為最終控制端）。<br/>若需更複雜的排程功能，請洽系統管理員。
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper UI Components (Unified Styles) ---

const DurationSelector: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="flex gap-1">
    {['5s', '10s', '15s'].map(d => (
      <button
        key={d}
        onClick={(e) => { e.preventDefault(); onChange(d); }}
        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black border transition-all ${value === d ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}
      >
        {d}
      </button>
    ))}
  </div>
);

const UnifiedCheckbox: React.FC<{ label: string; desc?: string; checked?: boolean; onChange: () => void; small?: boolean }> = ({ label, desc, checked, onChange, small }) => (
  <label onClick={(e) => { e.preventDefault(); onChange(); }} className={`flex items-center gap-4 ${small ? 'p-2' : 'p-4'} bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-slate-600 cursor-pointer transition-all group`}>
     <div className={`${small ? 'w-5 h-5' : 'w-6 h-6'} border-2 rounded-lg flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-700'}`}>
        {checked && <Check size={small ? 12 : 14} className="text-white animate-in zoom-in duration-200" />}
     </div>
     <div className="flex flex-col min-w-0">
        <span className={`${small ? 'text-xs' : 'text-sm'} font-bold truncate ${checked ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{label}</span>
        {desc && <span className="text-[9px] text-slate-500 font-medium">{desc}</span>}
     </div>
  </label>
);

const UnifiedScopeItem: React.FC<{ label: string; sub: string; icon: React.ReactNode; checked?: boolean; onChange?: () => void; disabled?: boolean }> = ({ label, sub, icon, checked, onChange, disabled }) => (
  <label 
    onClick={!disabled ? (e) => { e.preventDefault(); onChange?.(); } : undefined} 
    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${disabled ? 'bg-slate-800/10 border-slate-800 opacity-40 cursor-not-allowed shadow-none' : 'bg-slate-900/40 border-slate-800 cursor-pointer hover:border-slate-600 hover:bg-slate-800/50 shadow-md'}`}
  >
     <div className="mt-1 relative">
        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${disabled ? 'bg-slate-900 border-slate-700' : (checked ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-700')}`}>
           {checked && !disabled && <Check size={12} className="text-white" />}
        </div>
     </div>
     <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
           <span className={`${disabled ? 'text-slate-600' : (checked ? 'text-blue-400' : 'text-slate-400')}`}>{icon}</span>
           <span className={`text-xs font-bold truncate ${disabled ? 'text-slate-500' : 'text-slate-200'}`}>{label}</span>
        </div>
        <span className={`text-[9px] font-medium ${disabled ? 'text-slate-700' : 'text-slate-500'}`}>{sub}</span>
     </div>
  </label>
);

const NotifyMediumButton: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl border text-[11px] font-black tracking-widest uppercase transition-all ${active ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-slate-900/40 border-slate-800 text-slate-600'}`}>
     {active ? <CheckCircle2 size={16} className="animate-in zoom-in" /> : icon} {label}
  </button>
);

export default EventTab;