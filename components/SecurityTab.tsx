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
  CheckCircle2,
  Server,
  MinusCircle
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
  skippedCount: number; // 新增：跳過的數量（原本就處於目標狀態）
  successes: { zoneLabel: string; deviceCount: number }[];
  failures: { zoneLabel: string; reasons: string[] }[];
  skipped: { zoneLabel: string }[]; // 新增：未執行清單
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

// --- 主機面板組件 ---
const HostPanel: React.FC<{
  host: SiteNode;
  deviceStatuses: Record<string, DeviceStatus>;
  zoneArmState: ZoneArmState;
  handleArmClick: (zone: SiteNode) => void;
  handleGlobalArmClick: (host: SiteNode) => void;
  handleGlobalDisarmClick: (host: SiteNode) => void;
  onGoToSchedules: () => void;
}> = ({ host, deviceStatuses, zoneArmState, handleArmClick, handleGlobalArmClick, handleGlobalDisarmClick, onGoToSchedules }) => {
  const [isHostExpanded, setIsHostExpanded] = useState(true);
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
    host.children?.forEach(traverse);
    return list;
  }, [host, deviceStatuses]);

  const hasAnyAlarm = useMemo(() => {
    return zonesData.some(z => z.devices.some(d => d.status === 'triggered'));
  }, [zonesData]);

  const filteredZones = useMemo(() => {
    if (!deviceSearch) return zonesData;
    return zonesData.map(z => ({
      ...z,
      devices: z.devices.filter(d => d.label.toLowerCase().includes(deviceSearch.toLowerCase()))
    })).filter(z => z.devices.length > 0);
  }, [zonesData, deviceSearch]);

  const today = daysOptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todaySchedules = useMemo(() => MOCK_SUMMARY_SCHEDULES.filter(s => s.hostId === host.id && s.isActive && s.days.includes(today)), [host.id, today]);

  return (
    <div className="bg-[#0f172a]/30 border border-slate-800 rounded-2xl overflow-hidden mb-4 last:mb-0 transition-all shadow-md">
      <div 
        onClick={() => setIsHostExpanded(!isHostExpanded)}
        className="px-6 py-4 bg-[#1e293b]/40 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl border ${hasAnyAlarm ? 'bg-red-600/20 border-red-500/50 text-red-500' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
            <Server size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white italic tracking-widest uppercase">{host.label}</h3>
            <div className="flex items-center gap-3 mt-0.5">
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-[9px] font-black text-green-500 uppercase tracking-tighter">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> ONLINE
               </div>
               {hasAnyAlarm && (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600 border border-red-400 rounded text-[9px] font-black text-white uppercase tracking-tighter shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                    <ShieldAlert size={10}/> ALARMING
                 </div>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex gap-2 mr-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleGlobalArmClick(host); }} 
              className="px-3 py-1.5 bg-green-900/40 hover:bg-green-800/60 border border-green-700/50 text-green-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 uppercase tracking-widest shadow-md"
            >
              <Lock size={10} /> 全區設防
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleGlobalDisarmClick(host); }} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 uppercase tracking-widest shadow-md"
            >
              <Unlock size={10} /> 全區解除
            </button>
          </div>
           <div className="flex items-center gap-2">
              <Battery size={16} className="text-green-500" />
              <span className="text-[10px] font-mono font-black text-slate-400">92% <span className="opacity-40 ml-1">MAIN_PWR</span></span>
           </div>
           <div className="text-slate-600">{isHostExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
        </div>
      </div>

      {isHostExpanded && (
        <div className="p-6 space-y-10 bg-[#050914]/30 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div onClick={() => setIsScheduleExpanded(!isScheduleExpanded)} className="flex items-center justify-between cursor-pointer group">
              <h4 className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 group-hover:text-blue-400 transition-colors">
                <CalendarClock size={16} className="text-blue-500" /> 今日保全自動化摘要
              </h4>
              {isScheduleExpanded ? <ChevronUp size={14} className="text-slate-700" /> : <ChevronDown size={14} className="text-slate-700" />}
            </div>
            {isScheduleExpanded && (
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 shadow-inner">
                <div className="flex flex-col gap-2">
                   {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-xs bg-white/5 border border-white/5 rounded-lg px-4 py-2.5">
                         <span className="text-slate-200 font-black min-w-[70px] uppercase tracking-tighter">{s.zoneLabel}</span>
                         <span className="text-slate-700">|</span>
                         <span className="text-slate-400 font-bold">{s.name}</span>
                         <div className="ml-auto flex items-center gap-3 font-mono text-[10px]">
                            <span className="text-green-400 font-black">{s.armTime} ARM</span>
                            <ChevronRight size={10} className="text-slate-700"/>
                            <span className="text-blue-400 font-black">{s.disarmTime} DISARM</span>
                         </div>
                      </div>
                   )) : (
                      <div className="py-4 text-center text-[10px] text-slate-600 italic">此主機今日無自動化任務</div>
                   )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div onClick={() => setIsControlExpanded(!isControlExpanded)} className="flex items-center justify-between cursor-pointer group">
              <h4 className="text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 group-hover:text-green-400 transition-colors">
                <Shield size={16} className="text-green-500" /> 保全分區控管
              </h4>
              {isControlExpanded ? <ChevronUp size={14} className="text-slate-700" /> : <ChevronDown size={14} className="text-slate-700" />}
            </div>
            {isControlExpanded && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {zonesData.map(z => {
                    const isArmed = zoneArmState[z.node.id] === 'armed';
                    return (
                      <div 
                        key={z.node.id} 
                        onClick={() => handleArmClick(z.node)} 
                        className={`relative h-24 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center shadow-lg ${isArmed ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/10 border-green-700/50' : 'bg-[#111827] border-slate-800 hover:border-slate-700'}`}
                      >
                        <div className={`mb-1 transition-transform ${isArmed ? 'text-green-400' : 'text-slate-700'}`}>{isArmed ? <Shield size={24} /> : <Unlock size={24} />}</div>
                        <span className={`text-[10px] font-black truncate max-w-full px-2 text-center uppercase tracking-tighter ${isArmed ? 'text-green-100' : 'text-slate-500'}`}>{z.node.label}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div onClick={() => setIsDashboardExpanded(!isDashboardExpanded)} className="flex items-center gap-3 cursor-pointer group">
                 <Zap size={16} className="text-blue-500" />
                 <h4 className="text-white font-black text-[11px] uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">設備狀態儀表板</h4>
                 {isDashboardExpanded ? <ChevronUp size={14} className="text-slate-700" /> : <ChevronDown size={14} className="text-slate-700" />}
              </div>
              {isDashboardExpanded && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="查找..." 
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    className="bg-[#111827] border border-slate-700 rounded-lg py-1 pl-8 pr-3 text-[10px] text-white outline-none focus:border-blue-500 w-32 shadow-inner placeholder:text-slate-700" 
                  />
                  <Search size={12} className="absolute left-2.5 top-1.5 text-slate-600" />
                </div>
              )}
            </div>
            {isDashboardExpanded && (
              <div className="space-y-6">
                 {filteredZones.map(zone => (
                   <div key={zone.node.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                         <span className="px-2 py-0.5 bg-slate-800/80 text-slate-400 text-[9px] font-black rounded-md border border-slate-700 uppercase tracking-widest">{zone.node.label}</span>
                         <div className="h-px bg-slate-800/50 flex-1"></div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         {zone.devices.map(device => (
                           <DeviceCard key={device.id} device={device} />
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
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

  const hostNodes = useMemo(() => {
    return site.children?.filter(n => n.type === 'host') || [];
  }, [site]);

  return (
    <div className="bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden mb-10 shadow-xl">
      <div 
        onClick={() => setIsSiteExpanded(!isSiteExpanded)}
        className="px-8 py-6 bg-[#111827] flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800/50"
      >
        <div className="flex items-center gap-4">
          <Building2 size={24} className="text-blue-500" />
          <h2 className="text-xl font-black text-white tracking-tight italic">{site.label}</h2>
          <span className="text-[10px] font-black text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase tracking-widest">{hostNodes.length} 台連網主機</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-slate-600">{isSiteExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
        </div>
      </div>

      {isSiteExpanded && (
        <div className="p-8 bg-[#050914]/50 animate-in fade-in duration-300">
           {hostNodes.map(host => (
             <HostPanel 
               key={host.id}
               host={host}
               deviceStatuses={deviceStatuses}
               zoneArmState={zoneArmState}
               handleArmClick={handleArmClick}
               handleGlobalArmClick={handleGlobalArmClick}
               handleGlobalDisarmClick={handleGlobalDisarmClick}
               onGoToSchedules={onGoToSchedules}
             />
           ))}
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

  const checkZoneEligibility = (zoneId: string, zoneLabel: string): { success: boolean, reasons: string[] } => {
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
      // 點擊已設防分區 -> 觸發撤防確認視窗
      setArmConfirmConfig({ isOpen: true, site: null, action: 'disarm', zone: zone });
    } else {
      setArmConfirmConfig({ isOpen: true, site: null, action: 'arm', zone: zone });
    }
  };

  const executeAction = () => {
    const { site, action, zone } = armConfirmConfig;
    setArmConfirmConfig({ isOpen: false, site: null, action: null });

    const failures: ExecutionReport['failures'] = [];
    const successes: ExecutionReport['successes'] = [];
    const skipped: ExecutionReport['skipped'] = [];

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
      // 撤防邏輯
      targets.forEach(t => {
        const isCurrentlyArmed = zoneArmState[t.id] === 'armed';
        if (isCurrentlyArmed) {
          // 真的有佈防才執行成功
          successes.push({ zoneLabel: t.label, deviceCount: t.children?.filter(c => c.type === 'device').length || 0 });
          setZoneArmState(prev => ({ ...prev, [t.id]: 'disarmed' }));
        } else {
          // 原本就沒佈防 -> 列入跳過/未佈防清單
          skipped.push({ zoneLabel: t.label });
        }
      });
    }

    setReport({
      isOpen: true,
      siteLabel: site?.label || zone?.label || '自訂分區',
      action: action!,
      successCount: successes.length,
      failureCount: failures.length,
      skippedCount: skipped.length,
      successes,
      failures,
      skipped
    });
  };

  const isActionArm = armConfirmConfig.action === 'arm';

  return (
    <div className="flex flex-col h-full bg-[#050914] text-slate-200 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-10 space-y-4 pb-20">
        <div className="mb-12 flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white flex items-center gap-5 italic uppercase tracking-tighter"><Shield className="text-blue-500" size={40} /> Security Monitoring Center</h1>
          <p className="text-sm text-slate-500 font-medium ml-14">實時控管各據點、主機與分區之安防狀態、設備健康度及備援電力</p>
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
           <div className={`border rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full ring-1 ring-white/5 animate-in zoom-in-95 duration-200 text-center ${isActionArm ? 'bg-[#111827] border-slate-700' : 'bg-[#1a1b26] border-amber-900/30'}`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${isActionArm ? 'bg-blue-600/10 border-blue-500/20 text-blue-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                 {isActionArm ? <Shield size={40} /> : <Unlock size={40} />}
              </div>
              <h2 className={`text-2xl font-black mb-2 uppercase italic tracking-tighter ${isActionArm ? 'text-white' : 'text-amber-200'}`}>{isActionArm ? '保全設防確認' : '保全撤防確認'}</h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                您確定要對「{armConfirmConfig.site?.label || armConfirmConfig.zone?.label}」<br/>
                執行 <span className={`font-black ${isActionArm ? 'text-blue-400' : 'text-amber-400'}`}>{isActionArm ? '設防' : '撤防 (解除)'}</span> 操作嗎？
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={executeAction} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 text-white ${isActionArm ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'}`}>確認執行</button>
                 <button onClick={() => setArmConfirmConfig({ isOpen: false, site: null, action: null })} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-700 transition-all active:scale-95">返回</button>
              </div>
           </div>
        </div>
      )}

      {report?.isOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
           <div className={`border rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 ring-1 ring-white/5 flex flex-col max-h-[90vh] ${report.action === 'arm' ? 'bg-[#1b2333] border-slate-800' : 'bg-[#1c1d25] border-slate-800'}`}>
              <div className="p-6 flex items-center justify-between border-b border-white/5 shrink-0">
                 <div className="flex items-center gap-3">
                    {report.action === 'arm' ? <Shield className="text-blue-400" size={24}/> : <Unlock className="text-amber-400" size={24}/>}
                    <h2 className="text-xl font-bold text-slate-100">執行{report.action === 'arm' ? '設防' : '解除'}報告</h2>
                 </div>
                 <button onClick={() => setReport(null)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 <div className={`grid gap-4 ${report.action === 'disarm' && report.skippedCount > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div className="bg-[#142826] border border-emerald-900/50 rounded-lg p-5 flex flex-col items-center shadow-inner">
                       <span className="text-4xl font-black text-emerald-500 mb-1">{report.successCount}</span>
                       <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">SUCCESS</span>
                    </div>
                    {report.action === 'disarm' && report.skippedCount > 0 && (
                      <div className="bg-[#1e1e24] border border-slate-700/50 rounded-lg p-5 flex flex-col items-center shadow-inner">
                         <span className="text-4xl font-black text-slate-400 mb-1">{report.skippedCount}</span>
                         <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">NO_ARM</span>
                      </div>
                    )}
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
                          <span className="text-xs font-bold uppercase tracking-widest">{report.action === 'arm' ? '成功設防區域' : '成功解除區域'}</span>
                       </div>
                       <div className="space-y-3">
                          {report.successes.map((succ, i) => (
                             <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 transition-all hover:bg-white/10">
                                <span className="text-sm font-bold text-slate-100">{succ.zoneLabel}</span>
                                <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                   {succ.deviceCount} 個設備通訊正常
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* Skipped List (Disarm only) */}
                 {report.action === 'disarm' && report.skippedCount > 0 && (
                    <div className="bg-[#111827] rounded-xl p-5 border border-white/5 space-y-4">
                       <div className="flex items-center gap-2 text-slate-400">
                          <MinusCircle size={14}/>
                          <span className="text-xs font-bold uppercase tracking-widest">不需執行 (原本即未佈防)</span>
                       </div>
                       <div className="space-y-2">
                          {report.skipped.map((skip, i) => (
                             <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-slate-800">
                                <span className="text-sm font-bold text-slate-400">{skip.zoneLabel}</span>
                                <div className="text-[9px] font-black text-slate-600 uppercase">Already Disarmed</div>
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
                 <button onClick={() => setReport(null)} className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all text-white ${report.action === 'arm' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20'}`}>確認回報</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SecurityTab;