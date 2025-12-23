
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
  Power,
  Building2,
  Map as MapIcon,
  Trash2,
  Timer,
  ExternalLink,
  ShieldCheck,
  MousePointer2,
  UserCheck,
  Speaker,
  Lock,
  Eye,
  CheckCircle,
  Monitor,
  HeartPulse
} from 'lucide-react';
import { MOCK_EVENTS, SITE_TREE_DATA } from '../constants';
import { SecurityEvent, SiteNode } from '../types';

type EventSubNavType = 'list' | 'settings';

interface TriggerCondition {
  id: string;
  device: string;
  event: string;
  operator?: string;
  value?: string;
}

interface LinkedDevice {
  id: string;
  type: 'camera' | 'host';
  deviceId: string;
  action: string;
  duration: string;
}

// --- Trigger Logic Constants ---
const TRIGGER_DEVICES = [
  'Epaper按鈕', '環境偵測器', '空間偵測器', '門磁', '讀卡機', 'WDI', 'SOS緊急按鈕', 'PIR', 'IPCam'
];

const DEVICE_EVENTS_MAP: Record<string, string[]> = {
  'Epaper按鈕': ['按鈕觸發(二值)', '開蓋告警(異常)'],
  '環境偵測器': ['亮度偵測(數值)', '溫度偵測(數值)', '濕度偵測(數值)', '水浸告警(二值)', '聲音觸發(二值)', '開蓋告警(異常)'],
  '空間偵測器': ['有人/無人觸發', '人數閾值告警(數值)', '人員進出觸發'],
  '門磁': ['開門觸發(二值)'],
  '讀卡機': ['正常刷卡(行為)', '異常刷卡(異常)'],
  'WDI': ['異常告警', '剪斷告警', '配置錯誤'],
  'SOS緊急按鈕': ['緊急觸發(二值)'],
  'PIR': ['人體感應觸發(二值)'],
  'IPCam': ['人形偵測', '聲音偵測']
};

const VALUE_BASED_EVENTS = ['亮度偵測(數值)', '溫度偵測(數值)', '濕度偵測(數值)', '人數閾值告警(數值)'];
const OPERATORS = ['>', '>=', '<', '<=', '=='];

// --- Action Constants ---
const RECIPIENTS = [
  { id: 'shelby', name: 'Shelby', email: 'Shelby@sks.com.tw' },
  { id: 'campbell', name: 'Campbell', email: 'Campbell@sks.com.tw' },
  { id: 'polly', name: 'Polly', email: 'Polly@sks.com.tw' }
];

const CAMERA_LIST = [
  { id: 'cam_bullet', name: '門口槍型攝影機' },
  { id: 'cam_ptz', name: '大廳擺頭機' },
  { id: 'cam_starlight', name: '倉庫星光攝影機' }
];

const CAMERA_ACTIONS = [
  { id: 'record_on', label: '開啟錄影' },
  { id: 'deterrence', label: '開啟嚇阻功能' }
];

const HOST_ACTIONS = [
  { id: 'warn_prompt', label: '播放警告提示' },
  { id: 'expel_sound', label: '播放驅逐提示音效' }
];

const EventTab: React.FC = () => {
  const [activeSubNav, setActiveSubNav] = useState<EventSubNavType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  
  // --- Create Event Form States ---
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  
  // Area Selection States
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Trigger Logic States
  const [triggerConditions, setTriggerConditions] = useState<TriggerCondition[]>([
    { id: 'initial', device: '', event: '' }
  ]);
  const [durationValue, setDurationValue] = useState<string>('0');

  // Action States (Output Section)
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [selectedNotifyMediums, setSelectedNotifyMediums] = useState<string[]>(['email', 'app']);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['shelby']);
  
  // 多筆連動設備狀態
  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>([
    { id: 'init-link', type: 'camera', deviceId: '', action: 'record_on', duration: '30' }
  ]);

  // --- Data Computation ---
  const sites = useMemo(() => {
    const list: SiteNode[] = [];
    const traverse = (nodes: SiteNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'site') list.push(n);
        if (n.children) traverse(n.children);
      });
    };
    traverse(SITE_TREE_DATA);
    return list;
  }, []);

  const hosts = useMemo(() => {
    if (!selectedSiteId) return [];
    const site = sites.find(s => s.id === selectedSiteId);
    return site?.children || [];
  }, [selectedSiteId, sites]);

  const currentSiteLabel = useMemo(() => sites.find(s => s.id === selectedSiteId)?.label || '', [sites, selectedSiteId]);
  const currentHostLabel = useMemo(() => hosts.find(h => h.id === selectedHostId)?.label || '未選取主機', [hosts, selectedHostId]);
  
  const zones = useMemo(() => {
    if (!selectedHostId) return [];
    const host = hosts.find(h => h.id === selectedHostId);
    return host?.children || [];
  }, [selectedHostId, hosts]);

  const currentZoneLabel = useMemo(() => zones.find(z => z.id === selectedZoneId)?.label || '', [zones, selectedZoneId]);

  // 步驟驗證
  const isStep1Valid = !!selectedZoneId;
  const isStep2Valid = triggerConditions.length > 0 && triggerConditions.every(c => c.device && c.event);
  const isStep3Enabled = isStep1Valid && isStep2Valid;

  // 持續時間邏輯驗證
  const isDurationAllowed = useMemo(() => {
    if (triggerConditions.length !== 1) return false;
    const cond = triggerConditions[0];
    if (cond.device === '讀卡機') return false;
    if (!cond.device || !cond.event) return false;
    return true;
  }, [triggerConditions]);

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

  // --- Handlers ---
  const addCondition = () => {
    setTriggerConditions([...triggerConditions, { id: Date.now().toString(), device: '', event: '' }]);
  };

  const removeCondition = (id: string) => {
    if (triggerConditions.length === 1) return;
    setTriggerConditions(triggerConditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof TriggerCondition, value: string) => {
    setTriggerConditions(prev => prev.map(c => {
      if (c.id === id) {
        const next = { ...c, [field]: value };
        if (field === 'device') next.event = ''; 
        return next;
      }
      return c;
    }));
  };

  const toggleOutput = (output: string) => {
    if (!isStep3Enabled) return;
    setSelectedOutputs(prev => prev.includes(output) ? prev.filter(o => o !== output) : [...prev, output]);
  };

  const toggleNotifyMedium = (medium: string) => {
    setSelectedNotifyMediums(prev => prev.includes(medium) ? prev.filter(m => m !== medium) : [...prev, medium]);
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const addLinkedDevice = () => {
    setLinkedDevices([...linkedDevices, { 
      id: Date.now().toString(), 
      type: 'camera', 
      deviceId: '', 
      action: 'record_on', 
      duration: '30' 
    }]);
  };

  const removeLinkedDevice = (id: string) => {
    if (linkedDevices.length === 1) return;
    setLinkedDevices(linkedDevices.filter(d => d.id !== id));
  };

  const handleDeviceSelection = (id: string, val: string) => {
    if (!val) {
      updateLinkedDevice(id, { deviceId: '', type: 'camera' });
      return;
    }
    const isHost = val === selectedHostId;
    updateLinkedDevice(id, { 
      deviceId: val, 
      type: isHost ? 'host' : 'camera',
      action: isHost ? 'warn_prompt' : 'record_on'
    });
  };

  const updateLinkedDevice = (id: string, updates: Partial<LinkedDevice>) => {
    setLinkedDevices(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

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
                           <td className="px-8 py-6 text-right"><ChevronRight size={18} className="inline text-slate-600 group-hover:text-blue-400"/></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {/* --- 事件詳細資訊頁面 (還原高保真 UI) --- */}
        {activeSubNav === 'list' && viewingEventId && activeEvent && (
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
             {/* Header */}
             <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800 shrink-0">
                <button 
                  onClick={() => setViewingEventId(null)} 
                  className="p-3 bg-[#1e293b] hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all shadow-xl"
                >
                   <ChevronLeft size={24} />
                </button>
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tighter">事件詳細資訊 <span className="text-blue-600">.</span></h1>
                   <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                      <span className="flex items-center gap-1.5 text-blue-500"><MapPin size={14}/> {activeEvent.location}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="flex items-center gap-1.5"><Clock size={14}/> {activeEvent.timestamp}</span>
                   </div>
                </div>
             </div>

             <div className="flex-1 flex gap-8 min-h-0 overflow-hidden pb-12">
                {/* Left Panel: Evidence & Metadata */}
                <div className="w-80 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                   {/* 數位存證證書 */}
                   <div className="bg-[#111827] border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden ring-1 ring-white/5">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl"></div>
                      <div className="flex items-center gap-3 mb-6">
                         <Fingerprint size={20} className="text-blue-500" />
                         <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">數位存證證書</span>
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">數位簽章 (SHA-256)</span>
                            <p className="text-[10px] text-slate-400 font-mono break-all leading-tight tracking-tighter">f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2f7a8b9c0</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">存證節點</span>
                            <p className="text-sm font-black text-slate-200 tracking-tight">SKS_MAIN_HQ_01</p>
                         </div>
                         <div className="pt-4 border-t border-slate-800">
                            <div className="h-1.5 bg-green-500/10 rounded-full overflow-hidden mb-2">
                               <div className="w-full h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                            </div>
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">VERIFIED</span>
                         </div>
                      </div>
                   </div>

                   {/* 元數據摘要 */}
                   <div className="bg-[#111827] border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden ring-1 ring-white/5">
                      <div className="flex items-center gap-3 mb-6">
                         <Info size={18} className="text-blue-500" />
                         <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">元數據摘要</span>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">設備來源</span>
                            <span className="text-slate-200 font-mono">{activeEvent.sensorId || 'SYS-NODE'}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">事件類型</span>
                            <span className="text-blue-400 font-black uppercase">{activeEvent.type.toUpperCase()}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">優先等級</span>
                            <span className="text-red-500 font-black uppercase">CRITICAL</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">狀態</span>
                            <span className="text-green-500 font-black uppercase">UNPROCESSED</span>
                         </div>
                      </div>
                   </div>

                   {/* AI 標籤摘要 (如果是 VLM) */}
                   {activeEvent.type === 'vlm' && activeEvent.vlmData && (
                     <div className="bg-[#111827] border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden ring-1 ring-white/5">
                        <div className="flex items-center gap-3 mb-6">
                           <Cpu size={18} className="text-orange-500" />
                           <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">AI 識標摘要</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <span className="px-3 py-1.5 bg-orange-900/20 text-orange-400 text-[10px] font-black rounded-lg border border-orange-500/30 uppercase tracking-widest">青年</span>
                           <span className="px-3 py-1.5 bg-blue-900/20 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/30 uppercase tracking-widest">男性 (M)</span>
                        </div>
                     </div>
                   )}
                </div>

                {/* Right Panel: Media Viewport */}
                <div className="flex-1 flex flex-col bg-[#0b1121] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                   {activeEvent.message.includes('SOS') ? (
                     <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#0b1121] via-[#1a1111] to-[#0b1121] relative">
                        <div className="relative mb-12">
                           <div className="absolute inset-0 bg-red-500/20 blur-[80px] rounded-full animate-pulse"></div>
                           <div className="w-32 h-32 rounded-[2.5rem] border-4 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)] relative z-10">
                              <AlertTriangle size={64} className="animate-bounce" />
                           </div>
                        </div>
                        <h2 className="text-6xl font-black text-white italic tracking-tighter mb-4">SOS 緊急救助請求</h2>
                        <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">{activeEvent.location}</p>
                        
                        <div className="grid grid-cols-2 gap-6 mt-16 w-full max-w-2xl px-10">
                           <div className="bg-[#111827]/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
                              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-3 block flex items-center gap-2"><Clock size={12}/> 發生時間</span>
                              <div className="text-3xl font-mono font-black text-white">17:15:30</div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">DEC 18, 2025</span>
                           </div>
                           <div className="bg-[#111827]/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
                              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-3 block flex items-center gap-2"><Cpu size={12}/> 來源設備 ID</span>
                              <div className="text-3xl font-mono font-black text-white tracking-tighter uppercase">bt-btn-1</div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">SECURED_LINK_NODE</span>
                           </div>
                        </div>
                        
                        <div className="mt-12 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">HARDWARE LINK VERIFIED • ENCRYPTED PROTOCOL</div>
                     </div>
                   ) : (
                     <div className="flex-1 bg-black relative group/viewer flex flex-col">
                        {/* Video Overlays */}
                        <div className="absolute top-8 left-8 right-8 z-10 pointer-events-none flex justify-between items-start">
                           <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-3 bg-red-600 px-5 py-2 rounded-lg text-[13px] font-black tracking-[0.25em] text-white shadow-2xl">
                                 <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                                 REPLAY
                              </div>
                              <div className="text-[11px] text-white/40 font-mono tracking-tighter bg-black/50 px-4 py-1.5 rounded-lg border border-white/5 uppercase backdrop-blur-md">
                                 NODE_AUTH: PASS_SKS_EVIDENCE
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <div className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                                 {activeEvent.timestamp}<span className="text-2xl opacity-50 ml-1">.483</span>
                              </div>
                              <div className="text-[11px] font-black text-white/40 tracking-[0.5em] uppercase mt-1">CAM_UTC+8_028</div>
                           </div>
                        </div>

                        {/* Main Media Body */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                           <img 
                              src={activeEvent.vlmData?.fullSceneUrl || `https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_1.jpg?raw=true`} 
                              className="w-full h-full object-cover opacity-60" 
                           />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <PlayCircle size={100} className="text-white/20 hover:text-white/40 cursor-pointer transition-all drop-shadow-2xl hover:scale-110" />
                              <div className="absolute bottom-1/2 translate-y-16 text-white/20 font-black text-xs uppercase tracking-[0.4em]">PLAYBACK READY</div>
                           </div>
                        </div>

                        {/* Bottom Metadata Overlays */}
                        <div className="absolute bottom-20 left-8 right-8 z-10 pointer-events-none flex justify-between items-end">
                           <div className="flex gap-10">
                              <div className="flex flex-col">
                                 <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Longitude</span>
                                 <span className="text-base text-white/80 font-mono font-bold">121.5796° E</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Latitude</span>
                                 <span className="text-base text-white/80 font-mono font-bold">25.0629° N</span>
                              </div>
                           </div>
                           <div className="p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer">
                              <Layers size={24} className="text-white/50" />
                           </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-white/10 mx-8 mb-8 relative group/progress cursor-pointer rounded-full overflow-hidden shrink-0">
                           <div className="absolute top-0 left-0 h-full bg-blue-600 w-1/4 shadow-[0_0_20px_rgba(37,99,235,0.8)]"></div>
                           <div className="absolute top-0 left-1/4 h-full bg-blue-400/20 w-1/2"></div>
                        </div>
                     </div>
                   )}

                   {/* Footer Bar */}
                   <div className="h-24 bg-[#111827] border-t border-slate-800 flex items-center justify-between px-10 shrink-0">
                      <div className="flex items-center gap-10">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                               <HeartPulse size={20} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">系統健康度</span>
                               <span className="text-[11px] font-black text-green-500 uppercase">OPTIMAL PERFORMANCE</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                               <Server size={20} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">資料存儲節點</span>
                               <span className="text-[11px] font-black text-blue-300 uppercase">SK-DATA-SEC-B</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <button className="px-10 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-slate-700 shadow-xl flex items-center gap-3">
                            <Download size={18} className="text-blue-400" /> 下載數位存證
                         </button>
                         <button 
                           onClick={() => setViewingEventId(null)}
                           className="px-12 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40"
                         >
                            確認並關閉
                         </button>
                      </div>
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
                   <button 
                     onClick={() => setIsPreviewOpen(true)}
                     className={`px-10 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl ${isStep3Enabled ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                   >
                     Create Rule
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Column 1: 基本資訊與範圍 */}
                <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                   <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Building2 size={20} className="text-blue-500" /> 基本資訊與範圍</h3>
                   <div className="space-y-8 flex-1">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">事件名稱</label>
                         <input type="text" placeholder="例如：機房高溫連動錄影..." value={newEventName} onChange={(e) => setNewEventName(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-base font-bold text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-800 shadow-inner" />
                      </div>
                      <div className="space-y-5">
                         <div className="flex items-center gap-2 mb-2"><MapIcon size={14} className="text-blue-400" /><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">連動區域選擇</label></div>
                         <select value={selectedSiteId} onChange={(e) => { setSelectedSiteId(e.target.value); setSelectedHostId(''); setSelectedZoneId(''); }} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                            <option value="">請選擇據點...</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                         </select>
                         <select value={selectedHostId} disabled={!selectedSiteId} onChange={(e) => { setSelectedHostId(e.target.value); setSelectedZoneId(''); }} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30 appearance-none">
                            <option value="">請選擇主機...</option>
                            {hosts.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                         </select>
                         <select value={selectedZoneId} disabled={!selectedHostId} onChange={(e) => setSelectedZoneId(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30 appearance-none">
                            <option value="">請選擇分區...</option>
                            {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                         </select>
                      </div>
                   </div>
                </div>

                {/* Column 2: 觸發條件邏輯 */}
                <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                   <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Database size={20} className="text-blue-500" /> 觸發條件邏輯</h3>
                   <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
                      {selectedZoneId ? (
                        <>
                          {triggerConditions.map((condition, idx) => (
                            <div key={condition.id} className="p-5 bg-[#050914] border border-slate-800 rounded-3xl relative animate-in zoom-in-95 duration-200 group">
                               {idx > 0 && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10">AND 且</div>}
                               <div className="flex justify-between items-center mb-4">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">條件 {idx + 1}</span>
                                  {triggerConditions.length > 1 && <button onClick={() => removeCondition(condition.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}
                               </div>
                               <div className="space-y-4">
                                  <div className="space-y-1.5">
                                     <span className="text-[10px] font-bold text-slate-600 ml-1">選擇設備類型</span>
                                     <select value={condition.device} onChange={(e) => updateCondition(condition.id, 'device', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500">
                                        <option value="">請選擇設備...</option>
                                        {TRIGGER_DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                                     </select>
                                  </div>
                                  <div className="space-y-1.5">
                                     <span className="text-[10px] font-bold text-slate-600 ml-1">選擇觸發事件</span>
                                     <select value={condition.event} disabled={!condition.device} onChange={(e) => updateCondition(condition.id, 'event', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30">
                                        <option value="">請選擇事件...</option>
                                        {condition.device && DEVICE_EVENTS_MAP[condition.device].map(ev => <option key={ev} value={ev}>{ev}</option>)}
                                     </select>
                                  </div>
                                  {VALUE_BASED_EVENTS.includes(condition.event) && (
                                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                                       <div className="space-y-1.5">
                                          <span className="text-[10px] font-bold text-slate-600 ml-1">運算子</span>
                                          <select value={condition.operator} onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500">
                                             {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                                          </select>
                                       </div>
                                       <div className="space-y-1.5">
                                          <span className="text-[10px] font-bold text-slate-600 ml-1">數值</span>
                                          <input type="text" value={condition.value} onChange={(e) => updateCondition(condition.id, 'value', e.target.value)} placeholder="輸入值..." className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500" />
                                       </div>
                                    </div>
                                  )}
                               </div>
                            </div>
                          ))}
                          <button onClick={addCondition} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 hover:text-blue-400 hover:border-blue-900/30 transition-all flex items-center justify-center gap-2 text-xs font-bold bg-[#050914]/40">
                             <Plus size={16} /> 新增且 (AND) 條件
                          </button>

                          {/* 持續時間設定區塊 */}
                          <div className="pt-8 border-t border-slate-800/50 mt-4">
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[13px] font-bold text-slate-300 flex items-center gap-2">
                                  <Timer size={16} className="text-blue-500" /> 持續時間設定 (選填)
                                </h4>
                                {!isDurationAllowed && (
                                  <div className="px-2 py-0.5 bg-red-900/20 rounded border border-red-900/40 text-red-400 text-[10px] font-bold">不可設定</div>
                                )}
                             </div>

                             <div className={`p-6 bg-[#050914] border rounded-3xl transition-all ${isDurationAllowed ? 'border-slate-800 opacity-100' : 'border-slate-900 opacity-30 grayscale pointer-events-none'}`}>
                                <div className="flex items-center gap-5 mb-6">
                                   <div className="flex-1 h-1 bg-slate-800 rounded-full relative">
                                      <input 
                                        type="range" min="0" max="60" step="5"
                                        value={durationValue} onChange={(e) => setDurationValue(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                      />
                                      <div className="absolute left-0 top-0 h-full bg-blue-600 rounded-full" style={{ width: `${(parseInt(durationValue) / 60) * 100}%` }}></div>
                                      <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl border-4 border-blue-600" style={{ left: `calc(${(parseInt(durationValue) / 60) * 100}% - 8px)` }}></div>
                                   </div>
                                   <div className="w-20 bg-slate-900/50 border border-slate-800 rounded-xl py-2 flex items-center justify-center font-black text-xl text-slate-400 tracking-tighter">
                                      {durationValue}s
                                   </div>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed">
                                   若設定此項，需滿足上方所有條件並「持續維持」該時間長度才會正式觸發事件。
                                </p>
                             </div>
                             
                             <div className="mt-6 space-y-3">
                                <div className="flex items-start gap-3">
                                   <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${triggerConditions.length === 1 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                      {triggerConditions.length === 1 ? <Check size={12}/> : <X size={12}/>}
                                   </div>
                                   <span className={`text-[11px] font-bold ${triggerConditions.length === 1 ? 'text-slate-400' : 'text-slate-500'}`}>僅設定一個觸發條件邏輯才開放選填持續時間</span>
                                </div>
                                <div className="flex items-start gap-3">
                                   <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${triggerConditions[0]?.device !== '讀卡機' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                      {(triggerConditions[0]?.device && triggerConditions[0]?.device !== '讀卡機') || !triggerConditions[0]?.device ? <Check size={12}/> : <X size={12}/>}
                                   </div>
                                   <span className={`text-[11px] font-bold ${triggerConditions[0]?.device !== '讀卡機' ? 'text-slate-400' : 'text-slate-500'}`}>讀卡屬於瞬時事件，不能設定持續時間</span>
                                </div>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/20 border border-dashed border-slate-800 rounded-[2.5rem] opacity-40">
                           <MapIcon size={48} className="text-slate-600 mb-4" />
                           <p className="text-sm font-bold text-slate-500">請先於第一欄位選擇分區</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Column 3: 執行連動與通知設定 */}
                <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                   <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Zap size={20} className="text-blue-500" /> 執行連動與通知設定</h3>
                   
                   <div className="flex-1 flex flex-col min-h-0">
                      {isStep3Enabled ? (
                        <>
                           <div className="grid grid-cols-2 gap-3 mb-8 shrink-0 relative">
                              <button 
                                onClick={() => toggleOutput('notify')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-[10px] font-black tracking-widest uppercase ${selectedOutputs.includes('notify') ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                              >
                                 <CheckCircle2 size={14} className={selectedOutputs.includes('notify') ? 'text-white' : 'text-slate-600'} />
                                 通知
                              </button>
                              <button 
                                onClick={() => toggleOutput('device_link')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-[10px] font-black tracking-widest uppercase ${selectedOutputs.includes('device_link') ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                              >
                                 <CheckCircle2 size={14} className={selectedOutputs.includes('device_link') ? 'text-white' : 'text-slate-600'} />
                                 連動設備
                              </button>
                           </div>

                           <div className="space-y-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1 pb-4">
                              {selectedOutputs.includes('notify') && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Mail size={12} className="text-blue-500" /> 通知媒體</label>
                                      <div className="flex gap-4">
                                         <button onClick={() => toggleNotifyMedium('email')} className={`flex-1 flex items-center justify-center gap-3 py-2.5 rounded-xl border text-[11px] font-black tracking-widest uppercase transition-all ${selectedNotifyMediums.includes('email') ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-[#050914] border-slate-800 text-slate-600'}`}><Mail size={14}/> Email</button>
                                         <button onClick={() => toggleNotifyMedium('app')} className={`flex-1 flex items-center justify-center gap-3 py-2.5 rounded-xl border text-[11px] font-black tracking-widest uppercase transition-all ${selectedNotifyMediums.includes('app') ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-[#050914] border-slate-800 text-slate-600'}`}><Smartphone size={14}/> App</button>
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><UserCheck size={12} className="text-blue-500" /> 通知對象選擇</label>
                                      <div className="space-y-2">
                                         {RECIPIENTS.map(person => (
                                           <button key={person.id} onClick={() => toggleRecipient(person.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedRecipients.includes(person.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#050914] border-slate-800 hover:border-slate-700'}`}>
                                              <div className="flex items-center gap-3">
                                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${selectedRecipients.includes(person.id) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{person.name[0]}</div>
                                                 <div className="text-left"><span className={`block text-xs font-bold ${selectedRecipients.includes(person.id) ? 'text-white' : 'text-slate-400'}`}>{person.name}</span><span className="text-[9px] text-slate-600 font-mono">{person.email}</span></div>
                                              </div>
                                              {selectedRecipients.includes(person.id) && <UserCheck size={14} className="text-blue-500" />}
                                           </button>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                              )}

                              {selectedOutputs.includes('device_link') && (
                                <div className="space-y-6 pt-2 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                   <div className="flex items-center justify-between mb-2">
                                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Zap size={12} className="text-blue-500" /> 連動設備列表</label>
                                   </div>
                                   {linkedDevices.map((ld, index) => (
                                     <div key={ld.id} className="p-4 bg-[#050914] border border-slate-800 rounded-3xl space-y-4 animate-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">連動項 {index + 1}</span>{linkedDevices.length > 1 && <button onClick={() => removeLinkedDevice(ld.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}</div>
                                        <div className="space-y-1.5">
                                           <span className="text-[10px] font-bold text-slate-600 ml-1">選擇設備</span>
                                           <select value={ld.deviceId} onChange={(e) => handleDeviceSelection(ld.id, e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-[11px] font-bold text-slate-300 transition-colors">
                                              <option value="">請選擇設備...</option>
                                              <optgroup label="攝影機類別">{CAMERA_LIST.map(cam => <option key={cam.id} value={cam.id}>{cam.name}</option>)}</optgroup>
                                              <optgroup label="主機類別 (僅限本站)">{selectedHostId && <option value={selectedHostId}>{currentHostLabel}</option>}</optgroup>
                                           </select>
                                        </div>
                                        {ld.deviceId && (
                                          <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                                             <span className="text-[10px] font-bold text-slate-600 ml-1">執行動作</span>
                                             <div className="grid grid-cols-1 gap-2">{(ld.type === 'camera' ? CAMERA_ACTIONS : HOST_ACTIONS).map(act => <button key={act.id} onClick={() => updateLinkedDevice(ld.id, { action: act.id })} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${ld.action === act.id ? 'bg-blue-900/20 border-blue-500' : 'bg-[#111827] border-slate-800'}`}><span className={`text-[11px] font-bold ${ld.action === act.id ? 'text-white' : 'text-slate-500'}`}>{act.label}</span>{ld.action === act.id && <Check size={12} className="text-blue-500"/>}</button>)}</div>
                                          </div>
                                        )}
                                        {ld.type === 'camera' && ld.deviceId && (
                                          <div className="space-y-3 pt-2"><div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-600 ml-1 flex items-center gap-1"><Timer size={10}/> 持續時長</span><span className="text-[10px] font-mono text-blue-400 font-bold">{ld.duration}s</span></div><input type="range" min="5" max="60" step="5" value={ld.duration} onChange={(e) => updateLinkedDevice(ld.id, { duration: e.target.value })} className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-blue-600" /></div>
                                        )}
                                     </div>
                                   ))}
                                   <button onClick={addLinkedDevice} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 hover:text-blue-400 hover:border-blue-900/30 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#050914]/40"><Plus size={16} /> 新增其他連動設備</button>
                                </div>
                              )}
                           </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/20 border border-dashed border-slate-800 rounded-[2.5rem] opacity-40">
                           <div className="relative mb-6">
                              <Bell size={48} className="text-slate-600" />
                              <Lock size={16} className="absolute -bottom-1 -right-1 text-red-500" />
                           </div>
                           <div className="space-y-1.5">
                              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">尚未解鎖設定</p>
                              <p className="text-[10px] text-slate-600 font-medium leading-relaxed">請先完成以下步驟：<br/>1. 選擇分區範圍<br/>2. 設定至少一個觸發條件</p>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* 管理事件列表頁面 */}
        {activeSubNav === 'settings' && !isCreating && (
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-800/50">
                <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-2">管理事件 <span className="text-blue-600">.</span></h1>
                   <p className="text-sm text-slate-500 font-medium">根據個人需求自訂感測器通知與設備連動規則</p>
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
                        <th className="px-8 py-6">事件規則名稱</th>
                        <th className="px-8 py-6">連動範圍 (Scope)</th>
                        <th className="px-8 py-6">觸發邏輯</th>
                        <th className="px-8 py-6">執行動作</th>
                        <th className="px-8 py-6">狀態</th>
                        <th className="px-8 py-6 text-right">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr className="group hover:bg-white/5 transition-all">
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-white">大辦公區高溫告警</span>
                             <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase">ID: RULE_T01</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-xs font-bold text-slate-400">總公司 > 商研中心 > 大辦公區</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className="p-1 bg-orange-900/20 text-orange-400 rounded border border-orange-500/20"><Cpu size={12}/></div>
                             <span className="text-xs text-slate-300">環境偵測器 (溫度 &gt; 35℃)</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex gap-2">
                             <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20" title="Email/App 通知"><Mail size={12}/></div>
                             <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20" title="錄影 (30s)"><Video size={12}/></div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer">
                             <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right"><button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreVertical size={18}/></button></td>
                    </tr>
                    <tr className="group hover:bg-white/5 transition-all">
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-white">SOS 緊急救助連動</span>
                             <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase">ID: RULE_S04</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-xs font-bold text-slate-400">北屯駐區 > 大辦公區</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className="p-1 bg-red-900/20 text-red-400 rounded border border-red-500/20"><AlertTriangle size={12}/></div>
                             <span className="text-xs text-slate-300">SOS緊急按鈕 (觸發)</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex gap-2">
                             <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20" title="通知頻道"><Smartphone size={12}/></div>
                             <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20" title="播放驅逐提示音效"><Speaker size={12}/></div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer">
                             <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right"><button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreVertical size={18}/></button></td>
                    </tr>
                  </tbody>
               </table>
             </div>

             {/* 底部說明區塊 */}
             <div className="bg-[#0b1121] border border-blue-900/30 rounded-[2rem] p-8 shadow-xl flex items-start gap-8 animate-in fade-in duration-700">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40">
                   <Info size={32} />
                </div>
                <div className="space-y-3">
                   <h2 className="text-2xl font-black text-white tracking-tighter">什麼是自訂事件？</h2>
                   <p className="text-base text-slate-400 font-medium leading-relaxed max-w-5xl">
                      自訂事件允許您針對特定的硬體狀態設定通知規則。
                      這些規則獨立於安防中心的設防狀態，無論保全是否開啟，符合條件時系統皆會發送通知。
                   </p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* --- 事件預覽彈窗 --- */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#1e293b] border border-slate-600 rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
              <div className="p-8 border-b border-slate-700 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40"><Eye size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter">事件設定預覽 <span className="text-blue-500">.</span></h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Review your rule before deployment</p>
                    </div>
                 </div>
                 <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-700 rounded-xl text-slate-500 transition-colors"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar max-h-[60vh]">
                 {/* Rule Name & Scope */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest"><Building2 size={12}/> 基本範圍</div>
                    <div className="bg-black/30 p-5 rounded-2xl border border-slate-800 space-y-4">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-bold">事件規則名稱</span>
                          <span className="text-white font-black">{newEventName || '未命名事件'}</span>
                       </div>
                       <div className="flex justify-between items-start text-sm">
                          <span className="text-slate-500 font-bold">部署範圍</span>
                          <span className="text-blue-200 font-bold text-right pl-10 leading-relaxed">{currentSiteLabel} > {currentHostLabel} > {currentZoneLabel}</span>
                       </div>
                    </div>
                 </div>

                 {/* Trigger Logic */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-orange-400 uppercase tracking-widest"><Database size={12}/> 觸發條件</div>
                    <div className="space-y-2">
                       {triggerConditions.map((c, i) => (
                         <div key={c.id} className="bg-black/30 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-black">COND {i+1}</span>
                            <span className="text-slate-100 font-bold">{c.device} : {c.event} {c.operator || ''} {c.value || ''}</span>
                         </div>
                       ))}
                       {isDurationAllowed && parseInt(durationValue) > 0 && (
                          <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/20 text-[11px] flex justify-between items-center px-4">
                             <span className="text-blue-300 font-bold flex items-center gap-2"><Timer size={14}/> 觸發持續時間限制</span>
                             <span className="text-white font-black font-mono">{durationValue}s</span>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Actions / Linkage & Notification (補全內容) */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-green-400 uppercase tracking-widest"><Zap size={12}/> 執行連動與通知</div>
                    <div className="space-y-3">
                       {selectedOutputs.length > 0 ? (
                         <>
                           {selectedOutputs.includes('notify') && (
                             <div className="bg-black/30 p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-500 font-bold flex items-center gap-2"><Mail size={14}/> 通知媒體</span>
                                   <div className="flex gap-2">
                                      {selectedNotifyMediums.map(m => (
                                         <span key={m} className="px-2 py-0.5 bg-blue-900/40 text-blue-400 text-[10px] font-black rounded border border-blue-500/20 uppercase">{m}</span>
                                      ))}
                                   </div>
                                </div>
                                <div className="flex justify-between items-start text-sm border-t border-slate-800 pt-4">
                                   <span className="text-slate-500 font-bold flex items-center gap-2"><UserCheck size={14}/> 通知對象</span>
                                   <span className="text-slate-200 font-bold text-right">{selectedRecipients.map(r => RECIPIENTS.find(p => p.id === r)?.name).join(', ')}</span>
                                </div>
                             </div>
                           )}
                           
                           {selectedOutputs.includes('device_link') && (
                             <div className="space-y-2">
                                {linkedDevices.map((ld, i) => {
                                   const devName = ld.type === 'camera' ? CAMERA_LIST.find(c => c.id === ld.deviceId)?.name : currentHostLabel;
                                   const actName = (ld.type === 'camera' ? CAMERA_ACTIONS : HOST_ACTIONS).find(a => a.id === ld.action)?.label;
                                   return (
                                     <div key={i} className="bg-black/30 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-black uppercase tracking-widest">連動設備 {i+1}</span>
                                        <div className="text-right">
                                           <div className="text-slate-100 font-black">{devName || '未選設備'}</div>
                                           <div className="text-blue-400 font-bold italic mt-0.5 flex items-center justify-end gap-1.5">
                                              {actName} {ld.type === 'camera' && <span>({ld.duration}s)</span>}
                                           </div>
                                        </div>
                                     </div>
                                   );
                                })}
                             </div>
                           )}
                         </>
                       ) : (
                         <div className="bg-black/10 p-6 rounded-2xl border border-dashed border-slate-800 text-center">
                            <span className="text-[11px] text-slate-600 font-black uppercase tracking-widest italic">未設定任何連動與通知動作</span>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-700 bg-black/20 flex gap-4">
                 <button onClick={() => setIsPreviewOpen(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-bold text-sm border border-slate-700">返回修改</button>
                 <button 
                   onClick={() => { setIsPreviewOpen(false); setIsCreating(false); }}
                   className="flex-[1.5] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3"
                 >
                    <CheckCircle size={20}/> 確認並發布規則
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventTab;
