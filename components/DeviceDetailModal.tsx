import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Shield,
  Zap,
  LayoutList,
  BarChart3,
  User,
  Monitor,
  ArrowLeftRight,
  History as HistoryIcon,
  TrendingUp,
  Download,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Settings2,
  CheckSquare,
  Square as SquareIcon,
  Crosshair,
  Building2,
  FolderOpen,
  UserSearch,
  Eye,
  EyeOff,
  Sparkles,
  ListRestart,
  Activity,
  AlertTriangle,
  Clock
} from 'lucide-react';

// --- Import Site Specific Tabs ---
import SiteDailyOverview from './SiteDailyOverview';
import SiteCumulativeAnalysis from './SiteCumulativeAnalysis';
import SiteTimeComparison from './SiteTimeComparison';
import SiteDeviceComparison from './SiteDeviceComparison';
import SiteBehaviorProfile from './SiteBehaviorProfile';

// --- Import Device Specific Tabs ---
import SecurityInfo from './SecurityInfo';
import ScenarioInfo from './ScenarioInfo';
import DeviceInfo from './DeviceInfo';
import HistoricalTrends from './HistoricalTrends';
import SpaceFlowTrends from './SpaceFlowTrends';
import SpaceHeatTrends from './SpaceHeatTrends';
import SpaceCoordinateMap from './SpaceCoordinateMap';
import TriggerHistory from './TriggerHistory';
import PeriodHistory from './PeriodHistory';

// --- Import Zone Specific Content ---
import ZoneDetailView from './ZoneDetailView';

import { SiteNode, MainNavType } from '../types';
import { SITE_TREE_DATA } from '../constants';

interface DeviceDetailModalProps {
  slot: {
    id: string;
    label: string;
    nodeType?: string;
  } | null;
  onClose: () => void;
  onJumpToNav?: (nav: MainNavType, subTab?: string) => void;
}

const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ slot, onClose, onJumpToNav }) => {
  if (!slot) return null;

  const [activeDetailTab, setActiveDetailTab] = useState('');
  const [activeZoneSubTab, setActiveZoneSubTab] = useState<string>('schedule');
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Site logic states
  const [confirmedStatsDevices, setConfirmedStatsDevices] = useState<Set<string>>(new Set());
  const [pendingStatsDevices, setPendingStatsDevices] = useState<Set<string>>(new Set());
  const [exportTabs, setExportTabs] = useState<Set<string>>(new Set(['daily', 'cumulative', 'comparison', 'device', 'behavior']));
  const [isExporting, setIsExporting] = useState(false);

  // Zone logic states
  const [selectedZoneDeviceIds, setSelectedZoneDeviceIds] = useState<Set<string>>(new Set());
  const [showArmedPeriods, setShowArmedPeriods] = useState(true);
  const [showScenarioPeriods, setShowScenarioPeriods] = useState(false);
  const [showScenarioTriggers, setShowScenarioTriggers] = useState(false);
  const [statsDurationFilter, setStatsDurationFilter] = useState<Set<string>>(new Set(['armed', 'scenario']));
  const [statsFrequencyFilter, setStatsFrequencyFilter] = useState<Set<string>>(new Set(['general', 'security', 'scenario']));

  const findNode = (nodes: SiteNode[], targetId: string): SiteNode | null => {
    for (const n of nodes) {
      if (n.id === targetId) return n;
      if (n.children) {
        const res = findNode(n.children, targetId);
        if (res) return res;
      }
    }
    return null;
  };

  const eligibleStatsDevices = useMemo(() => {
    if (!slot || slot.nodeType !== 'site') return [];
    const devices: SiteNode[] = [];
    const traverse = (node: SiteNode) => {
      if (node.type === 'device' && node.label.includes('空間偵測器') && node.label.includes('人流')) {
        devices.push(node);
      }
      node.children?.forEach(traverse);
    };
    const siteNode = findNode(SITE_TREE_DATA, slot.id);
    if (siteNode) traverse(siteNode);
    return devices;
  }, [slot]);

  const zoneChildDevices = useMemo(() => {
    if (!slot || slot.nodeType !== 'zone') return [];
    const devices: SiteNode[] = [];
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') {
        const label = node.label.toUpperCase();
        const isExcluded = label.includes('WEB CAM') || 
                           label.includes('IPC') || 
                           label.includes('人流') || 
                           label.includes('熱度');
        if (!isExcluded) devices.push(node);
      }
      node.children?.forEach(traverse);
    };
    const zoneNode = findNode(SITE_TREE_DATA, slot.id);
    if (zoneNode) traverse(zoneNode);
    return devices;
  }, [slot]);

  useEffect(() => {
    if (slot.nodeType === 'site' && eligibleStatsDevices.length > 0) {
      const allIds = eligibleStatsDevices.map(d => d.id);
      setConfirmedStatsDevices(new Set(allIds));
      setPendingStatsDevices(new Set(allIds));
    }
    if (slot.nodeType === 'zone' && zoneChildDevices.length > 0) {
      setSelectedZoneDeviceIds(new Set(zoneChildDevices.map(d => d.id)));
    }
    
    // Initial tab selection
    if (slot.nodeType === 'site') {
      setActiveDetailTab('site_daily_overview');
    } else if (slot.nodeType === 'zone') {
      setActiveDetailTab('zone_main');
      setActiveZoneSubTab('schedule');
    } else {
      const isPeriodButton = slot.label.includes('多功能按鈕') && slot.label.includes('時段');
      const isTriggerType = ['多功能按鈕', '門磁', 'PIR', 'SOS'].some(kw => slot.label.includes(kw));
      if (isPeriodButton) setActiveDetailTab('period_history');
      else if (isTriggerType) setActiveDetailTab('trigger_history');
      else if (slot.label.includes('空間偵測器')) setActiveDetailTab('coordinate_map');
      else if (slot.label.includes('環境偵測器')) setActiveDetailTab('historical_trends');
      else setActiveDetailTab('security_info');
    }
  }, [slot.id]);

  const availableTabs = useMemo(() => {
    if (!slot || slot.nodeType === 'zone') return [];
    if (slot.nodeType === 'site') {
      return [
        { id: 'site_daily_overview', label: '當日人流總覽', icon: <LayoutList size={14}/> },
        { id: 'site_cumulative_analysis', label: '歷史累計趨勢', icon: <BarChart3 size={14}/> },
        { id: 'site_time_comparison', label: '多時段對比分析', icon: <ArrowLeftRight size={14}/> },
        { id: 'site_device_comparison', label: '入口貢獻排行', icon: <Monitor size={14}/> },
        { id: 'site_behavior_profile', label: '行為輪廓特徵', icon: <User size={14}/> }
      ];
    }

    const tabs = [];
    const isPeriodButton = slot.label.includes('多功能按鈕') && slot.label.includes('時段');
    const isNormalTrigger = ['多功能按鈕', '門磁', 'PIR', 'SOS'].some(kw => slot.label.includes(kw)) && !isPeriodButton;
    
    if (isPeriodButton) tabs.push({ id: 'period_history', label: '時段紀錄', icon: <HistoryIcon size={14}/> });
    else if (isNormalTrigger) tabs.push({ id: 'trigger_history', label: '觸發紀錄', icon: <HistoryIcon size={14}/> });
    
    if (slot.label.includes('空間偵測器')) tabs.push({ id: 'coordinate_map', label: '座標圖', icon: <Crosshair size={14}/> });
    if (slot.label.includes('環境偵測器')) tabs.push({ id: 'historical_trends', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
    else if (slot.label.includes('空間偵測器')) tabs.push({ id: 'space_trends', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
    
    tabs.push(
      { id: 'security_info', label: '保全資訊', icon: <Shield size={14}/> },
      { id: 'scenario_info', label: '情境資訊', icon: <Zap size={14}/> },
      { id: 'device_info', label: '設備資訊', icon: <Cpu size={14}/> }
    );
    return tabs;
  }, [slot]);

  const applyStatsDeviceSelection = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setConfirmedStatsDevices(new Set(pendingStatsDevices));
      setIsRecalculating(false);
    }, 1200);
  };

  const isStatsChanged = confirmedStatsDevices.size !== pendingStatsDevices.size || 
    Array.from(confirmedStatsDevices).some(id => !pendingStatsDevices.has(id));

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative max-w-[1600px] w-full bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] ring-1 ring-white/5 text-center">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0 text-left">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl">
              {slot.nodeType === 'site' ? <Building2 size={28}/> : 
               slot.nodeType === 'zone' ? <FolderOpen size={28}/> : <Cpu size={28}/>}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{slot.label}</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">SKS Infrastructure Node / UID: {slot.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all"><X size={32} /></button>
        </div>

        {slot.nodeType === 'zone' ? (
          <div className="flex-1 overflow-hidden flex">
             <div className="flex-1 relative overflow-hidden flex flex-col bg-[#0a0f1e]/50">
                <ZoneDetailView 
                  zoneId={slot.id} 
                  zoneLabel={slot.label} 
                  selectedDeviceIds={selectedZoneDeviceIds}
                  showArmedPeriods={showArmedPeriods}
                  showScenarioPeriods={showScenarioPeriods}
                  showScenarioTriggers={showScenarioTriggers}
                  statsDurationFilter={statsDurationFilter}
                  statsFrequencyFilter={statsFrequencyFilter}
                  onTabChange={(tab) => setActiveZoneSubTab(tab)}
                />
             </div>
             <div className="w-[380px] border-l border-slate-800 bg-[#0b1121] flex flex-col shrink-0 p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4 duration-300 text-left">
                <div className="space-y-10">
                  {activeZoneSubTab === 'schedule' && (
                    <div className="space-y-6">
                        <button onClick={() => alert("正在下載時序分析圖表...")} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all mb-6 shadow-xl shadow-blue-900/20 ring-1 ring-white/10"><Download size={18}/> 下載時序報表</button>
                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Settings2 size={18} className="text-blue-500" /><h4 className="text-xs font-black text-white uppercase tracking-widest italic">保全顯示設定</h4></div></div>
                        <button onClick={() => setShowArmedPeriods(!showArmedPeriods)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${showArmedPeriods ? 'bg-emerald-600/10 border-emerald-500/50 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-600'}`}><div className="flex items-center gap-3 min-w-0">{showArmedPeriods ? <Eye size={16} className="text-emerald-400"/> : <EyeOff size={16} className="text-slate-700"/>}<span className={`text-[11px] font-bold truncate ${showArmedPeriods ? 'text-slate-200' : 'text-slate-600'}`}>顯示保全時段</span></div><div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showArmedPeriods ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showArmedPeriods ? 'left-6' : 'left-1'}`}></div></div></button>
                        <div className="space-y-2 border-t border-slate-800 pt-4">{zoneChildDevices.map(dev => (<button key={dev.id} onClick={() => { const next = new Set(selectedZoneDeviceIds); if(next.has(dev.id)) next.delete(dev.id); else next.add(dev.id); setSelectedZoneDeviceIds(next); }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedZoneDeviceIds.has(dev.id) ? 'bg-blue-600/10 border-blue-500/50 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-600'}`}><div className="flex items-center gap-3 min-w-0"><div className={selectedZoneDeviceIds.has(dev.id) ? 'text-blue-400' : 'text-slate-700'}>{dev.label.includes('門磁') ? <FolderOpen size={16}/> : <Cpu size={16}/>}</div><span className={`text-[11px] font-bold truncate ${selectedZoneDeviceIds.has(dev.id) ? 'text-slate-200' : 'text-slate-600'}`}>{dev.label}</span></div>{selectedZoneDeviceIds.has(dev.id) ? <CheckSquare size={16} className="text-blue-500" /> : <SquareIcon size={16} className="text-slate-800" />}</button>))}</div>
                        <div className="pt-8 border-t border-slate-800 space-y-4"><div className="flex items-center gap-3"><Sparkles size={16} className="text-indigo-400" /><h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">情境顯示設定</h4></div><button onClick={() => setShowScenarioPeriods(!showScenarioPeriods)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${showScenarioPeriods ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-600'}`}><div className="flex items-center gap-3 min-w-0">{showScenarioPeriods ? <Eye size={16} className="text-indigo-400"/> : <EyeOff size={16} className="text-slate-700"/>}<span className={`text-[11px] font-bold truncate ${showScenarioPeriods ? 'text-slate-200' : 'text-slate-600'}`}>顯示情境時段</span></div><div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showScenarioPeriods ? 'bg-indigo-600' : 'bg-slate-800'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showScenarioPeriods ? 'left-6' : 'left-1'}`}></div></div></button><button onClick={() => setShowScenarioTriggers(!showScenarioTriggers)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${showScenarioTriggers ? 'bg-fuchsia-600/10 border-fuchsia-500/50 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-600'}`}><div className="flex items-center gap-3 min-w-0">{showScenarioTriggers ? <Eye size={16} className="text-fuchsia-400"/> : <EyeOff size={16} className="text-slate-700"/>}<span className={`text-[11px] font-bold truncate ${showScenarioTriggers ? 'text-slate-200' : 'text-slate-600'}`}>顯示情境執行點</span></div><div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showScenarioTriggers ? 'bg-fuchsia-600' : 'bg-slate-800'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showScenarioTriggers ? 'left-6' : 'left-1'}`}></div></div></button></div>
                    </div>
                  )}
                  {activeZoneSubTab === 'logs' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                       <div className="space-y-6">
                          <div className="flex items-center gap-3"><Clock size={18} className="text-blue-500" /><h4 className="text-xs font-black text-white uppercase tracking-widest italic">時長對比篩選</h4></div>
                          <div className="space-y-2">
                             {[
                               { id: 'armed', label: '保全設防總時長', icon: <Shield size={14}/> },
                               { id: 'scenario', label: '情境模式總時長', icon: <Zap size={14}/> }
                             ].map(item => (
                               <button key={item.id} onClick={() => { const next = new Set(statsDurationFilter); if(next.has(item.id)) next.delete(item.id); else next.add(item.id); setStatsDurationFilter(next); }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${statsDurationFilter.has(item.id) ? 'bg-blue-600/10 border-blue-500/50' : 'bg-black/20 border-slate-800 text-slate-600'}`}><div className="flex items-center gap-3">{item.icon}<span className="text-[11px] font-bold">{item.label}</span></div>{statsDurationFilter.has(item.id) ? <CheckSquare size={16} className="text-blue-400"/> : <SquareIcon size={16}/>}</button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-6 border-t border-slate-800 pt-8">
                          <div className="flex items-center gap-3"><ListRestart size={18} className="text-indigo-500" /><h4 className="text-xs font-black text-white uppercase tracking-widest italic">次數對比篩選</h4></div>
                          <div className="space-y-2">
                             {[
                               { id: 'general', label: '一般觸發次數', icon: <Activity size={14}/> },
                               { id: 'security', label: '保全觸發次數', icon: <AlertTriangle size={14}/> },
                               { id: 'scenario', label: '情境觸發次數', icon: <Sparkles size={14}/> }
                             ].map(item => (
                               <button key={item.id} onClick={() => { const next = new Set(statsFrequencyFilter); if(next.has(item.id)) next.delete(item.id); else next.add(item.id); setStatsFrequencyFilter(next); }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${statsFrequencyFilter.has(item.id) ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-black/20 border-slate-800 text-slate-600'}`}><div className="flex items-center gap-3">{item.icon}<span className="text-[11px] font-bold">{item.label}</span></div>{statsFrequencyFilter.has(item.id) ? <CheckSquare size={16} className="text-indigo-400"/> : <SquareIcon size={16}/>}</button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        ) : (
          <>
            <div className="flex bg-black/20 border-b border-slate-800 px-8 shrink-0 overflow-x-auto no-scrollbar justify-between">
              <div className="flex">
                {availableTabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveDetailTab(tab.id)} className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative whitespace-nowrap ${activeDetailTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>{tab.icon} {tab.label}{activeDetailTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 relative overflow-hidden flex flex-col bg-[#0a0f1e]/50 text-left">
                {isRecalculating && (
                  <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <h4 className="text-xl font-black text-white italic uppercase">數據重新計算中...</h4>
                  </div>
                )}
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-10 transition-all duration-700 ${isRecalculating ? 'blur-sm grayscale opacity-50' : ''}`}>
                  {activeDetailTab === 'site_daily_overview' && <SiteDailyOverview />}
                  {activeDetailTab === 'site_cumulative_analysis' && <SiteCumulativeAnalysis />}
                  {activeDetailTab === 'site_time_comparison' && <SiteTimeComparison />}
                  {activeDetailTab === 'site_device_comparison' && <SiteDeviceComparison />}
                  {activeDetailTab === 'site_behavior_profile' && <SiteBehaviorProfile onJumpToNav={onJumpToNav} />}
                  {activeDetailTab === 'historical_trends' && <HistoricalTrends />}
                  {activeDetailTab === 'coordinate_map' && <SpaceCoordinateMap />}
                  {activeDetailTab === 'trigger_history' && <TriggerHistory deviceLabel={slot.label} />}
                  {activeDetailTab === 'period_history' && <PeriodHistory deviceLabel={slot.label} />}
                  {activeDetailTab === 'space_trends' && (slot.label.includes('人流') ? <SpaceFlowTrends /> : <SpaceHeatTrends />)}
                  {activeDetailTab === 'security_info' && <SecurityInfo deviceLabel={slot.label} />}
                  {activeDetailTab === 'scenario_info' && <ScenarioInfo />}
                  {activeDetailTab === 'device_info' && <DeviceInfo />}
                </div>
              </div>
              {slot.nodeType === 'site' && (
                <div className="w-[380px] border-l border-slate-800 bg-[#0b1121] flex flex-col shrink-0 p-8 overflow-y-auto custom-scrollbar text-left">
                   <div className="space-y-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3"><Settings2 size={18} className="text-blue-500" /><h4 className="text-xs font-black text-white uppercase tracking-widest">統計參與設備設定</h4></div>
                           {isStatsChanged && <span className="text-[9px] font-black bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">待更新</span>}
                        </div>
                        <div className="space-y-2">
                           {eligibleStatsDevices.map(dev => (
                             <button key={dev.id} onClick={() => { const next = new Set(pendingStatsDevices); if(next.has(dev.id)) next.delete(dev.id); else next.add(dev.id); setPendingStatsDevices(next); }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${pendingStatsDevices.has(dev.id) ? 'bg-blue-600/10 border-blue-500/50 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-600'}`}><div className="flex items-center gap-3 min-w-0"><UserSearch size={16} className={pendingStatsDevices.has(dev.id) ? 'text-blue-400' : 'text-slate-700'} /><span className={`text-[11px] font-bold truncate ${pendingStatsDevices.has(dev.id) ? 'text-slate-200' : 'text-slate-600'}`}>{dev.label}</span></div>{pendingStatsDevices.has(dev.id) ? <CheckSquare size={16} className="text-blue-500" /> : <SquareIcon size={16} className="text-slate-800" />}</button>
                           ))}
                        </div>
                        <button onClick={applyStatsDeviceSelection} disabled={!isStatsChanged || isRecalculating} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${!isStatsChanged || isRecalculating ? 'bg-slate-800/30 text-slate-700' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>{isRecalculating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18}/>} 確認套用選取</button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end shrink-0 gap-5">
          <button onClick={onClose} className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95">關閉詳情面板</button>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailModal;