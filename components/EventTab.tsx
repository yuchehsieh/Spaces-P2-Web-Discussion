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
  Info,
  Fingerprint,
  Cpu,
  User,
  Filter,
  Calendar,
  Building2,
  Activity,
  UserCheck,
  MoreVertical,
  XCircle,
  RefreshCw,
  CheckSquare,
  Square,
  Trash2,
  ClipboardList,
  UserPlus,
  Forward,
  MessageSquare,
  Shield,
  Maximize,
  ArrowRight,
  X
} from 'lucide-react';
import { MOCK_EVENTS, SITE_TREE_DATA } from '../constants';
import { SecurityEvent } from '../types';
import EventManagementView from './EventManagementView';

// 擴充顯示用的事件型別
interface DisplayEvent extends SecurityEvent {
  status: 'unhandled' | 'processing' | 'resolved';
  handler?: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  deviceSource: string;
}

type EventSubNavType = 'list' | 'settings';

const SITES = ['總公司 (Site)', '新光保全-中山處 (Site)', '新光保全-北屯處 (Site)', '新光保全-大甲處 (Site)'];
const HANDLERS = ['Shelby', 'Campbell', 'Polly', 'Admin'];
const RECIPIENTS = [
  { id: 'shelby', name: 'Shelby', role: '保安主管' },
  { id: 'campbell', name: 'Campbell', role: '據點管理員' },
  { id: 'polly', name: 'Polly', role: '緊急應變小組' }
];

const STATUS_MAP = {
  unhandled: { label: '未處理', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <AlertTriangle size={12}/> },
  processing: { label: '處理中', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: <RefreshCw size={12} className="animate-spin" /> },
  resolved: { label: '已處理', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: <CheckCircle2 size={12}/> }
};

const EventTab: React.FC = () => {
  const [activeSubNav, setActiveSubNav] = useState<EventSubNavType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);

  // 篩選與批次狀態
  const [filterSite, setFilterSite] = useState('ALL');
  const [filterHandler, setFilterHandler] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 處置彈窗狀態
  const [handlingTarget, setHandlingTarget] = useState<'single' | 'batch' | null>(null);
  const [handlingEventId, setHandlingEventId] = useState<string | null>(null);
  const [handleMode, setHandleMode] = useState<'claim' | 'forward' | null>(null);
  const [claimResult, setClaimResult] = useState<'confirmed' | 'false_alarm' | null>(null);
  const [handleNote, setHandleNote] = useState('');
  const [forwardTarget, setForwardTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 模擬數據擴充
  const enrichedEvents = useMemo((): DisplayEvent[] => {
    return MOCK_EVENTS.map((e, idx) => {
      let status: 'unhandled' | 'processing' | 'resolved' = 'unhandled';
      let handler: string | undefined = undefined;
      if (idx === 0) { status = 'resolved'; handler = 'Admin'; }
      else if (idx === 1) { status = 'processing'; handler = 'Shelby'; }
      
      return { 
        ...e, 
        status, 
        handler, 
        priority: e.message.includes('SOS') ? 'CRITICAL' : 'HIGH',
        deviceSource: e.sensorId || 'unknown-dev'
      };
    });
  }, []);

  const filteredEvents = useMemo(() => {
    return enrichedEvents.filter(event => {
      const matchSearch = event.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSite = filterSite === 'ALL' || event.location.includes(filterSite.replace(' (Site)', ''));
      const matchHandler = filterHandler === 'ALL' || event.handler === filterHandler;
      const matchStatus = filterStatus === 'ALL' || event.status === filterStatus;
      return matchSearch && matchSite && matchHandler && matchStatus;
    });
  }, [enrichedEvents, searchTerm, filterSite, filterHandler, filterStatus]);

  const activeEvent = useMemo(() => enrichedEvents.find(e => e.id === viewingEventId), [viewingEventId, enrichedEvents]);
  const handlingEvent = useMemo(() => enrichedEvents.find(e => e.id === handlingEventId), [handlingEventId, enrichedEvents]);

  // 表單驗證邏輯
  const isFormValid = useMemo(() => {
    if (!handleMode) return false;
    if (handleMode === 'claim') {
      return !!claimResult && handleNote.trim().length > 0;
    }
    if (handleMode === 'forward') {
      return !!forwardTarget;
    }
    return false;
  }, [handleMode, claimResult, handleNote, forwardTarget]);

  // 批次選擇邏輯
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredEvents.map(e => e.id)));
  };

  const handleCaseAction = (type: 'single' | 'batch', eventId?: string) => {
    setHandlingTarget(type);
    setHandlingEventId(eventId || null);
    setHandleMode(null);
    setClaimResult(null);
    setHandleNote('');
    setForwardTarget(null);
  };

  const submitHandle = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHandlingTarget(null);
      setHandlingEventId(null);
      setSelectedIds(new Set());
      if (viewingEventId) setViewingEventId(null);
      alert(handleMode === 'claim' ? '已成功認領並處理案件' : '案件已成功轉發');
    }, 1000);
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
            { id: 'list', label: '歷史事件紀錄', icon: <LayoutList size={18} />, desc: 'Logs & History' },
            { id: 'settings', label: '管理事件', icon: <Settings2 size={18} />, desc: 'Custom Rules' },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveSubNav(item.id as EventSubNavType); setViewingEventId(null); }} className={`w-full flex items-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 border ${activeSubNav === item.id ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/50'}`}>
              <div className={`mt-0.5 p-2 rounded-xl ${activeSubNav === item.id ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>{item.icon}</div>
              <div className="text-left"><div className="text-sm font-bold">{item.label}</div><div className="text-[10px] opacity-60">{item.desc}</div></div>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050914] p-10">
        {activeSubNav === 'list' && !viewingEventId && (
          <div className="max-w-[1500px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10 pb-8 border-b border-slate-800/50">
                <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Event Logs <span className="text-blue-600">.</span></h1>
                   <p className="text-sm text-slate-500 font-medium italic">追蹤過往所有感測器與人工觸發之安全事件處置歷程</p>
                </div>
                <div className="flex items-center gap-3">
                   <button className="px-6 py-3 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 hover:bg-slate-800">
                      <Download size={16} className="text-blue-400" /> 匯出日誌
                   </button>
                </div>
             </div>

             {/* 核心篩選控制區 (包含精確到秒的時間區段篩選) */}
             <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 mb-8 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                   <div className="space-y-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building2 size={12} className="text-blue-500"/> 所屬據點</label>
                      <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 appearance-none cursor-pointer">
                         <option value="ALL">全部據點...</option>
                         {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2 lg:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} className="text-blue-500"/> 事件查詢時間區段 (含時分秒)</label>
                      <div className="flex items-center gap-2">
                         <div className="relative flex-1 group/dt">
                           <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white pointer-events-none shadow-lg shadow-blue-900/40 group-hover/dt:scale-110 transition-transform">
                             <Calendar size={14} strokeWidth={3}/>
                           </div>
                           <input 
                             type="datetime-local" 
                             step="1"
                             value={startDateTime} 
                             onChange={e => setStartDateTime(e.target.value)} 
                             className="w-full bg-[#050914] border border-slate-700 rounded-xl py-2.5 pl-14 pr-4 text-xs text-slate-300 focus:border-blue-500 outline-none transition-all hover:border-slate-500 custom-datetime-input" 
                           />
                         </div>
                         <span className="text-slate-700 font-black px-1 opacity-50">~</span>
                         <div className="relative flex-1 group/dt">
                           <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white pointer-events-none shadow-lg shadow-blue-900/40 group-hover/dt:scale-110 transition-transform">
                             <Calendar size={14} strokeWidth={3}/>
                           </div>
                           <input 
                             type="datetime-local" 
                             step="1"
                             value={endDateTime} 
                             onChange={e => setEndDateTime(e.target.value)} 
                             className="w-full bg-[#050914] border border-slate-700 rounded-xl py-2.5 pl-14 pr-4 text-xs text-slate-300 focus:border-blue-500 outline-none transition-all hover:border-slate-500 custom-datetime-input" 
                           />
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCheck size={12} className="text-blue-500"/> 處置人員</label>
                      <select value={filterHandler} onChange={(e) => setFilterHandler(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 appearance-none">
                         <option value="ALL">全部人員...</option>
                         {HANDLERS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="text-blue-500"/> 報警狀態</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 appearance-none">
                         <option value="ALL">全部狀態...</option>
                         <option value="unhandled">未處理</option>
                         <option value="processing">處理中</option>
                         <option value="resolved">已處理</option>
                      </select>
                   </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-4">
                   <div className="relative flex-1">
                      <input type="text" placeholder="關鍵字搜尋..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-blue-500 transition-all" />
                      <Search size={18} className="absolute left-3.5 top-3 text-slate-600" />
                   </div>
                </div>
             </div>

             {/* 批次操作列 */}
             {selectedIds.size > 0 && (
                <div className="mb-6 p-4 bg-blue-600 rounded-2xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center gap-4 ml-2">
                      <div className="p-2 bg-white/20 rounded-lg text-white"><ClipboardList size={20}/></div>
                      <span className="text-sm font-black text-white tracking-widest uppercase">已選取 {selectedIds.size} 件異常事件</span>
                   </div>
                   <button onClick={() => handleCaseAction('batch')} className="px-8 py-2.5 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-black/20 active:scale-95 transition-all">批次處置案件</button>
                </div>
             )}

             {/* 事件列表表格 */}
             <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-20">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                         <th className="px-8 py-6 w-12 text-center">
                            <button onClick={toggleSelectAll} className="text-slate-600 hover:text-blue-500 transition-colors">
                               {selectedIds.size === filteredEvents.length ? <CheckSquare size={18}/> : <Square size={18}/>}
                            </button>
                         </th>
                         <th className="px-4 py-6 w-32">狀態</th>
                         <th className="px-6 py-6">事件時間</th>
                         <th className="px-6 py-6">事件明細</th>
                         <th className="px-6 py-6">處理人</th>
                         <th className="px-6 py-6">位置範圍</th>
                         <th className="px-8 py-6 text-right">操作選項</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/50">
                      {filteredEvents.map(event => {
                         const statusStyle = STATUS_MAP[event.status];
                         const isSelected = selectedIds.has(event.id);
                         return (
                            <tr key={event.id} className={`group hover:bg-white/5 transition-all cursor-default ${isSelected ? 'bg-blue-500/5' : ''}`}>
                               <td className="px-8 py-6 text-center">
                                  <button onClick={() => toggleSelect(event.id)} className={`transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-800 group-hover:text-slate-600'}`}>
                                     {isSelected ? <CheckSquare size={18}/> : <Square size={18}/>}
                                  </button>
                               </td>
                               <td className="px-4 py-6">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                                     {statusStyle.icon} {statusStyle.label}
                                  </div>
                               </td>
                               <td className="px-6 py-6"><div className="flex flex-col"><span className="text-sm font-black text-slate-100 font-mono">{event.timestamp}</span><span className="text-[9px] text-slate-600 font-bold uppercase">2025-12-18</span></div></td>
                               <td className="px-6 py-6">
                                  <div className="flex flex-col gap-1">
                                     <span className="text-sm font-bold text-slate-100 leading-tight">{event.message}</span>
                                     <div className="flex gap-2">
                                        {event.linkedSensorId && <span className="px-2 py-0.5 bg-orange-900/20 border border-orange-500/30 rounded text-[9px] font-black text-orange-400 uppercase">LINKED</span>}
                                        {event.priority === 'CRITICAL' && <span className="px-2 py-0.5 bg-red-900/20 border border-red-500/30 rounded text-[9px] font-black text-red-500 uppercase">CRITICAL</span>}
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-6">
                                  {event.handler ? (
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400"><User size={16} /></div><span className="text-xs font-bold text-slate-300">{event.handler}</span></div>
                                  ) : <span className="text-xs font-medium text-slate-700 italic">未指派</span>}
                               </td>
                               <td className="px-6 py-6"><div className="flex items-center gap-2"><MapPin size={14} className="text-blue-500/50" /><span className="text-sm font-bold text-slate-400">{event.location}</span></div></td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                     <button onClick={() => { setViewingEventId(event.id); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">詳情</button>
                                     <button onClick={() => { handleCaseAction('single', event.id); }} className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">快速處置</button>
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

        {/* 事件中心詳情頁面 */}
        {activeSubNav === 'list' && viewingEventId && activeEvent && (
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setViewingEventId(null)} className="p-3 bg-[#1e293b] hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 shadow-xl transition-all"><ChevronLeft size={24} /></button>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">事件詳細資訊 <span className="text-blue-600">.</span></h1>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-black tracking-widest uppercase mt-1">
                        <span className="flex items-center gap-1.5 text-blue-500"><MapPin size={14}/> {activeEvent.location}</span>
                        <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                        <span className="flex items-center gap-1.5"><Clock size={14}/> 2025-12-18 {activeEvent.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                   <button className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <Download size={18} className="text-blue-400"/> 下載數位存證
                   </button>
                   <button onClick={() => handleCaseAction('single', activeEvent.id)} className="px-10 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-900/40 active:scale-95 flex items-center gap-2">
                      <ClipboardList size={18}/> 處置案件任務
                   </button>
                </div>
             </div>

             <div className="flex-1 flex gap-8 min-h-0 overflow-hidden pb-12">
                <div className="w-80 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                   <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden ring-1 ring-white/5">
                      <div className="flex items-center gap-3 mb-6"><Fingerprint size={20} className="text-blue-500" /><span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">數位存證證書</span></div>
                      <div className="space-y-4">
                         <div className="space-y-1"><span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">數位簽章 (SHA-256)</span><p className="text-[10px] text-slate-400 font-mono break-all leading-tight">f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2f7a8b9c0</p></div>
                         <div className="space-y-1"><span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">存證節點</span><p className="text-sm font-black text-slate-200 tracking-tight">SKS_MAIN_HQ_01</p></div>
                         <div className="pt-4 border-t border-slate-800"><div className="h-1.5 bg-green-500/10 rounded-full overflow-hidden mb-2"><div className="w-full h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div></div><span className="text-[10px] font-black text-green-500 uppercase tracking-widest">VERIFIED</span></div>
                      </div>
                   </div>

                   <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-6 shadow-xl relative ring-1 ring-white/5">
                      <div className="flex items-center gap-3 mb-6"><Info size={20} className="text-blue-500" /><span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">元數據摘要</span></div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 uppercase font-black">設備來源</span><span className="text-xs font-mono font-bold text-slate-200">{activeEvent.deviceSource}</span></div>
                         <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 uppercase font-black">事件類型</span><span className="text-xs font-black text-blue-400 uppercase">{activeEvent.type === 'vlm' ? 'VLM' : 'ALERT'}</span></div>
                         <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 uppercase font-black">優先等級</span><span className={`text-xs font-black ${activeEvent.priority === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`}>{activeEvent.priority}</span></div>
                         <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 uppercase font-black">狀態</span><span className="text-[10px] font-black px-2 py-0.5 rounded bg-green-900/20 text-green-500 border border-green-500/30 uppercase tracking-tighter">{activeEvent.status.toUpperCase()}</span></div>
                      </div>
                   </div>

                   {activeEvent.type === 'vlm' && activeEvent.vlmData && (
                     <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-6 shadow-xl relative ring-1 ring-white/5">
                        <div className="flex items-center gap-3 mb-6"><Cpu size={20} className="text-orange-500" /><span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">AI 識標摘要</span></div>
                        <div className="flex flex-wrap gap-2">
                           {activeEvent.vlmData.features.map(f => (
                             <span key={f} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-black rounded-xl">{f}</span>
                           ))}
                           {activeEvent.vlmData.gender && (
                             <span className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black rounded-xl uppercase">男性 (M)</span>
                           )}
                        </div>
                     </div>
                   )}
                </div>

                <div className="flex-1 flex flex-col bg-[#0b1121] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                   <div className="flex-1 bg-black relative group/viewer flex items-center justify-center">
                      <div className="absolute top-8 left-8 z-10 flex flex-col gap-3 pointer-events-none">
                         <div className="flex items-center gap-3 bg-red-600 px-5 py-2 rounded-lg text-[13px] font-black tracking-[0.25em] text-white shadow-2xl">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div> REPLAY
                         </div>
                         <div className="text-[10px] text-white/40 font-mono tracking-tighter bg-black/50 px-4 py-1.5 rounded-lg border border-white/5 uppercase backdrop-blur-md">NODE_AUTH: PASS_SKS_EVIDENCE</div>
                      </div>
                      
                      <div className="absolute top-8 right-8 z-10 flex flex-col items-end gap-1 pointer-events-none">
                         <div className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                            {activeEvent.timestamp}<span className="text-2xl opacity-50 ml-1">.483</span>
                         </div>
                         <div className="text-[10px] font-black text-white/40 tracking-[0.5em] uppercase">CAM_UTC+8_028</div>
                      </div>

                      {activeEvent.message.includes('SOS') ? (
                        <div className="flex flex-col items-center gap-8">
                           <div className="w-32 h-32 rounded-3xl bg-red-600/10 border-4 border-red-600 flex items-center justify-center text-red-600 shadow-[0_0_100px_rgba(220,38,38,0.3)] animate-pulse">
                              <AlertTriangle size={64} />
                           </div>
                           <div className="text-center">
                              <h2 className="text-5xl font-black text-white italic tracking-tighter mb-4">SOS 緊急救助請求</h2>
                              <p className="text-xl font-bold text-slate-500">{activeEvent.location}</p>
                           </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                           <img src={activeEvent.vlmData?.fullSceneUrl || 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_1.jpg?raw=true'} className="max-w-full max-h-full object-contain opacity-70" />
                           <PlayCircle size={100} className="text-white/20 hover:text-white/50 cursor-pointer transition-all drop-shadow-2xl absolute" />
                        </div>
                      )}

                      <div className="absolute bottom-12 left-8 flex gap-8 pointer-events-none">
                         <div className="flex flex-col"><span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Longitude</span><span className="text-sm text-white/80 font-mono font-bold">121.5796° E</span></div>
                         <div className="flex flex-col"><span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Latitude</span><span className="text-sm text-white/80 font-mono font-bold">25.0629° N</span></div>
                      </div>
                      <div className="absolute bottom-12 right-8 p-3 bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl pointer-events-auto cursor-pointer"><Layers size={20} className="text-white/50" /></div>
                   </div>

                   <div className="h-1 bg-white/10 mx-8 mb-8 relative rounded-full overflow-hidden shrink-0">
                      <div className="absolute top-0 left-0 h-full bg-blue-600 w-1/3 shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
                   </div>

                   <div className="h-20 bg-[#111827] border-t border-slate-800 flex items-center justify-end px-10 shrink-0 gap-5">
                      <button onClick={() => setViewingEventId(null)} className="px-12 py-3 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-2xl transition-all font-black text-xs uppercase tracking-widest">確認並關閉</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeSubNav === 'settings' && <EventManagementView />}
      </div>

      {/* 處置案件彈窗 (遵循認領/轉發邏輯) */}
      {handlingTarget && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40"><CheckCircle2 size={28} /></div>
                    <div><h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">處置案件任務</h2><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{handlingTarget === 'batch' ? `批次處理 ${selectedIds.size} 件案件` : `單件處置: ${handlingEvent?.message || '未知案件'}`}</p></div>
                 </div>
                 <button onClick={() => { setHandlingTarget(null); setHandlingEventId(null); }} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all"><X size={28} /></button>
              </div>
              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setHandleMode('claim')} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${handleMode === 'claim' ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}><UserCheck size={28} /><div className="text-center"><span className="block text-sm font-black uppercase tracking-widest">案件認領</span><span className="text-[9px] opacity-60">由我親自處置</span></div></button>
                    <button onClick={() => setHandleMode('forward')} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${handleMode === 'forward' ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}><Forward size={28} /><div className="text-center"><span className="block text-sm font-black uppercase tracking-widest">案件轉發</span><span className="text-[9px] opacity-60">委派專人處理</span></div></button>
                 </div>
                 {handleMode === 'claim' && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                       <div className="space-y-4"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Shield size={14} className="text-blue-500" /> 處理結果判定</label><div className="grid grid-cols-2 gap-3"><button onClick={() => setClaimResult('confirmed')} className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${claimResult === 'confirmed' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>確認為警報</button><button onClick={() => setClaimResult('false_alarm')} className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${claimResult === 'false_alarm' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>確認為誤報</button></div></div>
                       <div className="space-y-3"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14} className="text-blue-500" /> 處置內容說明</label><textarea value={handleNote} onChange={(e) => setHandleNote(e.target.value)} placeholder="請輸入處置備註（必填）..." className="w-full h-32 bg-black/40 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:border-blue-500 resize-none shadow-inner transition-all" /></div>
                    </div>
                 )}
                 {handleMode === 'forward' && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><UserPlus size={14} className="text-purple-500" /> 選擇轉發對象</label>
                       <div className="space-y-2">{RECIPIENTS.map(p => (<button key={p.id} onClick={() => setForwardTarget(p.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${forwardTarget === p.id ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80'}`}><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${forwardTarget === p.id ? 'bg-purple-600' : 'bg-slate-800'}`}>{p.name[0]}</div><div className="text-left"><span className="block text-sm font-bold">{p.name}</span><span className="text-[10px] font-bold uppercase tracking-tighter">{p.role}</span></div></div>{forwardTarget === p.id && <CheckCircle2 size={18} className="text-purple-500" />}</button>))}</div>
                    </div>
                 )}
              </div>
              
              {/* 底部按鈕：僅在 handleMode 有值時顯示 */}
              {handleMode && (
                <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end gap-5 animate-in slide-in-from-bottom-2 duration-300">
                   <button onClick={() => { setHandlingTarget(null); setHandlingEventId(null); }} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-black text-sm border border-slate-700 uppercase tracking-widest">取消任務</button>
                   <button 
                      onClick={submitHandle} 
                      disabled={isSubmitting || !isFormValid} 
                      className={`px-14 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3 
                        ${!isFormValid ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' : (handleMode === 'claim' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40')}`}
                   >
                      {isSubmitting ? <><RefreshCw className="animate-spin" size={20}/> 提交中</> : <><CheckCircle2 size={20} /> 完成處置提交</>}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}
      <style>{`
        .custom-datetime-input::-webkit-calendar-picker-indicator {
           filter: invert(1);
           cursor: pointer;
           opacity: 0.8;
        }
        .custom-datetime-input::-webkit-calendar-picker-indicator:hover {
           opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default EventTab;