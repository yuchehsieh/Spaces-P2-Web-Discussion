
import React, { useState, useMemo, useEffect } from 'react';
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
  CalendarClock,
  X
} from 'lucide-react';
import { MOCK_EVENTS, SITE_TREE_DATA } from '../constants';
import { SecurityEvent } from '../types';
import EventManagementView from './EventManagementView';
import SecurityScheduleManager from './SecurityScheduleManager';

// 擴充顯示用的事件型別
interface DisplayEvent extends SecurityEvent {
  status: 'unhandled' | 'processing' | 'resolved';
  handler?: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  deviceSource: string;
}

type EventSubNavType = 'list' | 'settings' | 'security-schedule';

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

interface EventTabProps {
  initialSubTab?: EventSubNavType;
}

const EventTab: React.FC<EventTabProps> = ({ initialSubTab = 'list' }) => {
  const [activeSubNav, setActiveSubNav] = useState<EventSubNavType>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);

  // 監聽外部傳入的分頁切換
  useEffect(() => {
    setActiveSubNav(initialSubTab);
  }, [initialSubTab]);

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
            { id: 'settings', label: '情境管理', icon: <Settings2 size={18} />, desc: 'Custom Scenarios' },
            { id: 'security-schedule', label: '保全排程管理', icon: <CalendarClock size={18} />, desc: 'System Scheduling' },
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
             {/* 原始內容不變，如附件所呈現 */}
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

             <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 mb-8 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                   <div className="space-y-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 truncate"><Building2 size={12} className="text-blue-500"/> 所屬據點</label>
                      <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 appearance-none cursor-pointer truncate">
                         <option value="ALL">全部據點...</option>
                         {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2 lg:col-span-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 truncate"><Calendar size={12} className="text-blue-500"/> 時間區段 (含時分秒)</label>
                      <div className="flex items-center gap-2 min-w-0">
                         <input type="datetime-local" step="1" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} className="flex-1 bg-[#050914] border border-slate-700 rounded-xl py-2.5 px-3 text-[10px] text-slate-300 focus:border-blue-500 outline-none" />
                         <span className="text-slate-700 font-black">~</span>
                         <input type="datetime-local" step="1" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} className="flex-1 bg-[#050914] border border-slate-700 rounded-xl py-2.5 px-3 text-[10px] text-slate-300 focus:border-blue-500 outline-none" />
                      </div>
                   </div>
                   <div className="space-y-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 truncate"><UserCheck size={12} className="text-blue-500"/> 處置人員</label>
                      <select value={filterHandler} onChange={(e) => setFilterHandler(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 appearance-none truncate">
                         <option value="ALL">全部人員...</option>
                         {HANDLERS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 truncate"><Activity size={12} className="text-blue-500"/> 報警狀態</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 appearance-none truncate">
                         <option value="ALL">全部狀態...</option>
                         <option value="unhandled">未處理</option>
                         <option value="processing">處理中</option>
                         <option value="resolved">已處理</option>
                      </select>
                   </div>
                   <div className="space-y-2 lg:col-span-1 self-end">
                      <button onClick={() => { setFilterSite('ALL'); setFilterHandler('ALL'); setFilterStatus('ALL'); setStartDateTime(''); setEndDateTime(''); setSearchTerm(''); }} className="w-full py-3 bg-slate-800/40 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700/50 transition-all">重設篩選</button>
                   </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-800">
                   <div className="relative">
                      <input type="text" placeholder="輸入關鍵字進行全文搜尋..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-200 outline-none focus:border-blue-500 transition-all shadow-inner" />
                      <Search size={20} className="absolute left-4 top-3 text-slate-600" />
                   </div>
                </div>
             </div>

             <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-20">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                         <th className="px-8 py-6 w-12 text-center"><button onClick={toggleSelectAll} className="text-slate-600 hover:text-blue-500 transition-colors">{selectedIds.size === filteredEvents.length ? <CheckSquare size={18}/> : <Square size={18}/>}</button></th>
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
                            <tr key={event.id} className={`group hover:bg-white/5 transition-all ${isSelected ? 'bg-blue-500/5' : ''}`}>
                               <td className="px-8 py-6 text-center"><button onClick={() => toggleSelect(event.id)} className={`transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-800 group-hover:text-slate-600'}`}>{isSelected ? <CheckSquare size={18}/> : <Square size={18}/>}</button></td>
                               <td className="px-4 py-6"><div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>{statusStyle.icon} {statusStyle.label}</div></td>
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
                               <td className="px-6 py-6">{event.handler ? (<div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400"><User size={16} /></div><span className="text-xs font-bold text-slate-300">{event.handler}</span></div>) : <span className="text-xs font-medium text-slate-700 italic">未指派</span>}</td>
                               <td className="px-6 py-6"><div className="flex items-center gap-2"><MapPin size={14} className="text-blue-500/50" /><span className="text-sm font-bold text-slate-400">{event.location}</span></div></td>
                               <td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => setViewingEventId(event.id)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">詳情</button><button onClick={() => handleCaseAction('single', event.id)} className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">快速處置</button></div></td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}
        {activeSubNav === 'settings' && <EventManagementView />}
        {activeSubNav === 'security-schedule' && <SecurityScheduleManager />}
      </div>
    </div>
  );
};

export default EventTab;
