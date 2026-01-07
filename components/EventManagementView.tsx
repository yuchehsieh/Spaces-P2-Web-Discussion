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
  AlertTriangle,
  CalendarClock,
  Shield,
  DoorOpen,
  Pencil,
  Power
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
  type: 'camera' | 'host' | 'gate';
  deviceId: string;
  action: string;
  delay: string; // 延時執行 (秒)
}

interface ScenarioRule {
  id: string;
  name: string;
  siteLabel: string;
  hostLabel: string;
  zoneLabel: string;
  triggerDevice: string;
  triggerEvent: string;
  armTime: string;
  disarmTime: string;
  selectedDays: string[];
  onlyDuringArmed: boolean;
  notifyRecipients: string[];
  linkedDevicesCount: number;
  isActive: boolean;
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
const DAYS_OPTIONS = ['一', '二', '三', '四', '五', '六', '日'];

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

const GATE_LIST = [
  { id: 'gate_main', name: '正門鐵捲門控制器' },
  { id: 'gate_back', name: '後門鐵捲門控制器' }
];

const CAMERA_ACTIONS = [
  { id: 'record_on', label: '開啟錄影功能' },
  { id: 'deterrence', label: '開啟嚇阻功能' }
];

const HOST_ACTIONS = [
  { id: 'warn_prompt', label: '播放警告提示' },
  { id: 'expel_sound', label: '播放驅逐音效' }
];

const GATE_ACTIONS = [
  { id: 'gate_open', label: '開啟鐵捲門' },
  { id: 'gate_close', label: '關閉鐵捲門' },
  { id: 'gate_stop', label: '停止動作' }
];

const INITIAL_SCENARIOS: ScenarioRule[] = [
  {
    id: 'RULE_T01',
    name: '大辦公區高溫告警',
    siteLabel: '總公司',
    hostLabel: '商研中心',
    zoneLabel: '大辦公區',
    triggerDevice: '環境偵測器',
    triggerEvent: '溫度 > 35℃',
    armTime: '00:00',
    disarmTime: '23:59',
    selectedDays: ['一', '二', '三', '四', '五'],
    onlyDuringArmed: false,
    notifyRecipients: ['Shelby', 'Admin'],
    linkedDevicesCount: 1,
    isActive: true
  },
  {
    id: 'RULE_S04',
    name: 'SOS 緊急救助連動',
    siteLabel: '北屯駐區',
    hostLabel: '主機1',
    zoneLabel: '大辦公區',
    triggerDevice: 'SOS緊急按鈕',
    triggerEvent: '觸發',
    armTime: '18:00',
    disarmTime: '08:00',
    selectedDays: ['一', '二', '三', '四', '五', '六', '日'],
    onlyDuringArmed: true,
    notifyRecipients: ['Admin', 'Polly'],
    linkedDevicesCount: 2,
    isActive: false
  }
];

const EventManagementView: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioRule[]>(INITIAL_SCENARIOS);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  
  // UI States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Area Selection States
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // 排程設置
  const [armTime, setArmTime] = useState('00:00');
  const [disarmTime, setDisarmTime] = useState('23:59');
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS_OPTIONS);

  // Trigger Logic States
  const [triggerCondition, setTriggerCondition] = useState<TriggerCondition>(
    { id: 'initial', device: '', event: '', operator: '>', value: '' }
  );
  const [onlyDuringArmed, setOnlyDuringArmed] = useState(false);

  // Action States
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [selectedNotifyMediums, setSelectedNotifyMediums] = useState<string[]>(['email', 'app']);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['shelby']);
  
  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>([
    { id: 'init-link-1', type: 'camera', deviceId: '', action: 'record_on', delay: '0' }
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

  const isStep1Valid = !!selectedZoneId && selectedDays.length > 0;
  const isStep2Valid = !!(triggerCondition.device && triggerCondition.event);
  const isStep3Enabled = isStep1Valid && isStep2Valid;

  // --- Handlers ---
  const updateCondition = (field: keyof TriggerCondition, value: string) => {
    setTriggerCondition(prev => ({ ...prev, [field]: value, ...(field === 'device' ? { event: '' } : {}) }));
  };

  const toggleOutput = (output: string) => isStep3Enabled && setSelectedOutputs(prev => prev.includes(output) ? prev.filter(o => o !== output) : [...prev, output]);
  const toggleNotifyMedium = (medium: string) => setSelectedNotifyMediums(prev => prev.includes(medium) ? prev.filter(m => m !== medium) : [...prev, medium]);
  const toggleRecipient = (id: string) => setSelectedRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const addLinkedDevice = () => setLinkedDevices([...linkedDevices, { id: Date.now().toString(), type: 'camera', deviceId: '', action: 'record_on', delay: '0' }]);
  const removeLinkedDevice = (id: string) => linkedDevices.length > 1 && setLinkedDevices(linkedDevices.filter(d => d.id !== id));
  const updateLinkedDevice = (id: string, updates: Partial<LinkedDevice>) => setLinkedDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

  const toggleScenarioActive = (id: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    setActiveMenuId(null);
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
    setActiveMenuId(null);
  };

  const getActionLabel = (type: 'camera' | 'host' | 'gate', actionId: string) => {
    if (type === 'camera') return CAMERA_ACTIONS.find(a => a.id === actionId)?.label || actionId;
    if (type === 'host') return HOST_ACTIONS.find(a => a.id === actionId)?.label || actionId;
    return GATE_ACTIONS.find(a => a.id === actionId)?.label || actionId;
  };

  if (isCreating) {
    return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
        {/* 新增情境 UI 部份保持不變... */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCreating(false)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all"><ChevronLeft size={24} /></button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">新增自訂情境 <span className="text-blue-600">.</span></h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Configure automated rules and responses</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCreating(false)} className="px-6 py-3 bg-transparent text-slate-400 hover:text-white text-xs font-black tracking-widest uppercase transition-all">Cancel</button>
            <button 
              onClick={() => setIsPreviewOpen(true)}
              className={`px-10 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl ${isStep3Enabled ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
            >
              Create Rule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Step 1: Scope & Schedule */}
          <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-3"><Building2 size={20} className="text-blue-500" /> 基本資訊與範圍</h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">情境名稱</label>
                  <input type="text" placeholder="例如：機房高溫連動錄影..." value={newEventName} onChange={(e) => setNewEventName(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-base font-bold text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-800 shadow-inner" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2"><MapIcon size={14} className="text-blue-400" /><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">連動區域選擇</label></div>
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

              <div className="pt-8 border-t border-slate-800/50 space-y-6">
                <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-3"><CalendarClock size={20} className="text-blue-500" /> 情境執行排程</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">啟動時間</label>
                      <div className="relative group/time cursor-pointer">
                        <input 
                          type="time" 
                          value={armTime} 
                          onChange={e => setArmTime(e.target.value)} 
                          className="w-full bg-[#050914] border border-slate-700 rounded-xl py-2.5 px-4 pr-10 text-sm font-mono font-bold text-white outline-none focus:border-blue-500 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                          <Clock size={14} />
                        </div>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">結束時間</label>
                      <div className="relative group/time cursor-pointer">
                        <input 
                          type="time" 
                          value={disarmTime} 
                          onChange={e => setDisarmTime(e.target.value)} 
                          className="w-full bg-[#050914] border border-slate-700 rounded-xl py-2.5 px-4 pr-10 text-sm font-mono font-bold text-white outline-none focus:border-blue-500 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                          <Clock size={14} />
                        </div>
                      </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">重複週期</label>
                  <div className="flex flex-wrap gap-1.5">
                      {DAYS_OPTIONS.map(day => (
                        <button 
                          key={day} 
                          onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                          className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all border ${selectedDays.includes(day) ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-[#050914] border-slate-800 text-slate-600 hover:text-slate-400'}`}
                        >
                          {day}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Logic */}
          <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
            <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-3"><Database size={20} className="text-blue-500" /> 觸發條件邏輯</h3>
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[750px]">
              {selectedZoneId ? (
                <>
                  <div className="space-y-5">
                    <div className="p-6 bg-[#050914] border border-slate-800 rounded-[2rem] relative animate-in zoom-in-95 duration-200 group shadow-inner">
                      <div className="flex justify-between items-center mb-5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">唯一觸發條件</span>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-600 ml-1">選擇設備類型</span>
                          <select value={triggerCondition.device} onChange={(e) => updateCondition('device', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500 appearance-none">
                            <option value="">選擇設備...</option>
                            {TRIGGER_DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-600 ml-1">選擇觸發事件</span>
                          <select value={triggerCondition.event} disabled={!triggerCondition.device} onChange={(e) => updateCondition('event', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-30 appearance-none">
                            <option value="">選擇事件...</option>
                            {triggerCondition.device && DEVICE_EVENTS_MAP[triggerCondition.device].map(ev => <option key={ev} value={ev}>{ev}</option>)}
                          </select>
                        </div>

                        {triggerCondition.event && VALUE_BASED_EVENTS.includes(triggerCondition.event) && (
                          <div className="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-600 ml-1">運算子</span>
                                <select value={triggerCondition.operator} onChange={(e) => updateCondition('operator', e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500">
                                  {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-600 ml-1">數值</span>
                                <input 
                                  type="text" placeholder="輸入值..." value={triggerCondition.value} onChange={(e) => updateCondition('value', e.target.value)}
                                  className="w-full bg-[#111827] border border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-800/50 space-y-4">
                     <div className="flex items-center justify-between p-5 bg-blue-600/5 border border-blue-500/20 rounded-3xl group cursor-pointer" onClick={() => setOnlyDuringArmed(!onlyDuringArmed)}>
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-2xl transition-all ${onlyDuringArmed ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                              <Shield size={20} />
                           </div>
                           <div>
                              <span className="block text-sm font-bold text-slate-200">僅在保全設防時段觸發</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Only trigger when Armed</span>
                           </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${onlyDuringArmed ? 'bg-blue-600' : 'bg-slate-800'}`}>
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${onlyDuringArmed ? 'left-7' : 'left-1'}`}></div>
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
                          {linkedDevices.map((link, idx) => {
                            const showDelay = link.type === 'gate';
                            return (
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
                                        const val = e.target.value;
                                        let type: 'camera' | 'host' | 'gate' = 'camera';
                                        let action = 'record_on';
                                        
                                        if (val === 'host-current') {
                                          type = 'host';
                                          action = 'warn_prompt';
                                        } else if (val.startsWith('gate')) {
                                          type = 'gate';
                                          action = 'gate_open';
                                        }
                                        
                                        updateLinkedDevice(link.id, { deviceId: val, type, action });
                                      }}
                                      className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-all appearance-none"
                                    >
                                       <option value="">未選取設備...</option>
                                       <optgroup label="攝影機清單">
                                          {CAMERA_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                       </optgroup>
                                       <optgroup label="控制設備清單">
                                          {GATE_LIST.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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
                                        {(link.type === 'camera' ? CAMERA_ACTIONS : link.type === 'host' ? HOST_ACTIONS : GATE_ACTIONS).map(act => (
                                          <button 
                                            key={act.id} 
                                            onClick={() => updateLinkedDevice(link.id, { action: act.id })}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${link.action === act.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-black/20 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                                          >
                                            {act.label}
                                            {link.action === act.id && <Check size={14} strokeWidth={4} />}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {showDelay && (
                                    <div className="space-y-2 pt-2 animate-in fade-in">
                                      <div className="flex justify-between items-center text-[10px] font-bold">
                                         <span className="text-slate-600 flex items-center gap-1.5"><Timer size={12}/> 延時執行 (秒)</span>
                                         <span className="text-blue-400 font-mono">{link.delay}s</span>
                                      </div>
                                      <input 
                                        type="range" min="0" max="300" step="5"
                                        value={link.delay} onChange={(e) => updateLinkedDevice(link.id, { delay: e.target.value })}
                                        className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-blue-600 cursor-pointer"
                                      />
                                    </div>
                                  )}
                              </div>
                            );
                          })}
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
                  <p className="text-sm font-bold text-slate-500">請先於第一欄位選擇分區</p>
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
                        <h2 className="text-2xl font-black text-white tracking-tighter italic">情境設定預覽 <span className="text-blue-500">.</span></h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Review your rule before deployment</p>
                      </div>
                   </div>
                   <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-700 rounded-xl text-slate-500 transition-colors"><X size={28}/></button>
                </div>
                
                <div className="p-8 space-y-10 overflow-y-auto max-h-[65vh] custom-scrollbar">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-widest"><Building2 size={14}/> 基本範圍與排程</div>
                      <div className="bg-[#1e293b]/40 p-6 rounded-[1.5rem] border border-slate-800 space-y-4">
                         <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">情境規則名稱</span><span className="text-sm font-black text-white">{newEventName || '未命名情境'}</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">部署範圍</span><span className="text-xs font-bold text-slate-300">{currentSiteLabel} > {currentHostLabel} > {currentZoneLabel}</span></div>
                         <div className="h-px bg-slate-800/50"></div>
                         <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">有效時段</span><span className="text-sm font-mono font-black text-blue-400">{armTime} ~ {disarmTime}</span></div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-bold">重複週期</span>
                            <div className="flex gap-1">
                               {selectedDays.map(d => <span key={d} className="w-5 h-5 rounded bg-blue-600 text-[9px] font-black text-white flex items-center justify-center">{d}</span>)}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[11px] font-black text-orange-500 uppercase tracking-widest"><Database size={14}/> 觸發條件與限制</div>
                      <div className="space-y-3">
                         <div className="bg-[#1e293b]/40 border border-slate-800 px-6 py-4 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TRIGGER</span>
                            <div className="text-right">
                               <span className="block text-xs font-bold text-slate-200">{triggerCondition.device} : {triggerCondition.event} {VALUE_BASED_EVENTS.includes(triggerCondition.event) ? `(${triggerCondition.operator} ${triggerCondition.value})` : ''}</span>
                            </div>
                         </div>
                         {onlyDuringArmed && (
                           <div className="bg-blue-600/10 border border-blue-500/30 px-6 py-4 rounded-xl flex items-center gap-3">
                              <Shield size={16} className="text-blue-400" />
                              <span className="text-xs font-black text-blue-300 uppercase tracking-widest">僅於保全設防時執行</span>
                           </div>
                         )}
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
                                 <div className="text-sm font-black text-white">
                                   {link.deviceId === 'host-current' 
                                     ? `目前主機 (${currentHostLabel})` 
                                     : (CAMERA_LIST.concat(GATE_LIST).find(c => c.id === link.deviceId)?.name || '未選設備')}
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-[11px] font-black text-blue-500 uppercase tracking-tight">{getActionLabel(link.type, link.action)}</div>
                                 {link.type === 'gate' && link.delay !== '0' && (
                                   <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center justify-end gap-1.5">
                                      <Clock size={10} /> 延時執行 {link.delay}s
                                   </div>
                                 )}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex gap-5 shrink-0">
                   <button onClick={() => setIsPreviewOpen(false)} className="flex-1 py-4 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-2xl font-bold border border-slate-700 uppercase tracking-widest transition-all">返回修改</button>
                   <button onClick={() => { setIsPreviewOpen(false); setIsCreating(false); }} className="flex-[1.8] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 ring-1 ring-white/10">
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
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">情境管理 <span className="text-blue-600">.</span></h1>
          <p className="text-sm text-slate-500 font-medium">根據個人需求自訂感測器通知與設備連動規則</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/30 flex items-center gap-3 active:scale-95"><Plus size={18} /> 新增自訂情境</button>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-visible shadow-2xl mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
              <th className="px-8 py-6">情境規則名稱</th>
              <th className="px-8 py-6">範圍 (SCOPE)</th>
              <th className="px-8 py-6">觸發邏輯</th>
              <th className="px-8 py-6">執行排程</th>
              <th className="px-8 py-6">設防限制</th>
              <th className="px-8 py-6">執行動作</th>
              <th className="px-8 py-6">狀態</th>
              <th className="px-8 py-6 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {scenarios.map((scenario) => (
              <tr key={scenario.id} className="group hover:bg-white/5 transition-all">
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-white">{scenario.name}</span>
                    <span className="text-[10px] font-mono text-slate-600 font-black uppercase tracking-widest">ID: {scenario.id}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-bold text-slate-400 block whitespace-nowrap">{scenario.siteLabel}</span>
                  <span className="text-[10px] font-bold text-slate-600 block">{scenario.hostLabel} > {scenario.zoneLabel}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 bg-[#050914] px-3 py-2 rounded-xl border border-slate-800 w-fit">
                    <Cpu size={14} className="text-orange-400"/>
                    <span className="text-xs text-slate-300 font-bold whitespace-nowrap">{scenario.triggerDevice} ({scenario.triggerEvent})</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-blue-400 font-mono text-xs font-black">
                      <Clock size={12}/> {scenario.armTime} ~ {scenario.disarmTime}
                    </div>
                    <div className="flex gap-0.5">
                      {scenario.selectedDays.map(d => (
                        <span key={d} className="w-4 h-4 rounded-sm bg-slate-800 text-[8px] font-black flex items-center justify-center text-slate-500">{d}</span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  {scenario.onlyDuringArmed ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-600/10 border border-blue-500/30 rounded-lg text-blue-400" title="僅在保全設防時觸發">
                      <Shield size={14}/>
                      <span className="text-[10px] font-black uppercase tracking-tighter">ONLY ARMED</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">無限制</span>
                  )}
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-2">
                    {/* Notify List */}
                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-700/50 px-2 py-1 rounded text-blue-400">
                        <Mail size={10}/>
                        <span className="text-[10px] font-black uppercase">通知: {scenario.notifyRecipients.join(', ')}</span>
                      </div>
                    </div>
                    {/* Devices List */}
                    {scenario.linkedDevicesCount > 0 && (
                      <div className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/50 px-2 py-1 rounded text-purple-400 w-fit">
                        <Video size={10}/>
                        <span className="text-[10px] font-black uppercase">連動: {scenario.linkedDevicesCount} 設備</span>
                      </div>
                    )}
                  </div>
                </td>
                {/* 狀態欄位：純顯示標籤，非 Switch */}
                <td className="px-8 py-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${scenario.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${scenario.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    {scenario.isActive ? '啟用中' : '已停用'}
                  </div>
                </td>
                <td className="px-8 py-6 text-right relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === scenario.id ? null : scenario.id)}
                    className="p-2 text-slate-600 hover:text-white transition-colors bg-slate-800/40 rounded-xl border border-transparent hover:border-slate-700"
                  >
                    <MoreVertical size={18}/>
                  </button>
                  
                  {activeMenuId === scenario.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 w-48 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => toggleScenarioActive(scenario.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-sm font-bold text-slate-300 transition-colors"
                        >
                          <Power size={14} className={scenario.isActive ? 'text-orange-400' : 'text-green-400'}/>
                          {scenario.isActive ? '停用情境' : '啟用情境'}
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-sm font-bold text-slate-300 transition-colors border-t border-slate-700/50">
                          <Pencil size={14} className="text-blue-400"/>
                          編輯情境內容
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(scenario.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 text-sm font-bold text-red-400 transition-colors border-t border-slate-700/50"
                        >
                          <Trash2 size={14} className="text-red-500"/>
                          刪除此規則
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 flex items-center gap-8 shadow-xl">
         <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40">
            <Info size={32} />
         </div>
         <div className="space-y-2">
            <h3 className="text-2xl font-black text-white tracking-tighter">什麼是情境？</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
               自訂情境允許您針對特定的硬體狀態設定通知規則。這些規則可根據排程與保全狀態進行過濾，符合條件時系統會自動執行連動動作。
            </p>
         </div>
      </div>

      {/* 刪除確認彈窗 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full ring-1 ring-white/5 animate-in zoom-in-95 duration-200 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                 <AlertTriangle className="text-red-500" size={40} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">確定刪除規則？</h2>
              <p className="text-sm text-slate-500 mb-8">此操作將永久移除此項自訂情境連動規則，且無法復原。您確定要繼續嗎？</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => deleteScenario(deleteConfirmId)} className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">確認刪除</button>
                 <button onClick={() => setDeleteConfirmId(null)} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-700 transition-all active:scale-95">返回</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventManagementView;