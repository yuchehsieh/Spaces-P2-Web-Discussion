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
  X,
  Image as ImageIcon,
  Monitor
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

interface ModalMetadata {
  url: string;
  title: string;
  type: 'image' | 'video' | 'face';
  location: string;
  timestamp: string;
  event: SecurityEvent;
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
  
  // 詳情視窗與處置視窗狀態
  const [modalContent, setModalContent] = useState<ModalMetadata | null>(null);
  const [handlingTarget, setHandlingTarget] = useState<'single' | 'batch' | null>(null);
  const [handlingEvents, setHandlingEvents] = useState<DisplayEvent[]>([]);
  
  const [handleMode, setHandleMode] = useState<'claim' | 'forward' | null>(null);
  const [claimResult, setClaimResult] = useState<'confirmed' | 'false_alarm' | null>(null);
  const [handleNote, setHandleNote] = useState('');
  const [forwardTarget, setForwardTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 篩選與批次狀態
  const [filterSite, setFilterSite] = useState('ALL');
  const [filterHandler, setFilterHandler] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { setActiveSubNav(initialSubTab); }, [initialSubTab]);

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

  const isFormValid = useMemo(() => {
    if (!handleMode) return false;
    if (handleMode === 'claim') return !!claimResult && handleNote.trim().length > 0;
    if (handleMode === 'forward') return !!forwardTarget;
    return false;
  }, [handleMode, claimResult, handleNote, forwardTarget]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredEvents.map(e => e.id)));
  };

  const openDetails = (event: DisplayEvent) => {
    const isVlm = event.type === 'vlm';
    const isSos = event.message.toUpperCase().includes('SOS');
    // 如果是 SOS 事件，就不提供 captureUrl
    const captureUrl = isSos ? '' : (isVlm ? event.vlmData?.captureUrl : `https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_${Math.floor(Math.random()*4)+1}.jpg?raw=true`);
    
    setModalContent({
      url: captureUrl || '',
      title: isVlm ? "AI 人臉特寫存證" : event.message,
      type: isVlm ? 'face' : 'video',
      location: event.location,
      timestamp: event.timestamp,
      event: event
    });
  };

  const handleCaseAction = (type: 'single' | 'batch', eventId?: string) => {
    let targets: DisplayEvent[] = [];
    if (type === 'single' && eventId) {
      const e = enrichedEvents.find(x => x.id === eventId);
      if (e) targets = [e];
    } else if (type === 'batch') {
      targets = enrichedEvents.filter(x => selectedIds.has(x.id));
    }

    if (targets.length === 0) return;

    setHandlingTarget(type);
    setHandlingEvents(targets);
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
      setHandlingEvents([]);
      setSelectedIds(new Set());
      setModalContent(null);
    }, 1000);
  };

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden relative">
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
            <button key={item.id} onClick={() => { setActiveSubNav(item.id as EventSubNavType); setModalContent(null); }} className={`w-full flex items-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 border ${activeSubNav === item.id ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/50'}`}>
              <div className={`mt-0.5 p-2 rounded-xl ${activeSubNav === item.id ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>{item.icon}</div>
              <div className="text-left"><div className="text-sm font-bold">{item.label}</div><div className="text-[10px] opacity-60">{item.desc}</div></div>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050914] p-10">
        {activeSubNav === 'list' && (
          <div className="max-w-[1500px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10 pb-8 border-b border-slate-800/50">
                <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Event Logs <span className="text-blue-600">.</span></h1>
                   <p className="text-sm text-slate-500 font-medium italic">追蹤過往所有感測器與人工觸發之安全事件處置歷程</p>
                </div>
                <div className="flex items-center gap-3">
                   {selectedIds.size > 0 && (
                      <button onClick={() => handleCaseAction('batch')} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-3 shadow-xl shadow-red-900/40 animate-in zoom-in-95">
                         <ClipboardList size={18}/> 批量處置案件 ({selectedIds.size})
                      </button>
                   )}
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
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 truncate"><Calendar size={12} className="text-blue-500"/> 時間區段</label>
                      <div className="flex items-center gap-2">
                         <input type="datetime-local" step="1" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} className="flex-1 bg-[#050914] border border-slate-700 rounded-xl py-2.5 px-3 text-[10px] font-bold text-slate-300 outline-none [color-scheme:dark]" />
                         <span className="text-slate-700 font-black">~</span>
                         <input type="datetime-local" step="1" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} className="flex-1 bg-[#050914] border border-slate-700 rounded-xl py-2.5 px-3 text-[10px] font-bold text-slate-300 outline-none [color-scheme:dark]" />
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
                         <th className="px-8 py-6 w-12 text-center"><button onClick={toggleSelectAll} className="text-slate-600 hover:text-blue-500 transition-colors">{selectedIds.size === filteredEvents.length && filteredEvents.length > 0 ? <CheckSquare size={18}/> : <Square size={18}/>}</button></th>
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
                               <td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => openDetails(event)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">詳情</button><button onClick={() => handleCaseAction('single', event.id)} className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">快速處置</button></div></td>
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

      {/* 處置案件彈窗 - 與安防中心一致 */}
      {handlingTarget && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40">
                       <CheckCircle2 size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{handlingTarget === 'batch' ? '批量處置案件任務' : '處置案件任務'}</h2>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                          {handlingTarget === 'batch' ? `Targeting ${handlingEvents.length} selected events` : `Incident: ${handlingEvents[0]?.message}`}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setHandlingTarget(null)} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all"><X size={28} /></button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setHandleMode('claim')} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${handleMode === 'claim' ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                       <UserCheck size={28} /><div className="text-center"><span className="block text-sm font-black uppercase tracking-widest">案件認領</span><span className="text-[9px] opacity-60">由我親自處置</span></div>
                    </button>
                    <button onClick={() => setHandleMode('forward')} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${handleMode === 'forward' ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                       <Forward size={28} /><div className="text-center"><span className="block text-sm font-black uppercase tracking-widest">案件轉發</span><span className="text-[9px] opacity-60">委派專人處理</span></div>
                    </button>
                 </div>

                 {handleMode === 'claim' && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Shield size={14} className="text-blue-500" /> 處理結果判定</label>
                          <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => setClaimResult('confirmed')} className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${claimResult === 'confirmed' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}>確認為警報 (Alarm)</button>
                             <button onClick={() => setClaimResult('false_alarm')} className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${claimResult === 'false_alarm' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}>確認為誤報 (False)</button>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14} className="text-blue-500" /> 處置內容說明</label>
                          <textarea value={handleNote} onChange={(e) => setHandleNote(e.target.value)} placeholder="請輸入案件詳細處置狀況或備註事項..." className="w-full h-32 bg-black/40 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner" />
                       </div>
                    </div>
                 )}

                 {handleMode === 'forward' && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><UserPlus size={14} className="text-purple-500" /> 選擇轉發對象</label>
                       <div className="space-y-2">
                          {RECIPIENTS.map(person => (
                             <button key={person.id} onClick={() => setForwardTarget(person.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${forwardTarget === person.id ? 'bg-purple-600/10 border-purple-500 shadow-xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                                <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${forwardTarget === person.id ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{person.name[0]}</div><div className="text-left"><span className={`block text-sm font-bold ${forwardTarget === person.id ? 'text-white' : 'text-slate-300'}`}>{person.name}</span><span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{person.role}</span></div></div>
                                {forwardTarget === person.id ? <CheckCircle2 size={18} className="text-purple-500" /> : <ChevronRight size={18} className="text-slate-700" />}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              {handleMode && (
                <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end gap-5 shrink-0">
                   <button onClick={() => setHandlingTarget(null)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-black text-sm border border-slate-700 uppercase tracking-widest">取消任務</button>
                   <button onClick={submitHandle} disabled={!isFormValid || isSubmitting} className={`px-14 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3 ${!isFormValid || isSubmitting ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' : handleMode === 'claim' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'}`}>
                      {isSubmitting ? <><RefreshCw className="animate-spin" size={20}/> 提交中</> : <><CheckCircle2 size={20} /> 完成處置提交</>}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* 詳情放大彈窗 - 與安防中心一致 */}
      {modalContent && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-10 animate-in fade-in duration-300">
           <div className="relative max-w-7xl w-full bg-[#111827] border border-slate-800 rounded-2xl shadow-[0_0_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[90vh] ring-1 ring-white/5">
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-[#0f172a] shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">{modalContent.type === 'video' ? <Monitor className="text-blue-400" size={28} /> : <ImageIcon className="text-orange-400" size={28} />}</div>
                    <div><h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">{modalContent.title}</h3><div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold tracking-widest uppercase mt-1"><span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500"/>{modalContent.location}</span><span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span><span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500"/>2025-12-18 {modalContent.timestamp}</span></div></div>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const eventId = modalContent.event.id;
                        setModalContent(null); // 先關閉詳情視窗
                        handleCaseAction('single', eventId); // 再開啟處置流程
                      }} 
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-900/20 flex items-center gap-2.5 transition-all active:scale-95"
                    >
                      <ClipboardList size={16}/> 處置案件
                    </button>
                    <button onClick={() => setModalContent(null)} className="p-3 hover:bg-red-500/20 rounded-2xl text-slate-500 hover:text-red-500 transition-all"><X size={32} /></button>
                 </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                <div className="w-72 bg-[#0b1121] border-r border-slate-800/50 p-6 flex flex-col gap-10 overflow-y-auto custom-scrollbar shrink-0">
                   <div className="space-y-5"><div className="flex items-center gap-3 text-slate-400"><Fingerprint size={18} className="text-blue-500" /><h4 className="text-[11px] font-black uppercase tracking-widest">數位存證證書</h4></div><div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-4"><div className="space-y-1"><span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">數位簽章 (SHA-256)</span><p className="text-[10px] text-slate-400 font-mono break-all leading-tight">f7a8b9c0d1e2f3a4b5c6d7e8f9a0b...</p></div><div className="space-y-1"><span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">存證節點</span><p className="text-[11px] text-slate-300 font-black">SKS_MAIN_HQ_01</p></div><div className="pt-2"><div className="h-1.5 bg-green-500/10 rounded-full overflow-hidden mb-2"><div className="w-full h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div></div><span className="text-[10px] font-black text-green-500 uppercase tracking-widest">VERIFIED</span></div></div></div>
                   <div className="space-y-5"><div className="flex items-center gap-3 text-slate-400"><Info size={18} className="text-blue-500" /><h4 className="text-[11px] font-black uppercase tracking-widest">回放細節</h4></div><div className="space-y-4 px-1"><div className="flex justify-between items-center text-[11px] font-bold"><span className="text-slate-600 uppercase tracking-widest">設備標籤</span><span className="text-slate-200 font-mono">{modalContent.event.sensorId || 'CAM-NODE-01'}</span></div><div className="flex justify-between items-center text-[11px] font-bold"><span className="text-slate-600 uppercase tracking-widest">解析度</span><span className="text-slate-200">1920x1080</span></div><div className="flex justify-between items-center text-[11px] font-bold"><span className="text-slate-600 uppercase tracking-widest">幀率</span><span className="text-slate-200">60 FPS</span></div><div className="flex justify-between items-center text-[11px] font-bold"><span className="text-slate-600 uppercase tracking-widest">回放長度</span><span className="text-blue-400 font-mono">00:15 / 02:00</span></div></div></div>
                </div>
                <div className="flex-1 bg-black flex flex-col relative group/viewer">
                   <div className="absolute top-8 left-8 right-8 z-10 pointer-events-none flex justify-between items-start">
                      <div className="flex flex-col gap-3"><div className="flex items-center gap-3 bg-red-600 px-5 py-2 rounded-lg text-[13px] font-black tracking-[0.25em] text-white shadow-2xl"><div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>REPLAY</div></div>
                      <div className="flex flex-col items-end gap-1"><div className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">{modalContent.timestamp}<span className="text-2xl opacity-50 ml-1">.483</span></div></div>
                   </div>
                   <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                      {/* 若為 SOS 事件且無影像 URL，則顯示專屬警示圖示 */}
                      {modalContent.event.message.toUpperCase().includes('SOS') && !modalContent.url ? (
                        <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                           <div className="w-48 h-48 bg-red-600/10 rounded-full flex items-center justify-center border-4 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                              <Bell size={80} className="text-red-500 animate-bounce" />
                           </div>
                           <div className="text-center space-y-2">
                              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">SOS 訊號觸發中</h3>
                              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-relaxed">此設備尚未關聯即時影像頻道<br/>請優先派員前往現場或查看鄰近攝影機</p>
                           </div>
                        </div>
                      ) : (
                        <>
                           <img src={modalContent.url} className={`max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(37,99,235,0.1)] transition-opacity duration-700 ${modalContent.type === 'face' ? 'w-2/3 scale-110' : 'w-full'}`} />
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-500/5">
                              <PlayCircle size={100} className="text-white/20 hover:text-white/40 cursor-pointer transition-all drop-shadow-2xl" />
                           </div>
                        </>
                      )}
                   </div>
                </div>
              </div>
              <div className="p-8 border-t border-slate-800 flex justify-end items-center bg-[#0b1121] shrink-0">
                 <div className="flex gap-5">
                    <button className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-black text-sm border border-slate-700 flex items-center justify-center gap-4 group shadow-xl uppercase tracking-widest"><Download size={22} className="text-blue-400" /> 下載數位存證</button>
                    <button onClick={() => setModalContent(null)} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-sm shadow-2xl uppercase tracking-widest">確認並關閉</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventTab;