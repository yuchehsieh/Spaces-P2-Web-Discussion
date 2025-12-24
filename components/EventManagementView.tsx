import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  Building2, 
  Map as MapIcon, 
  Database, 
  Trash2, 
  Zap, 
  Mail, 
  Smartphone, 
  UserCheck, 
  Timer, 
  Check, 
  X, 
  Eye, 
  CheckCircle,
  Cpu,
  Video,
  Speaker,
  MoreVertical,
  CheckCircle2,
  Bell,
  Clock,
  Info,
  LayoutList,
  AlertTriangle
} from 'lucide-react';
import { SITE_TREE_DATA } from '../constants';
import { SiteNode } from '../types';

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

// --- Constants ---
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

const RECIPIENTS = [
  { id: 'shelby', name: 'Shelby', email: 'shelby@sks.com.tw' },
  { id: 'campbell', name: 'Campbell', email: 'campbell@sks.com.tw' },
  { id: 'polly', name: 'Polly', email: 'polly@sks.com.tw' }
];

const CAMERA_LIST = [
  { id: 'cam_bullet', name: '門口槍型攝影機' },
  { id: 'cam_ptz', name: '大廳擺頭機' },
  { id: 'cam_starlight', name: '倉庫星光攝影機' }
];

const CAMERA_ACTIONS = [
  { id: 'record_on', label: '開啟錄影功能' },
  { id: 'deterrence', label: '開啟嚇阻功能' }
];

const HOST_ACTIONS = [
  { id: 'warn_prompt', label: '播放警告提示' },
  { id: 'expel_sound', label: '播放驅逐音效' }
];

const EventManagementView: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  
  // Area Selection States
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Trigger Logic States
  const [triggerConditions, setTriggerConditions] = useState<TriggerCondition[]>([
    { id: 'initial', device: '', event: '', operator: '>', value: '' }
  ]);
  const [durationValue, setDurationValue] = useState<string>('0');

  // Action States
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [selectedNotifyMediums, setSelectedNotifyMediums] = useState<string[]>(['email', 'app']);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['shelby']);
  
  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>([
    { id: 'init-link-1', type: 'camera', deviceId: '', action: 'record_on', duration: '30' }
  ]);

  // --- Computations ---
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

  const zones = useMemo(() => {
    if (!selectedHostId) return [];
    const host = hosts.find(h => h.id === selectedHostId);
    return host?.children || [];
  }, [selectedHostId, hosts]);

  const currentSiteLabel = useMemo(() => sites.find(s => s.id === selectedSiteId)?.label || '', [sites, selectedSiteId]);
  const currentHostLabel = useMemo(() => hosts.find(h => h.id === selectedHostId)?.label || '', [hosts, selectedHostId]);
  const currentZoneLabel = useMemo(() => zones.find(z => z.id === selectedZoneId)?.label || '', [zones, selectedZoneId]);

  const isStep1Valid = !!selectedZoneId;
  const isStep2Valid = triggerConditions.length > 0 && triggerConditions.every(c => c.device && c.event);
  const isStep3Enabled = isStep1Valid && isStep2Valid;

  const isDurationAllowed = useMemo(() => {
    if (triggerConditions.length !== 1) return false;
    const cond = triggerConditions[0];
    if (cond.device === '讀卡機') return false;
    return !!(cond.device && cond.event);
  }, [triggerConditions]);

  // --- Handlers ---
  const addCondition = () => setTriggerConditions([...triggerConditions, { id: Date.now().toString(), device: '', event: '', operator: '>', value: '' }]);
  const removeCondition = (id: string) => triggerConditions.length > 1 && setTriggerConditions(triggerConditions.filter(c => c.id !== id));
  const updateCondition = (id: string, field: keyof TriggerCondition, value: string) => {
    setTriggerConditions(prev => prev.map(c => c.id === id ? { ...c, [field]: value, ...(field === 'device' ? { event: '' } : {}) } : c));
  };

  const toggleOutput = (output: string) => isStep3Enabled && setSelectedOutputs(prev => prev.includes(output) ? prev.filter(o => o !== output) : [...prev, output]);
  const toggleNotifyMedium = (medium: string) => setSelectedNotifyMediums(prev => prev.includes(medium) ? prev.filter(m => m !== medium) : [...prev, medium]);
  const toggleRecipient = (id: string) => setSelectedRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const addLinkedDevice = () => setLinkedDevices([...linkedDevices, { id: Date.now().toString(), type: 'camera', deviceId: '', action: 'record_on', duration: '30' }]);
  const removeLinkedDevice = (id: string) => linkedDevices.length > 1 && setLinkedDevices(linkedDevices.filter(d => d.id !== id));
  const updateLinkedDevice = (id: string, updates: Partial<LinkedDevice>) => setLinkedDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

  const getActionLabel = (type: 'camera' | 'host', actionId: string) => {
    const list = type === 'camera' ? CAMERA_ACTIONS : HOST_ACTIONS;
    return list.find(a => a.id === actionId)?.label || actionId;
  };

  if (isCreating) {
    return (
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
          {/* Step 1: Scope */}
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

          {/* Step 2: Logic */}
          <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
            <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Database size={20} className="text-blue-500" /> 觸發條件邏輯</h3>
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[700px]">
              {selectedZoneId ? (
                <>
                  {triggerConditions.map((condition, idx) => {
                    const isValueBased = VALUE_BASED_EVENTS.includes(condition.event);
                    return (
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
                              <option value="">選擇設備...</option>
                              {TRIGGER_DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-600 ml-1">選擇觸發事件</span>
                            <select value={condition.event} disabled={!condition.device} onChange={(e) => updateCondition(condition.id, 'event', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30">
                              <option value="">選擇事件...</option>
                              {condition.device && DEVICE_EVENTS_MAP[condition.device].map(ev => <option key={ev} value={ev}>{ev}</option>)}
                            </select>
                          </div>

                          {isValueBased && (
                            <div className="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2">
                               <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-600 ml-1">運算子</span>
                                  <select value={condition.operator} onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500">
                                     {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                                  </select>
                               </div>
                               <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-600 ml-1">數值</span>
                                  <input 
                                    type="text" placeholder="輸入值..." value={condition.value} onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                                    className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
                                  />
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={addCondition} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 hover:text-blue-400 hover:border-blue-900/30 transition-all flex items-center justify-center gap-2 text-xs font-bold bg-[#050914]/40">
                    <Plus size={16} /> 新增且 (AND) 條件
                  </button>

                  <div className="mt-8 pt-8 border-t border-slate-800/50">
                    <div className="flex items-center gap-2 mb-4">
                       <Timer size={18} className="text-blue-500" />
                       <h4 className="text-sm font-bold text-white">持續時間設定 (選填)</h4>
                    </div>
                    <div className={`p-6 rounded-[1.8rem] bg-black/40 border border-slate-800/50 flex flex-col gap-6 relative overflow-hidden transition-all ${!isDurationAllowed ? 'opacity-30 grayscale' : ''}`}>
                       <div className="flex items-center gap-6">
                          <input 
                            type="range" min="0" max="60" disabled={!isDurationAllowed}
                            value={durationValue} onChange={(e) => setDurationValue(e.target.value)}
                            className="flex-1 h-1 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer"
                          />
                          <div className="w-20 h-14 bg-[#111827] border border-slate-700 rounded-2xl flex items-center justify-center text-xl font-mono font-black text-slate-200">
                             {durationValue}s
                          </div>
                       </div>
                       <p className="text-[10px] text-slate-500 italic leading-relaxed">
                         若設定此項，需滿足上方所有條件並「持續維持」該時間長度才會正式觸發事件。
                       </p>
                    </div>

                    <div className="mt-6 space-y-3">
                       <div className="flex items-center gap-3 text-[10px] font-bold transition-colors">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${triggerConditions.length === 1 ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                             <Check size={10} strokeWidth={4} />
                          </div>
                          <span className={triggerConditions.length === 1 ? 'text-slate-300' : 'text-slate-600'}>僅設定一個觸發條件邏輯才開放選填持續時間</span>
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-bold transition-colors">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${triggerConditions[0]?.device !== '讀卡機' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                             <Check size={10} strokeWidth={4} />
                          </div>
                          <span className={triggerConditions[0]?.device !== '讀卡機' ? 'text-slate-300' : 'text-slate-600'}>讀卡屬於瞬時事件，不能設定持續時間</span>
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

          {/* Step 3: Actions */}
          <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
            <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Zap size={20} className="text-blue-500" /> 執行連動與通知設定</h3>
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1">
              {isStep3Enabled ? (
                <div className="space-y-8 pb-4">
                  <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
                    <button onClick={() => toggleOutput('notify')} className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${selectedOutputs.includes('notify') ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><CheckCircle2 size={16}/> 通知</button>
                    <button onClick={() => toggleOutput('device_link')} className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${selectedOutputs.includes('device_link') ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><CheckCircle2 size={16}/> 連動設備</button>
                  </div>

                  {selectedOutputs.includes('notify') && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Mail size={14} className="text-blue-400" /> 通知媒體
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => toggleNotifyMedium('email')} className={`flex items-center justify-center gap-3 py-3 rounded-xl border transition-all text-xs font-bold ${selectedNotifyMediums.includes('email') ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/20 border-slate-800 text-slate-600'}`}><Mail size={16}/> EMAIL</button>
                             <button onClick={() => toggleNotifyMedium('app')} className={`flex items-center justify-center gap-3 py-3 rounded-xl border transition-all text-xs font-bold ${selectedNotifyMediums.includes('app') ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/20 border-slate-800 text-slate-600'}`}><Smartphone size={16}/> APP</button>
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <UserCheck size={14} className="text-blue-400" /> 通知對象選擇
                          </label>
                          <div className="space-y-2">
                             {RECIPIENTS.map(p => (
                               <button key={p.id} onClick={() => toggleRecipient(p.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedRecipients.includes(p.id) ? 'bg-blue-600/10 border-blue-500' : 'bg-black/20 border-slate-800'}`}>
                                  <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${selectedRecipients.includes(p.id) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{p.name[0]}</div>
                                     <div className="text-left">
                                        <span className={`block text-sm font-bold ${selectedRecipients.includes(p.id) ? 'text-white' : 'text-slate-400'}`}>{p.name}</span>
                                        <span className="text-[10px] text-slate-600 italic">{p.email}</span>
                                     </div>
                                  </div>
                                  {selectedRecipients.includes(p.id) && <CheckCircle size={16} className="text-blue-500" />}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {selectedOutputs.includes('device_link') && (
                    <div className="space-y-4 animate-in fade-in duration-300 pt-4 border-t border-slate-800/50">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Zap size={14} className="text-blue-400" /> 連動設備列表
                       </label>
                       <div className="space-y-4">
                          {linkedDevices.map((link, idx) => (
                            <div key={link.id} className="p-5 bg-black/40 border border-slate-800 rounded-[1.8rem] space-y-4 relative group">
                               <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">連動項 {idx + 1}</span>
                                  {linkedDevices.length > 1 && <button onClick={() => removeLinkedDevice(link.id)} className="p-1.5 text-slate-700 hover:text-red-400"><Trash2 size={14}/></button>}
                               </div>
                               <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-600 ml-1">選擇設備</span>
                                  <select 
                                    value={link.deviceId} 
                                    onChange={(e) => {
                                      const isHostSelected = e.target.value === 'host-current';
                                      updateLinkedDevice(link.id, { deviceId: e.target.value, type: isHostSelected ? 'host' : 'camera', action: isHostSelected ? 'warn_prompt' : 'record_on' });
                                    }}
                                    className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-all appearance-none"
                                  >
                                     <option value="">未選取設備...</option>
                                     <optgroup label="攝影機清單">
                                        {CAMERA_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                     </optgroup>
                                     {selectedHostId && (
                                       <optgroup label="主機音效設備">
                                          <option value="host-current">目前主機 ({currentHostLabel})</option>
                                       </optgroup>
                                     )}
                                  </select>
                                </div>

                                {link.deviceId && (
                                  <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <span className="text-[10px] font-bold text-slate-600 ml-1">執行動作</span>
                                    <div className="space-y-2">
                                      {(link.type === 'camera' ? CAMERA_ACTIONS : HOST_ACTIONS).map(act => (
                                        <button 
                                          key={act.id} 
                                          onClick={() => updateLinkedDevice(link.id, { action: act.id })}
                                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${link.action === act.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' : 'bg-black/20 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                                        >
                                          {act.label}
                                          {link.action === act.id && <Check size={14} strokeWidth={4} />}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2 pt-2">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                     <span className="text-slate-600 flex items-center gap-1.5"><Timer size={12}/> 持續時長</span>
                                     <span className="text-blue-400 font-mono">{link.duration}s</span>
                                  </div>
                                  <input 
                                    type="range" min="5" max="300" step="5"
                                    value={link.duration} onChange={(e) => updateLinkedDevice(link.id, { duration: e.target.value })}
                                    className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-blue-600 cursor-pointer"
                                  />
                                </div>
                            </div>
                          ))}
                          <button onClick={addLinkedDevice} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-[1.8rem] text-slate-600 hover:text-blue-400 hover:border-blue-900/30 transition-all flex items-center justify-center gap-2 text-xs font-bold bg-[#050914]/40">
                             <Plus size={16} /> 新增其他連動設備
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/20 border border-dashed border-slate-800 rounded-[2.5rem] opacity-40">
                  <Plus size={48} className="text-slate-600 mb-4" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">尚未解鎖設定</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 預覽視窗 */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
             <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0">
                   <div className="flex items-center gap-5">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40"><Eye size={28}/></div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter italic">事件設定預覽 <span className="text-blue-500">.</span></h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Review your rule before deployment</p>
                      </div>
                   </div>
                   <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-700 rounded-xl text-slate-500 transition-colors"><X size={28}/></button>
                </div>
                
                <div className="p-8 space-y-10 overflow-y-auto max-h-[65vh] custom-scrollbar">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest"><Building2 size={14}/> 基本範圍</div>
                      <div className="bg-[#1e293b]/40 p-6 rounded-[1.5rem] border border-slate-800 space-y-4">
                         <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">事件規則名稱</span><span className="text-sm font-black text-white">{newEventName || '未命名事件'}</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">部署範圍</span><span className="text-xs font-bold text-slate-300">{currentSiteLabel} > {currentHostLabel} > {currentZoneLabel}</span></div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[11px] font-black text-orange-500 uppercase tracking-widest"><Database size={14}/> 觸發條件</div>
                      <div className="space-y-3">
                         {triggerConditions.map((c, i) => (
                           <div key={i} className="bg-[#1e293b]/40 border border-slate-800 px-6 py-4 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">COND {i+1}</span>
                              <div className="text-right">
                                 <span className="block text-xs font-bold text-slate-200">{c.device} : {c.event} {VALUE_BASED_EVENTS.includes(c.event) ? `(${c.operator} ${c.value})` : ''}</span>
                                 {i === 0 && durationValue !== '0' && isDurationAllowed && (
                                   <div className="flex items-center justify-end gap-1.5 mt-1">
                                      <Timer size={10} className="text-blue-400" />
                                      <span className="text-[10px] font-black text-blue-400 uppercase">需持續維持 {durationValue}s</span>
                                   </div>
                                 )}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[11px] font-black text-green-500 uppercase tracking-widest"><Zap size={14}/> 執行連動與通知</div>
                      <div className="space-y-4">
                         {selectedOutputs.includes('notify') && (
                           <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-slate-800 space-y-6">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3 text-slate-400"><Mail size={18}/><span className="text-xs font-bold">通知媒體</span></div>
                                 <div className="flex gap-2">
                                    {selectedNotifyMediums.map(m => (
                                      <span key={m} className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-md uppercase tracking-tighter">{m}</span>
                                    ))}
                                 </div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3 text-slate-400"><UserCheck size={18}/><span className="text-xs font-bold">通知對象</span></div>
                                 <span className="text-sm font-black text-white">{selectedRecipients.map(id => RECIPIENTS.find(r => r.id === id)?.name).join(', ')}</span>
                              </div>
                           </div>
                         )}

                         {selectedOutputs.includes('device_link') && linkedDevices.map((link, idx) => (
                           <div key={idx} className="bg-[#1e293b]/40 p-6 rounded-2xl border border-slate-800 flex items-center justify-between group">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">連動設備 {idx+1}</span>
                                 <div className="text-sm font-black text-white">{link.deviceId === 'host-current' ? `目前主機 (${currentHostLabel})` : (CAMERA_LIST.find(c => c.id === link.deviceId)?.name || '未選設備')}</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-[11px] font-black text-blue-500 uppercase tracking-tight">{getActionLabel(link.type, link.action)}</div>
                                 <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center justify-end gap-1.5">
                                    <Clock size={10} /> 執行時長 {link.duration}s
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex gap-5 shrink-0">
                   <button onClick={() => setIsPreviewOpen(false)} className="flex-1 py-4 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-2xl font-bold border border-slate-700 uppercase tracking-widest transition-all">返回修改</button>
                   <button onClick={() => { setIsPreviewOpen(false); setIsCreating(false); }} className="flex-[1.8] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 ring-1 ring-white/10">
                      <CheckCircle size={20}/> 確認並發布規則
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-800/50">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">管理事件 <span className="text-blue-600">.</span></h1>
          <p className="text-sm text-slate-500 font-medium">根據個人需求自訂感測器通知與設備連動規則</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/30 flex items-center gap-3 active:scale-95"><Plus size={18} /> 新增自訂事件</button>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
              <th className="px-8 py-6">事件規則名稱</th>
              <th className="px-8 py-6">連動範圍 (SCOPE)</th>
              <th className="px-8 py-6">觸發邏輯</th>
              <th className="px-8 py-6">執行動作</th>
              <th className="px-8 py-6">狀態</th>
              <th className="px-8 py-6 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {/* Row 1: 高溫告警 */}
            <tr className="group hover:bg-white/5 transition-all">
              <td className="px-8 py-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-white">大辦公區高溫告警</span>
                  <span className="text-[10px] font-mono text-slate-600 font-black uppercase tracking-widest">ID: RULE_T01</span>
                </div>
              </td>
              <td className="px-8 py-6"><span className="text-xs font-bold text-slate-400">總公司 (Site) > 商研中心 (主機1) > 大辦公區 (分區1)</span></td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2 bg-[#050914] px-3 py-2 rounded-xl border border-slate-800 w-fit">
                   <Cpu size={14} className="text-orange-400"/>
                   <span className="text-xs text-slate-300 font-bold">環境偵測器 (溫度 > 35℃)</span>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-blue-700/50 flex items-center justify-center text-blue-400"><Mail size={14}/></div>
                   <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-blue-700/50 flex items-center justify-center text-blue-400"><Video size={14}/></div>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                </div>
              </td>
              <td className="px-8 py-6 text-right"><button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreVertical size={18}/></button></td>
            </tr>

            {/* Row 2: SOS 連動 (依據需求補齊) */}
            <tr className="group hover:bg-white/5 transition-all">
              <td className="px-8 py-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-white">SOS 緊急救助連動</span>
                  <span className="text-[10px] font-mono text-slate-600 font-black uppercase tracking-widest">ID: RULE_S04</span>
                </div>
              </td>
              <td className="px-8 py-6"><span className="text-xs font-bold text-slate-400">北屯駐區 (主機1) > 大辦公區 (分區1)</span></td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2 bg-[#050914] px-3 py-2 rounded-xl border border-slate-800 w-fit">
                   <AlertTriangle size={14} className="text-red-500"/>
                   <span className="text-xs text-slate-300 font-bold">SOS緊急按鈕 (觸發)</span>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-blue-700/50 flex items-center justify-center text-blue-400"><Smartphone size={14}/></div>
                   <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-blue-700/50 flex items-center justify-center text-blue-400"><Speaker size={14}/></div>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                </div>
              </td>
              <td className="px-8 py-6 text-right"><button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreVertical size={18}/></button></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Info Section: What are custom events? (依據需求補齊) */}
      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 flex items-center gap-8 shadow-xl">
         <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40">
            <Info size={32} />
         </div>
         <div className="space-y-2">
            <h3 className="text-2xl font-black text-white tracking-tighter">什麼是自訂事件？</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
               自訂事件允許您針對特定的硬體狀態設定通知規則。這些規則獨立於安防中心的設防狀態，無論保全是否開啟，符合條件時系統皆會發送通知。
            </p>
         </div>
      </div>
    </div>
  );
};

export default EventManagementView;