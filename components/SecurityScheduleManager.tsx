import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CalendarClock, 
  Clock, 
  Building2, 
  Server, 
  FolderOpen, 
  Check, 
  X, 
  Shield, 
  ChevronRight,
  UserCheck,
  Pencil,
  Copy
} from 'lucide-react';
import { SITE_TREE_DATA } from '../constants';
import { SiteNode, Schedule } from '../types';

const DAYS_OPTIONS = ['一', '二', '三', '四', '五', '六', '日'];

const SecurityScheduleManager: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: 's-init', name: '夜間例行設防', siteId: 'site-hq', siteLabel: '總公司', hostId: 'host-hq-1', hostLabel: '商研中心', zoneId: 'zone-hq-office', zoneLabel: '大辦公區', armTime: '22:00', disarmTime: '06:00', days: ['一', '二', '三', '四', '五'], isActive: true, createdBy: 'Admin' }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Schedule>>({
    name: '', siteId: '', hostId: '', zoneId: '', armTime: '22:00', disarmTime: '06:00', days: [], isActive: true
  });

  // 階層數據提取
  const sites = useMemo(() => {
    const list: SiteNode[] = [];
    const traverse = (nodes: SiteNode[]) => { nodes.forEach(n => { if (n.type === 'site') list.push(n); if (n.children) traverse(n.children); }); };
    traverse(SITE_TREE_DATA);
    return list;
  }, []);

  const hosts = useMemo(() => {
    if (!formData.siteId) return [];
    return sites.find(s => s.id === formData.siteId)?.children || [];
  }, [formData.siteId, sites]);

  const zones = useMemo(() => {
    if (!formData.hostId) return [];
    return hosts.find(h => h.id === formData.hostId)?.children || [];
  }, [formData.hostId, hosts]);

  const handleSave = () => {
    const site = sites.find(s => s.id === formData.siteId);
    const host = hosts.find(h => h.id === formData.hostId);
    const zone = zones.find(z => z.id === formData.zoneId);

    if (!formData.name || !zone) { alert('請填寫完整排程資訊'); return; }

    const newSchedule: Schedule = {
      ...(formData as Schedule),
      id: Date.now().toString(),
      siteLabel: site?.label || '',
      hostLabel: host?.label || '',
      zoneLabel: zone?.label || '',
      createdBy: 'Admin'
    };

    setSchedules([...schedules, newSchedule]);
    setIsAdding(false);
    setFormData({ name: '', siteId: '', hostId: '', zoneId: '', armTime: '22:00', disarmTime: '06:00', days: [], isActive: true });
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800/50">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Security Scheduling <span className="text-blue-600">.</span></h1>
           <p className="text-sm text-slate-500 font-medium italic">管理各據點分區之保全自動化設防排程</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95">
            <Plus size={18} /> 新增排程任務
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4 duration-300">
           {/* Step 1: 階層選擇 Site > Host > Zone */}
           <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
              <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-3"><Shield size={20} className="text-blue-500" /> 設定排程對象</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">排程顯示名稱</label>
                   <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如：平日夜間防護..." className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3.5 px-5 text-white font-bold outline-none focus:border-blue-500 shadow-inner" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">選取據點 (Site)</label>
                   <select value={formData.siteId} onChange={e => setFormData({...formData, siteId: e.target.value, hostId: '', zoneId: ''})} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-300 appearance-none cursor-pointer">
                      <option value="">請選擇據點...</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">選取主機 (Host)</label>
                   <select value={formData.hostId} disabled={!formData.siteId} onChange={e => setFormData({...formData, hostId: e.target.value, zoneId: ''})} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-300 disabled:opacity-30 appearance-none">
                      <option value="">請選擇主機...</option>
                      {hosts.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">選取分區 (Zone)</label>
                   <select value={formData.zoneId} disabled={!formData.hostId} onChange={e => setFormData({...formData, zoneId: e.target.value})} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-300 disabled:opacity-30 appearance-none">
                      <option value="">請選擇分區...</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                   </select>
                </div>
              </div>
           </div>

           {/* Step 2: 時間週期 */}
           <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between">
              <div className="space-y-10">
                <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-3"><Clock size={20} className="text-blue-500" /> 時間與執行週期</h3>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-green-500 uppercase tracking-widest block ml-1">自動設防時間</label>
                      <div className="relative group/time cursor-pointer">
                        <input 
                          type="time" 
                          value={formData.armTime} 
                          onChange={e => setFormData({...formData, armTime: e.target.value})} 
                          className="w-full bg-[#050914] border border-slate-700 rounded-xl py-4 px-5 pr-14 text-2xl font-mono font-black text-white outline-none focus:border-green-500 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                          <Clock size={20} />
                        </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest block ml-1">自動撤防時間</label>
                      <div className="relative group/time cursor-pointer">
                        <input 
                          type="time" 
                          value={formData.disarmTime} 
                          onChange={e => setFormData({...formData, disarmTime: e.target.value})} 
                          className="w-full bg-[#050914] border border-slate-700 rounded-xl py-4 px-5 pr-14 text-2xl font-mono font-black text-white outline-none focus:border-blue-500 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                          <Clock size={20} />
                        </div>
                      </div>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block ml-1">重複週期 (週)</label>
                   <div className="flex flex-wrap gap-2">
                      {DAYS_OPTIONS.map(day => (
                        <button 
                          key={day} 
                          onClick={() => {
                            const cur = formData.days || [];
                            setFormData({...formData, days: cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day]});
                          }}
                          className={`w-12 h-12 rounded-2xl text-sm font-black transition-all border ${formData.days?.includes(day) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-[#050914] border-slate-800 text-slate-600 hover:text-slate-400'}`}
                        >
                          {day}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
              <div className="pt-10 border-t border-slate-800 flex gap-5">
                 <button onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">取消</button>
                 <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all">確認建立排程</button>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
           {schedules.map(s => (
             <div key={s.id} className={`bg-[#111827] border rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-blue-500/30 transition-all ${s.isActive ? 'border-slate-800 shadow-xl' : 'border-slate-900 opacity-50 grayscale'}`}>
                <div className="flex items-center gap-8">
                   <div className={`p-6 rounded-3xl ${s.isActive ? 'bg-blue-600/10 text-blue-500 shadow-inner' : 'bg-slate-900 text-slate-700'}`}>
                      <CalendarClock size={32} />
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <h4 className="text-xl font-black text-white tracking-tight italic">{s.name}</h4>
                         <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border uppercase tracking-tighter ${s.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{s.isActive ? 'ENABLED' : 'DISABLED'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                         <span className="flex items-center gap-1.5"><Building2 size={14}/> {s.siteLabel}</span>
                         <ChevronRight size={10} className="text-slate-700" />
                         <span className="flex items-center gap-1.5"><Server size={14}/> {s.hostLabel}</span>
                         <ChevronRight size={10} className="text-slate-700" />
                         <span className="flex items-center gap-1.5 text-blue-400"><FolderOpen size={14}/> {s.zoneLabel}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Execution Period</span>
                      <div className="flex items-center gap-4 bg-black/40 px-5 py-2.5 rounded-[1.2rem] border border-slate-800">
                         <span className="text-sm font-mono font-black text-green-400">{s.armTime} ARM</span>
                         <ChevronRight size={12} className="text-slate-700" />
                         <span className="text-sm font-mono font-black text-blue-400">{s.disarmTime} DISARM</span>
                      </div>
                   </div>
                   <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Weekly Cycle</span>
                      <div className="flex gap-1.5">
                         {DAYS_OPTIONS.map(d => (
                           <div key={d} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${s.days.includes(d) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-600'}`}>{d}</div>
                         ))}
                      </div>
                   </div>
                   <div className="flex items-center gap-3 ml-4">
                      <button className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700"><Pencil size={18}/></button>
                      <button onClick={() => setSchedules(prev => prev.filter(x => x.id !== s.id))} className="p-3 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-700"><Trash2 size={18}/></button>
                      <div className="w-px h-12 bg-slate-800 mx-2"></div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={s.isActive} onChange={() => setSchedules(prev => prev.map(x => x.id === s.id ? {...x, isActive: !x.isActive} : x))} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-800 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7 shadow-inner"></div>
                      </label>
                   </div>
                </div>
             </div>
           ))}
           {schedules.length === 0 && (
             <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem] opacity-40 italic">
                無任何排程任務，點擊上方按鈕建立
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SecurityScheduleManager;