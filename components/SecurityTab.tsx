
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp,
  Shield, 
  ShieldAlert, 
  Unlock, 
  Lock, 
  Search, 
  Battery, 
  BatteryMedium, 
  BatteryLow, 
  Video, 
  DoorClosed, 
  DoorOpen, 
  BellRing, 
  Activity, 
  Cpu, 
  CreditCard,
  AlertCircle,
  CalendarClock,
  Plus,
  Trash2,
  User,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  LayoutGrid,
  Info,
  Pencil,
  Copy,
  UserCheck,
  Building2
} from 'lucide-react';
import { SiteNode } from '../types';
import { SITE_TREE_DATA } from '../constants';

// --- Types ---

interface DeviceStatus {
  id: string;
  status: 'normal' | 'triggered' | 'offline';
  batteryLevel?: number; // 0-100, undefined if wired
  isOnline: boolean;
}

interface ZoneArmState {
  [zoneId: string]: 'armed' | 'disarmed';
}

interface Schedule {
  id: string;
  name: string;
  zoneId: string; 
  zoneLabel: string;
  armTime: string;    
  disarmTime: string; 
  days: string[]; 
  isActive: boolean;
  createdBy: string;
}

interface SafetyCheckResult {
  safe: boolean;
  reasons: string[];
}

interface GlobalActionResult {
  type: 'arm' | 'disarm';
  successCount: number;
  failureCount: number;
  failures: { zone: string; reasons: string[] }[];
}

// --- Mock Data Generator ---
const generateMockDeviceStatus = (nodes: SiteNode[]): Record<string, DeviceStatus> => {
  const statusMap: Record<string, DeviceStatus> = {};
  const traverse = (n: SiteNode) => {
    if (n.type === 'device') {
      const isBatteryPowered = ['door', 'sensor', 'emergency'].includes(n.deviceType || '');
      statusMap[n.id] = {
        id: n.id,
        status: Math.random() > 0.95 ? 'triggered' : 'normal',
        isOnline: Math.random() > 0.05,
        batteryLevel: isBatteryPowered ? Math.floor(Math.random() * 100) : undefined
      };
    }
    if (n.children) n.children.forEach(traverse);
  };
  nodes.forEach(traverse);
  return statusMap;
};

// --- Constants ---
const daysOptions = ['一', '二', '三', '四', '五', '六', '日'];

// --- Component: Site Section ---
const SiteSection: React.FC<{
  site: SiteNode;
  deviceStatuses: Record<string, DeviceStatus>;
  zoneArmState: ZoneArmState;
  handleArmClick: (zoneId: string, label: string) => void;
  handleGlobalArm: (zones: SiteNode[], siteId: string) => void;
  handleGlobalDisarm: (zones: SiteNode[]) => void;
  schedules: Schedule[];
  openScheduleManager: (site: SiteNode) => void;
}> = ({ site, deviceStatuses, zoneArmState, handleArmClick, handleGlobalArm, handleGlobalDisarm, schedules, openScheduleManager }) => {
  const [isSiteExpanded, setIsSiteExpanded] = useState(true);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);
  const [isControlExpanded, setIsControlExpanded] = useState(true);
  const [isDeviceExpanded, setIsDeviceExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const zones = useMemo(() => site.children?.filter(c => c.type === 'zone') || [], [site]);
  const today = daysOptions[new Date().getDay()];
  const siteSchedules = useMemo(() => schedules.filter(s => zones.some(z => z.id === s.zoneId)), [schedules, zones]);
  const todaySchedules = useMemo(() => siteSchedules.filter(s => s.isActive && s.days.includes(today)), [siteSchedules, today]);

  const getBatteryIcon = (level: number) => {
    if (level > 60) return <Battery size={12} className="text-green-400" />;
    if (level > 20) return <BatteryMedium size={12} className="text-yellow-400" />;
    return <BatteryLow size={12} className="text-red-500 animate-pulse" />;
  };

  const getDeviceIcon = (type: string | undefined, status: DeviceStatus) => {
    const colorClass = status.status === 'triggered' ? 'text-red-500' : status.isOnline ? 'text-blue-400' : 'text-slate-600';
    switch (type) {
      case 'camera': return <Video className={colorClass} />;
      case 'door': return status.status === 'triggered' ? <DoorOpen className="text-red-500" /> : <DoorClosed className="text-green-400" />;
      case 'emergency': return <BellRing className={status.status === 'triggered' ? 'text-red-600 animate-bounce' : 'text-slate-400'} />;
      case 'sensor': return status.id.includes('pir') ? <Activity className={colorClass} /> : <Cpu className={colorClass} />;
      default: return <CreditCard className={colorClass} />;
    }
  };

  return (
    <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden mb-6">
      <div 
        onClick={() => setIsSiteExpanded(!isSiteExpanded)}
        className="px-6 py-4 bg-[#111827] flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building2 size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold text-white">{site.label}</h2>
          <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{zones.length} 個分區</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleGlobalArm(zones, site.id); }}
              className="px-3 py-1.5 bg-green-900/40 hover:bg-green-800/60 border border-green-700/50 text-green-300 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5"
            >
              <Lock size={12} /> 全區設防
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleGlobalDisarm(zones); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5"
            >
              <Unlock size={12} /> 全區解除
            </button>
          </div>
          <div className="text-slate-500">
            {isSiteExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isSiteExpanded && (
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div 
              onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
              className="flex items-center justify-between cursor-pointer group"
            >
              <h3 className="text-slate-300 text-sm font-bold flex items-center gap-2">
                 <CalendarClock size={16} className="text-blue-500" /> 排程自動化
              </h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); openScheduleManager(site); }}
                  className="text-[10px] px-2 py-1 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 rounded border border-blue-700/50 transition-all font-medium flex items-center gap-1"
                >
                  <Plus size={12} /> 管理排程
                </button>
                {isScheduleExpanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
              </div>
            </div>
            
            {isScheduleExpanded && (
              <div className="bg-[#0f172a] rounded-lg p-4 border border-slate-800/50 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-3">
                   <Clock size={14} className="text-slate-500" />
                   <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">今日自動化摘要</span>
                </div>
                <div className="flex flex-col gap-2">
                   {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs bg-slate-900/40 border border-slate-800 rounded px-3 py-2">
                         <span className="text-slate-200 font-bold min-w-[70px]">{s.zoneLabel}</span>
                         <span className="text-slate-600">｜</span>
                         <span className="text-blue-200 font-medium">{s.name}</span>
                         <span className="text-slate-600">｜</span>
                         <span className="font-mono text-white bg-green-900/20 px-1.5 py-0.5 rounded border border-green-800/50">{s.armTime} 設防</span>
                         <span className="text-slate-600">｜</span>
                         <span className="font-mono text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{s.disarmTime} 解除</span>
                      </div>
                   )) : (
                      <span className="text-xs text-slate-600 italic">今日無預設排程任務</span>
                   )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div 
              onClick={() => setIsControlExpanded(!isControlExpanded)}
              className="flex items-center justify-between cursor-pointer"
            >
              <h3 className="text-slate-300 text-sm font-bold flex items-center gap-2">
                <Shield size={16} className="text-green-500" /> 保全啟閉控制
              </h3>
              {isControlExpanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
            </div>

            {isControlExpanded && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {zones.map(zone => {
                    const isArmed = zoneArmState[zone.id] === 'armed';
                    return (
                      <div 
                        key={zone.id}
                        onClick={() => handleArmClick(zone.id, zone.label)}
                        className={`relative group h-20 flex-shrink-0 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center shadow-lg
                          ${isArmed 
                            ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/10 border-green-700/50 hover:border-green-500' 
                            : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-500'
                          }`}
                      >
                        <div className={`mb-1 ${isArmed ? 'text-green-400' : 'text-slate-500'}`}>
                          {isArmed ? <Shield size={20} /> : <Unlock size={20} />}
                        </div>
                        <span className={`text-xs font-bold truncate max-w-full px-2 ${isArmed ? 'text-green-100' : 'text-slate-400'}`}>{zone.label}</span>
                        <div className={`text-[9px] mt-1 px-1.5 py-0.5 rounded-sm font-bold tracking-tighter ${isArmed ? 'bg-green-900 text-green-300' : 'bg-slate-800 text-slate-500'}`}>
                          {isArmed ? 'ARMED' : 'DISARMED'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div 
              onClick={() => setIsDeviceExpanded(!isDeviceExpanded)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <h3 className="text-slate-300 text-sm font-bold flex items-center gap-2">
                  <Activity size={16} className="text-blue-400" /> 設備狀態儀表板
                </h3>
                <div className="relative w-48 h-8 group" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    placeholder="查找設備..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-full bg-slate-900/50 border border-slate-800 text-slate-300 text-[10px] rounded-md pl-7 pr-3 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-600" />
                </div>
              </div>
              {isDeviceExpanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
            </div>

            {isDeviceExpanded && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {zones.map(zone => {
                  const displayDevices = zone.children?.filter(d => 
                    searchTerm === '' || d.label.toLowerCase().includes(searchTerm.toLowerCase())
                  ) || [];
                  if (displayDevices.length === 0 && searchTerm !== '') return null;

                  return (
                    <div key={zone.id} className="bg-black/20 rounded-lg border border-slate-800/50 p-4">
                      <div className="flex items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded mr-3">{zone.label}</span>
                        <div className="flex-1 h-px bg-slate-800/50"></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {displayDevices.map(device => {
                          const status = deviceStatuses[device.id] || { id: device.id, status: 'offline', isOnline: false };
                          return (
                            <div key={device.id} className="bg-[#162032]/40 rounded-lg p-3 border border-slate-700/30 flex flex-col items-center justify-center relative group hover:bg-[#1e293b]/50 transition-colors">
                              <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${status.isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-slate-600'}`}></div>
                              <div className="mb-2 p-2 bg-slate-800/50 rounded-lg group-hover:scale-110 transition-transform">
                                {getDeviceIcon(device.deviceType, status)}
                              </div>
                              <span className="font-medium text-[11px] text-slate-300 mb-0.5 text-center truncate w-full px-1">{device.label}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-tighter ${status.status === 'triggered' ? 'text-red-400' : status.status === 'normal' ? 'text-green-500' : 'text-slate-600'}`}>
                                {status.status === 'triggered' ? 'ALARM' : status.status === 'normal' ? 'NORMAL' : 'OFFLINE'}
                              </span>
                              {status.batteryLevel !== undefined && (
                                <div className="flex items-center gap-1 mt-1.5 bg-black/40 px-1.5 py-0.5 rounded border border-slate-800/50">
                                   {getBatteryIcon(status.batteryLevel!)}
                                   <span className={`text-[9px] font-mono ${status.batteryLevel! < 20 ? 'text-red-400' : 'text-slate-500'}`}>
                                     {status.batteryLevel}%
                                   </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SecurityTab: React.FC = () => {
  const [zoneArmState, setZoneArmState] = useState<ZoneArmState>({});
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceStatus>>({});
  const [armModalConfig, setArmModalConfig] = useState<{isOpen: boolean, zoneId: string | null, zoneLabel: string} | null>(null);
  const [isArmingProcessing, setIsArmingProcessing] = useState(false);
  const [armError, setArmError] = useState<string | null>(null);
  const [globalResult, setGlobalResult] = useState<GlobalActionResult | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [currentManagedSite, setCurrentManagedSite] = useState<SiteNode | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: 's2', name: '夜間防護', zoneId: 'commercial', zoneLabel: '商研中心', armTime: '22:00', disarmTime: '06:00', days: ['一', '二', '三', '四', '五', '六', '日'], isActive: true, createdBy: '系統管理員' }
  ]);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({ days: [], isActive: true, createdBy: 'Admin' });

  useEffect(() => {
    setDeviceStatuses(generateMockDeviceStatus(SITE_TREE_DATA));
  }, []);

  const allSites = useMemo(() => {
    const sites: SiteNode[] = [];
    const traverse = (nodes: SiteNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'site') sites.push(node);
        if (node.children) traverse(node.children);
      });
    };
    traverse(SITE_TREE_DATA);
    return sites;
  }, []);

  const checkZoneSafety = (zoneId: string, siteZones: SiteNode[]): SafetyCheckResult => {
    const zone = siteZones.find(z => z.id === zoneId);
    const devices = zone?.children || [];
    const reasons: string[] = [];
    devices.forEach(d => {
       const status = deviceStatuses[d.id];
       if (['sensor', 'door', 'emergency'].includes(d.deviceType || '')) {
           if (!status?.isOnline) reasons.push(`${d.label} 離線`);
           else if (status?.status === 'triggered') reasons.push(`${d.label} 處於${d.deviceType === 'door' ? '開啟' : '觸發'}狀態`);
       }
    });
    return { safe: reasons.length === 0, reasons };
  };

  const handleArmClick = (zoneId: string, label: string) => {
    if (zoneArmState[zoneId] === 'armed') {
      setZoneArmState(prev => ({ ...prev, [zoneId]: 'disarmed' }));
    } else {
      setArmModalConfig({ isOpen: true, zoneId, zoneLabel: label });
      setArmError(null);
    }
  };

  const confirmArming = () => {
    if (!armModalConfig?.zoneId) return;
    setIsArmingProcessing(true);
    setTimeout(() => {
      const siteZones: SiteNode[] = [];
      allSites.forEach(s => siteZones.push(...(s.children?.filter(c => c.type === 'zone') || [])));
      const check = checkZoneSafety(armModalConfig.zoneId!, siteZones);
      if (!check.safe) {
        setArmError(`啟動失敗：${check.reasons.join('、')}`);
        setIsArmingProcessing(false);
      } else {
        setZoneArmState(prev => ({ ...prev, [armModalConfig.zoneId!]: 'armed' }));
        setIsArmingProcessing(false);
        setArmModalConfig(null);
      }
    }, 800);
  };

  const handleGlobalArm = (zones: SiteNode[], siteId: string) => {
    const newArmState = { ...zoneArmState };
    const result: GlobalActionResult = { type: 'arm', successCount: 0, failureCount: 0, failures: [] };
    
    zones.forEach(zone => {
        // 統一透過 checkZoneSafety 函數進行動態安全檢查，不再對中山處進行強制失敗設定
        const check = checkZoneSafety(zone.id, zones);
        if (check.safe) {
            newArmState[zone.id] = 'armed';
            result.successCount++;
        } else {
            result.failureCount++;
            result.failures.push({ zone: zone.label, reasons: check.reasons });
        }
    });
    setZoneArmState(newArmState);
    setGlobalResult(result);
  };

  const handleGlobalDisarm = (zones: SiteNode[]) => {
    const newArmState = { ...zoneArmState };
    zones.forEach(zone => { newArmState[zone.id] = 'disarmed'; });
    setZoneArmState(newArmState);
    setGlobalResult({ type: 'disarm', successCount: zones.length, failureCount: 0, failures: [] });
  };

  const handleSaveSchedule = () => {
    if (!newSchedule.name || !newSchedule.zoneId || !newSchedule.armTime || !newSchedule.disarmTime) return;
    const siteZones = currentManagedSite?.children?.filter(c => c.type === 'zone') || [];
    const zoneLabel = siteZones.find(z => z.id === newSchedule.zoneId)?.label || '未知分區';
    
    if (editingScheduleId) {
      setSchedules(schedules.map(s => s.id === editingScheduleId ? { ...s, ...newSchedule as Schedule, zoneLabel } : s));
      setEditingScheduleId(null);
    } else {
      setSchedules([...schedules, { id: Date.now().toString(), name: newSchedule.name!, zoneId: newSchedule.zoneId!, zoneLabel, armTime: newSchedule.armTime!, disarmTime: newSchedule.disarmTime!, days: newSchedule.days || [], isActive: true, createdBy: 'Admin' }]);
    }
    setNewSchedule({ days: [], isActive: true, createdBy: 'Admin' });
  };

  const openScheduleManager = (site: SiteNode) => {
    setCurrentManagedSite(site);
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#050914] text-slate-200 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-blue-500" /> 保全管理中心
          </h1>
          <p className="text-sm text-slate-500">檢視各站點的保全狀態、排程任務與設備健康度</p>
        </div>

        {allSites.map(site => (
          <SiteSection 
            key={site.id} 
            site={site} 
            deviceStatuses={deviceStatuses}
            zoneArmState={zoneArmState}
            handleArmClick={handleArmClick}
            handleGlobalArm={handleGlobalArm}
            handleGlobalDisarm={handleGlobalDisarm}
            schedules={schedules}
            openScheduleManager={openScheduleManager}
          />
        ))}
      </div>

      {globalResult && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {globalResult.type === 'arm' ? <Shield size={24} className="text-blue-400"/> : <Unlock size={24} className="text-slate-400"/>}
                        {globalResult.type === 'arm' ? '執行設防報告' : '執行解除報告'}
                    </h3>
                    <button onClick={() => setGlobalResult(null)} className="text-slate-500 hover:text-white"><XCircle size={20}/></button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-900/20 border border-green-800 rounded p-3 text-center">
                        <span className="block text-2xl font-bold text-green-400">{globalResult.successCount}</span>
                        <span className="text-xs text-green-200">成功</span>
                    </div>
                    <div className={`bg-red-900/20 border border-red-800 rounded p-3 text-center ${globalResult.failureCount === 0 ? 'opacity-30' : ''}`}>
                        <span className="block text-2xl font-bold text-red-400">{globalResult.failureCount}</span>
                        <span className="text-xs text-red-200">失敗</span>
                    </div>
                </div>
                {globalResult.failureCount > 0 && (
                  <div className="bg-slate-900/50 rounded p-4 max-h-60 overflow-y-auto custom-scrollbar border border-slate-700">
                      <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-1.5"><AlertTriangle size={14}/> 異常詳情</h4>
                      <ul className="space-y-3">{globalResult.failures.map((fail, idx) => (<li key={idx} className="text-sm border-l-2 border-red-500 pl-3"><div className="font-bold text-slate-200">{fail.zone}</div><ul className="mt-1 space-y-0.5">{fail.reasons.map((reason, rIdx) => (<li key={rIdx} className="text-xs text-red-200/80">• {reason}</li>))}</ul></li>))}</ul>
                  </div>
                )}
                <button onClick={() => setGlobalResult(null)} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold">確認</button>
            </div>
         </div>
      )}

      {armModalConfig?.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl max-sm w-full p-6 animate-in zoom-in duration-200">
             <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-900/50 rounded-lg text-blue-400"><ShieldAlert size={24} /></div>
                <div><h3 className="text-lg font-bold text-white">確認啟動保全?</h3><p className="text-xs text-slate-400">{armModalConfig.zoneLabel}</p></div>
             </div>
             <div className="mb-6 bg-slate-900/50 p-4 rounded-lg text-xs text-slate-300 border border-slate-700/50">
                <p className="font-bold mb-2 flex items-center gap-1.5 text-blue-300"><Info size={12}/> 安全檢查項目：</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400"><li>感測器連線狀態確認</li><li>門窗磁簧迴路檢查</li><li>排除緊急告警中設備</li></ul>
             </div>
             {armError && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded flex items-start space-x-2"><AlertCircle size={14} className="text-red-500 mt-0.5" /><span className="text-xs text-red-200">{armError}</span></div>}
             <div className="flex space-x-3">
                <button onClick={() => { setArmModalConfig(null); setArmError(null); }} className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold">取消</button>
                <button onClick={confirmArming} disabled={isArmingProcessing} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  {isArmingProcessing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Lock size={14} className="mr-2" /> 啟動</>}
                </button>
             </div>
          </div>
        </div>
      )}

      {isScheduleModalOpen && currentManagedSite && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1e293b] border border-slate-600 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3"><CalendarClock className="text-blue-400" size={24} /><h2 className="text-xl font-bold text-white tracking-tight">{currentManagedSite.label} - 排程管理</h2></div>
                <button onClick={() => setIsScheduleModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-400">✕</button>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="flex-1 p-6 overflow-y-auto border-r border-slate-700 custom-scrollbar space-y-4">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">排程清單</h3>
                   <div className="space-y-4">
                      {schedules.filter(s => currentManagedSite.children?.some(z => z.id === s.zoneId)).map(schedule => (
                        <div key={schedule.id} className={`p-5 rounded-xl border transition-all ${schedule.isActive ? 'bg-[#1e293b] border-blue-900/30' : 'bg-slate-900/30 border-slate-800'} flex justify-between items-start group`}>
                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2"><span className={`font-bold text-sm ${schedule.isActive ? 'text-white' : 'text-slate-500'}`}>{schedule.name}</span><span className="text-[10px] px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded-full border border-blue-800/50">{schedule.zoneLabel}</span></div>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-3"><div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg font-mono"><Clock size={12}/><span className="text-green-400">{schedule.armTime} 設防</span><span className="text-slate-600">→</span><span className="text-blue-300">{schedule.disarmTime} 解除</span></div><span>{schedule.days.join(' ')}</span></div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500"><UserCheck size={12}/><span>設置人員：<span className="text-slate-300 font-bold">{schedule.createdBy}</span></span></div>
                           </div>
                           <div className="flex flex-col items-end gap-4 ml-4">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={schedule.isActive} onChange={() => setSchedules(schedules.map(s => s.id === schedule.id ? { ...s, isActive: !s.isActive } : s))} />
                                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                              </label>
                              <div className="flex gap-2">
                                <button onClick={() => { setEditingScheduleId(schedule.id); setNewSchedule(schedule); }} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg border border-slate-800 hover:border-blue-800"><Pencil size={15} /></button>
                                <button onClick={() => setSchedules([...schedules, { ...schedule, id: Date.now().toString(), name: `${schedule.name} (複製)` }])} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg border border-slate-800 hover:border-emerald-800"><Copy size={15} /></button>
                                <button onClick={() => setSchedules(schedules.filter(s => s.id !== schedule.id))} className="p-2 text-slate-400 hover:text-red-400 rounded-lg border border-slate-800 hover:border-red-800"><Trash2 size={15} /></button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="w-full md:w-80 p-6 bg-slate-900/50 flex flex-col gap-5 border-l border-slate-700">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">{editingScheduleId ? <Pencil size={16} /> : <Plus size={16} />} {editingScheduleId ? '編輯任務' : '新增任務'}</h3>
                   <div className="space-y-4">
                      <div className="space-y-1.5"><label className="block text-[10px] font-bold text-slate-500">任務名稱</label><input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none" placeholder="夜間設防" value={newSchedule.name || ''} onChange={e => setNewSchedule({...newSchedule, name: e.target.value})} /></div>
                      <div className="space-y-1.5"><label className="block text-[10px] font-bold text-slate-500">適用分區</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none" value={newSchedule.zoneId || ''} onChange={e => setNewSchedule({...newSchedule, zoneId: e.target.value})}><option value="">請選擇分區...</option>{currentManagedSite.children?.filter(z => z.type === 'zone').map(z => <option key={z.id} value={z.id}>{z.label}</option>)}</select></div>
                      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><label className="block text-[10px] font-bold text-green-400 uppercase"><Lock size={10} className="inline mr-1"/>設防時間</label><input type="time" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none" value={newSchedule.armTime || ''} onChange={e => setNewSchedule({...newSchedule, armTime: e.target.value})} /></div><div className="space-y-1.5"><label className="block text-[10px] font-bold text-blue-400 uppercase"><Unlock size={10} className="inline mr-1"/>解除時間</label><input type="time" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none" value={newSchedule.disarmTime || ''} onChange={e => setNewSchedule({...newSchedule, disarmTime: e.target.value})} /></div></div>
                      <div className="space-y-2"><label className="block text-[10px] font-bold text-slate-500 uppercase">重複週期</label><div className="flex flex-wrap gap-2">{daysOptions.map(day => (<button key={day} onClick={() => { const current = newSchedule.days || []; const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day]; setNewSchedule({...newSchedule, days: updated}); }} className={`w-8 h-8 rounded-lg text-[10px] font-bold border transition-all ${newSchedule.days?.includes(day) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{day}</button>))}</div></div>
                      <button onClick={handleSaveSchedule} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/40">{editingScheduleId ? '儲存修改' : '建立排程'}</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityTab;
