import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  Shield, 
  ShieldAlert, 
  Unlock, 
  Lock, 
  Search, 
  Battery, 
  Video, 
  DoorClosed, 
  BellRing, 
  Activity, 
  Cpu, 
  AlertCircle,
  CalendarClock,
  User,
  AlertTriangle,
  XCircle,
  Clock,
  Info,
  Building2,
  ExternalLink,
  Zap,
  Thermometer,
  X,
  CheckCircle2
} from 'lucide-react';
import { SiteNode, Schedule } from '../types';
import { SITE_TREE_DATA } from '../constants';

interface DeviceStatus {
  id: string;
  label: string;
  type: string;
  status: 'normal' | 'triggered' | 'offline';
  batteryLevel?: number;
  isOnline: boolean;
}

interface ZoneArmState {
  [zoneId: string]: 'armed' | 'disarmed';
}

interface ExecutionReport {
  isOpen: boolean;
  siteLabel: string;
  action: 'arm' | 'disarm';
  successCount: number;
  failureCount: number;
  successes: { zoneLabel: string; deviceCount: number }[];
  failures: { zoneLabel: string; reasons: string[] }[];
}

const generateMockDeviceStatus = (nodes: SiteNode[]): Record<string, DeviceStatus> => {
  const statusMap: Record<string, DeviceStatus> = {};
  const traverse = (n: SiteNode) => {
    if (n.type === 'device') {
      const isBatteryPowered = ['door', 'sensor', 'emergency'].includes(n.deviceType || '');
      const isSuspectSite = n.id.includes('zs') || n.id.includes('dj');
      const isTriggered = isSuspectSite && Math.random() > 0.8;
      statusMap[n.id] = {
        id: n.id,
        label: n.label,
        type: n.deviceType || 'unknown',
        status: isTriggered ? 'triggered' : 'normal',
        isOnline: true,
        batteryLevel: isBatteryPowered ? Math.floor(40 + Math.random() * 60) : undefined
      };
    }
    if (n.children) n.children.forEach(traverse);
  };
  nodes.forEach(traverse);
  return statusMap;
};

const daysOptions = ['一', '二', '三', '四', '五', '六', '日'];

const MOCK_SUMMARY_SCHEDULES: Schedule[] = [
  { id: 's1', name: '夜間例行設防', siteId: 'site-hq', siteLabel: '總公司', hostId: 'host-hq-1', hostLabel: '商研中心', zoneId: 'zone-hq-office', zoneLabel: '大辦公區', armTime: '22:00', disarmTime: '06:00', days: ['一', '二', '三', '四', '五'], isActive: true, createdBy: 'Admin' }
];

const DeviceCard: React.FC<{ device: DeviceStatus }> = ({ device }) => {
  const getIcon = () => {
    switch (device.type) {
      case 'sensor': 
        if (device.label === 'PIR') return <Activity size={24} className="text-blue-400" />;
        return <Thermometer size={24} className="text-cyan-400" />;
      case 'camera': return <Video size={24} className="text-blue-400" />;
      case 'door': return <DoorClosed size={24} className="text-emerald-400" />;
      case 'emergency': return <BellRing size={24} className="text-blue-400" />;
      default: return <Cpu size={24} className="text-slate-400" />;
    }
  };

  const isTriggered = device.status === 'triggered';

  return (
    <div className={`relative w-36 h-48 bg-[#0f172a]/80 border rounded-2xl flex flex-col items-center justify-center p-4 transition-all hover:scale-105 group ${isTriggered ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-slate-800 hover:border-slate-600'}`}>
      <div className="absolute top-3 right-3">
        <div className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`}></div>
      </div>

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-[#1e293b] shadow-inner ${isTriggered ? 'animate-pulse bg-red-500/10' : ''}`}>
        {getIcon()}
      </div>

      <span className="text-xs font-bold text-slate-300 mb-1 truncate w-full text-center">{device.label}</span>
      
      <span className={`text-[10px] font-black uppercase tracking-widest ${isTriggered ? 'text-red-500' : 'text-green-500'}`}>
        {isTriggered ? 'TRIGGERED' : 'NORMAL'}
      </span>

      {device.batteryLevel !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 px-2 py-0.5 bg-black/40 rounded-md border border-white/5">
          <Battery size={10} className={device.batteryLevel < 20 ? 'text-red-500' : 'text-green-500'} />
          <span className="text-[9px] font-mono font-bold text-slate-500">{device.batteryLevel}%</span>
        </div>
      )}
    </div>
  );
};

const SiteSection: React.FC<{
  site: SiteNode;
  deviceStatuses: Record<string, DeviceStatus>;
  zoneArmState: ZoneArmState;
  handleArmClick: (zone: SiteNode) => void;
  handleGlobalArmClick: (site: SiteNode) => void;
  handleGlobalDisarmClick: (site: SiteNode) => void;
  onGoToSchedules: () => void;
}> = ({ site, deviceStatuses, zoneArmState, handleArmClick, handleGlobalArmClick, handleGlobalDisarmClick, onGoToSchedules }) => {
  const [isSiteExpanded, setIsSiteExpanded] = useState(true);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);
  const [isControlExpanded, setIsControlExpanded] = useState(true);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);
  const [deviceSearch, setDeviceSearch] = useState('');

  const zonesData = useMemo(() => {
    const list: { node: SiteNode; devices: DeviceStatus[] }[] = [];
    const traverse = (n: SiteNode) => {
      if (n.type === 'zone') {
        const devices = n.children?.filter(c => c.type === 'device').map(c => deviceStatuses[c.id]).filter(Boolean) || [];
        list.push({ node: n, devices });
      }
      n.children?.forEach(traverse);
    };
    site.children?.forEach(traverse);
    return list;
  }, [site, deviceStatuses]);

  const filteredZones = useMemo(() => {
    if (!deviceSearch) return zonesData;
    return zonesData.map(z => ({
      ...z,
      devices: z.devices.filter(d => d.label.toLowerCase().includes(deviceSearch.toLowerCase()))
    })).filter(z => z.devices.length > 0);
  }, [zonesData, deviceSearch]);

  const today = daysOptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todaySchedules = useMemo(() => MOCK_SUMMARY_SCHEDULES.filter(s => s.siteId === site.id && s.isActive && s.days.includes(today)), [site.id, today]);

  return (
    <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden mb-8 shadow-lg">
      <div 
        onClick={() => setIsSiteExpanded(!isSiteExpanded)}
        className="px-6 py-4 bg-[#111827] flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800/50"
      >
        <div className="flex items-center gap-3">
          <Building2 size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">{site.label}</h2>
          <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{zonesData.length} 個分區</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleGlobalArmClick(site); }} 
              className="px-3 py-1.5 bg-green-900/40 hover:bg-green-800/60 border border-green-700/50 text-green-300 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5"
            >
              <Lock size={12} /> 全區設防
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleGlobalDisarmClick(site); }} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5"
            >
              <Unlock size={12} /> 全區解除
            </button>
          </div>
          <div className="text-slate-500">{isSiteExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
        </div>
      </div>

      {isSiteExpanded && (
        <div className="p-6 space-y-10 bg-[#050914]/50 animate-in fade-in duration-300">
          
          <div className="space-y-4">
            <div onClick={() => setIsScheduleExpanded(!isScheduleExpanded)} className="flex items-center justify-between cursor-pointer group">
              <h3 className="text-slate-400 font-black text-sm uppercase tracking-widest flex items-center gap-3 group-hover:text-blue-400 transition-colors"><CalendarClock size={20} className="text-blue-500" /> 今日保全自動化摘要</h3>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); onGoToSchedules(); }} className="text-[9px] px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg border border-blue-500/30 transition-all font-black uppercase tracking-widest flex items-center gap-2">
                   前往管理排程 <ExternalLink size={10} />
                </button>
                {isScheduleExpanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
              </div>
            </div>
            
            {isScheduleExpanded && (
              <div className="bg-black/40 rounded-2xl p-5 border border-white/5 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                <div className="flex flex-col gap-3">
                   {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-xs bg-white/5 border border-white/5 rounded-xl px-5 py-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                         <span className="text-slate-200 font-black min-w-[80px] uppercase tracking-tighter">{s.zoneLabel}</span>
                         <span className="text-slate-700">｜</span>
                         <span className="text-slate-400 font-bold">{s.name}</span>
                         <span className="text-slate-700">｜</span>
                         <div className="flex items-center gap-3 font-mono">
                            <span className="text-green-400 font-black">{s.armTime} ARM</span>
                            <ChevronRight size={12} className="text-slate-700"/>
                            <span className="text-blue-400 font-black">{s.disarmTime} DISARM</span>
                         </div>
                      </div>
                   )) : (
                      <div className="flex items-center justify-center py-6 text-xs text-slate-600 italic gap-3">
                         <Info size={16}/> 今日無自動化任務
                      </div>
                   )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-800/50">
            <div onClick={() => setIsControlExpanded(!isControlExpanded)} className="flex items-center justify-between cursor-pointer group">
              <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-3 group-hover:text-green-400 transition-colors"><Shield size={20} className="text-green-500" /> 保全分區控管</h3>
              {isControlExpanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
            </div>
            {isControlExpanded && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in">
                  {zonesData.map(z => {
                    const isArmed = zoneArmState[z.node.id] === 'armed';
                    return (
                      <div 
                        key={z.node.id} 
                        onClick={() => handleArmClick(z.node)} 
                        className={`relative h-28 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center shadow-lg ${isArmed ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/10 border-green-700/50 ring-1 ring-green-500/20' : 'bg-[#111827] border-slate-800 hover:border-slate-600'}`}
                      >
                        <div className={`mb-2 transition-transform duration-500 ${isArmed ? 'text-green-400 scale-110' : 'text-slate-600'}`}>{isArmed ? <Shield size={28} strokeWidth={2.5}/> : <Unlock size={28} strokeWidth={2.5}/>}</div>
                        <span className={`text-[11px] font-black truncate max-w-full px-3 text-center uppercase tracking-tighter ${isArmed ? 'text-green-100' : 'text-slate-500'}`}>{z.node.label}</span>
                        {isArmed && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              <div onClick={() => setIsDashboardExpanded(!isDashboardExpanded)} className="flex items-center gap-3 cursor-pointer group">
                 <Zap size={20} className={`text-blue-500 ${isDashboardExpanded ? 'animate-pulse' : ''}`} />
                 <h3 className="text-white font-black text-sm uppercase tracking-widest group-hover:text-blue-400 transition-colors">設備狀態儀表板</h3>
                 {isDashboardExpanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
              </div>
              {isDashboardExpanded && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="查找設備..." 
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    className="bg-[#111827] border border-slate-700 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500 w-48 shadow-inner" 
                  />
                  <Search size={14} className="absolute left-3 top-2 text-slate-500" />
                </div>
              )}
            </div>

            {isDashboardExpanded && (
              <div className="space-y-8 animate-in fade-in duration-300">
                 {filteredZones.map(zone => (
                   <div key={zone.node.id} className="space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="px-3 py-1 bg-slate-800/80 text-slate-300 text-[10px] font-black rounded-lg border border-slate-700 uppercase tracking-widest">{zone.node.label}</span>
                         <div className="h-px bg-slate-800/50 flex-1"></div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                         {zone.devices.map(device => (
                           <DeviceCard key={device.id} device={device} />
                         ))}
                      </div>
                   </div>
                 ))}
                 {filteredZones.length === 0 && (
                   <div className="py-10 text-center text-slate-600 italic text-xs">查無相符的設備資訊</div>
                 )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

const SecurityTab: React.FC<{ onJumpToNav?: (nav: any) => void }> = ({ onJumpToNav }) => {
  const [zoneArmState, setZoneArmState] = useState<ZoneArmState>({});
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceStatus>>({});
  
  const [armConfirmConfig, setArmConfirmConfig] = useState<{
    isOpen: boolean, 
    site: SiteNode | null, 
    action: 'arm' | 'disarm' | null, 
    zone?: SiteNode
  }>({ isOpen: false, site: null, action: null });
  
  const [report, setReport] = useState<ExecutionReport | null>(null);

  useEffect(() => { setDeviceStatuses(generateMockDeviceStatus(SITE_TREE_DATA)); }, []);

  const allSites = useMemo(() => {
    const sites: SiteNode[] = [];
    const traverse = (nodes: SiteNode[]) => { nodes.forEach(node => { if (node.type === 'site') sites.push(node); if (node.children) traverse(node.children); }); };
    traverse(SITE_TREE_DATA);
    return sites;
  }, []);

  // 統一判定邏輯：定義哪些區域在設防時會失敗 (中山、大甲的特定分區)
  const checkZoneEligibility = (zoneId: string, zoneLabel: string): { success: boolean, reasons: string[] } => {
    // 模擬：中山處與大甲處的「倉庫」及「部長室」會失敗
    const isProblematic = zoneLabel.includes('倉庫') || zoneLabel.includes('部長室');
    if (isProblematic) {
      return {
        success: false,
        reasons: zoneLabel.includes('倉庫') 
          ? ['區域內有門窗未緊閉', '感測迴路異常'] 
          : ['門磁 處於開啟狀態']
      };
    }
    return { success: true, reasons: [] };
  };

  const handleArmToggle = (zone: SiteNode) => {
    const isCurrentlyArmed = zoneArmState[zone.id] === 'armed';
    if (isCurrentlyArmed) {
      // 若已設防 -> 直接切換為撤防 (解除保全通常不跳報告，或可視需求增加)
      setZoneArmState(prev => ({ ...prev, [zone.id]: 'disarmed' }));
    } else {
      // 若未設防 -> 跳出確認視窗，確認後顯示執行報告
      setArmConfirmConfig({ isOpen: true, site: null, action: 'arm', zone: zone });
    }
  };

  const executeAction = () => {
    const { site, action, zone } = armConfirmConfig;
    setArmConfirmConfig({ isOpen: false, site: null, action: null });

    const failures: ExecutionReport['failures'] = [];
    const successes: ExecutionReport['successes'] = [];

    // 確定要處理的 Zone 清單
    const targets: SiteNode[] = [];
    if (zone) {
      targets.push(zone);
    } else if (site) {
      const traverse = (n: SiteNode) => {
        if (n.type === 'zone') targets.push(n);
        n.children?.forEach(traverse);
      };
      traverse(site);
    }

    if (action === 'arm') {
      targets.forEach(t => {
        const check = checkZoneEligibility(t.id, t.label);
        if (check.success) {
          const deviceCount = t.children?.filter(c => c.type === 'device').length || 0;
          successes.push({ zoneLabel: t.label, deviceCount });
          setZoneArmState(prev => ({ ...prev, [t.id]: 'armed' }));
        } else {
          failures.push({ zoneLabel: t.label, reasons: check.reasons });
        }
      });
    } else {
      // 撤防邏輯 (全區撤防)
      targets.forEach(t => {
        successes.push({ zoneLabel: t.label, deviceCount: t.children?.filter(c => c.type === 'device').length || 0 });
        setZoneArmState(prev => ({ ...prev, [t.id]: 'disarmed' }));
      });
    }

    setReport({
      isOpen: true,
      siteLabel: site?.label || zone?.label || '自訂分區',
      action: action!,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#050914] text-slate-200 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-4 pb-20">
        <div className="mb-10 flex flex-col gap-1">
          <h1 className="text-3xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter"><Shield className="text-blue-500" size={32} /> Security Monitoring Center</h1>
          <p className="text-sm text-slate-500 font-medium ml-12">實時控管全球據點分區之設防狀態、設備運作及自動化排程</p>
        </div>
        
        {allSites.map(site => (
          <SiteSection 
            key={site.id} 
            site={site} 
            deviceStatuses={deviceStatuses} 
            zoneArmState={zoneArmState} 
            handleArmClick={handleArmToggle} 
            handleGlobalArmClick={(s) => setArmConfirmConfig({ isOpen: true, site: s, action: 'arm' })} 
            handleGlobalDisarmClick={(s) => setArmConfirmConfig({ isOpen: true, site: s, action: 'disarm' })}
            onGoToSchedules={() => onJumpToNav?.('event-center')}
          />
        ))}
      </div>

      {armConfirmConfig.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full ring-1 ring-white/5 animate-in zoom-in-95 duration-200 text-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                 <Shield className="text-blue-500" size={40} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">安防確認</h2>
              <p className="text-sm text-slate-500 mb-8">您確定要對「{armConfirmConfig.site?.label || armConfirmConfig.zone?.label}」<br/>執行 {armConfirmConfig.action === 'arm' ? '設防' : '撤防'} 操作嗎？</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={executeAction} className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">確認執行</button>
                 <button onClick={() => setArmConfirmConfig({ isOpen: false, site: null, action: null })} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-700 transition-all active:scale-95">返回</button>
              </div>
           </div>
        </div>
      )}

      {report?.isOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-[#1b2333] border border-slate-800 rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 ring-1 ring-white/5 flex flex-col max-h-[90vh]">
              <div className="p-6 flex items-center justify-between border-b border-white/5 shrink-0">
                 <div className="flex items-center gap-3">
                    <Shield className="text-blue-400" size={24}/>
                    <h2 className="text-xl font-bold text-slate-100">執行設防報告</h2>
                 </div>
                 <button onClick={() => setReport(null)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#142826] border border-emerald-900/50 rounded-lg p-5 flex flex-col items-center shadow-inner">
                       <span className="text-4xl font-black text-emerald-500 mb-1">{report.successCount}</span>
                       <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">SUCCESS</span>
                    </div>
                    <div className="bg-[#2a1a1c] border border-red-900/50 rounded-lg p-5 flex flex-col items-center shadow-inner">
                       <span className="text-4xl font-black text-red-500 mb-1">{report.failureCount}</span>
                       <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">FAILURE</span>
                    </div>
                 </div>

                 {/* Success List */}
                 {report.successCount > 0 && (
                    <div className="bg-[#111827] rounded-xl p-5 border border-white/5 space-y-4">
                       <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 size={14}/>
                          <span className="text-xs font-bold uppercase tracking-widest">成功設防區域</span>
                       </div>
                       <div className="space-y-3">
                          {report.successes.map((succ, i) => (
                             <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 transition-all hover:bg-white/10">
                                <span className="text-sm font-bold text-slate-100">{succ.zoneLabel}</span>
                                <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                   {succ.deviceCount} 個設備自檢正常
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* Error List */}
                 {report.failureCount > 0 && (
                    <div className="bg-[#111827] rounded-xl p-5 border border-white/5 space-y-4">
                       <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle size={14}/>
                          <span className="text-xs font-bold uppercase tracking-widest">異常詳情列表</span>
                       </div>
                       <div className="space-y-3">
                          {report.failures.map((fail, i) => (
                             <div key={i} className="flex gap-3 relative">
                                <div className="w-1 bg-red-500 rounded-full shrink-0"></div>
                                <div className="flex flex-col gap-1 w-full">
                                   <h4 className="text-sm font-bold text-slate-100">{fail.zoneLabel}</h4>
                                   <ul className="space-y-1">
                                      {fail.reasons.map((r, ri) => (
                                        <li key={ri} className="text-[11px] text-red-400 flex items-center gap-2 font-medium bg-red-500/5 p-1 rounded">
                                           <div className="w-1 h-1 rounded-full bg-red-500"></div>
                                           {r}
                                        </li>
                                      ))}
                                   </ul>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
              <div className="p-6 bg-black/20 border-t border-white/5 shrink-0">
                 <button onClick={() => setReport(null)} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-900/20 active:scale-95 transition-all">確認回報</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SecurityTab;