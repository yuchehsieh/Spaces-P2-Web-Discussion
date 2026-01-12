import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Shield, 
  AlertTriangle, 
  Image as ImageIcon, 
  Maximize2, 
  Monitor, 
  Trash2, 
  Clock, 
  PlayCircle, 
  Link as LinkIcon, 
  X,
  Maximize,
  Download,
  Bell,
  SlidersHorizontal,
  Fingerprint,
  Info,
  Cpu,
  Activity,
  Layers,
  MapPin,
  UserPlus,
  UserCheck,
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  Forward,
  ChevronRight,
  User,
  ClipboardList,
  Check,
  Zap,
  Video,
  Thermometer
} from 'lucide-react';
import { SecurityEvent, SiteNode } from '../types';
import { SITE_TREE_DATA } from '../constants';

interface EventPanelProps {
  events: SecurityEvent[];
  onClearEvents?: () => void; 
  activeSiteId: string | null;
  selectedEventId: string | null;
  onEventSelect: (id: string | null) => void;
}

interface ModalMetadata {
  url: string;
  title: string;
  type: 'image' | 'video' | 'face';
  location: string;
  timestamp: string;
  deviceId?: string;
  vlmFeatures?: string[];
  event: SecurityEvent;
}

const RECIPIENTS = [
  { id: 'shelby', name: 'Shelby', role: '保安主管' },
  { id: 'campbell', name: 'Campbell', role: '據點管理員' },
  { id: 'polly', name: 'Polly', role: '緊急應變小組' }
];

const EventPanel: React.FC<EventPanelProps> = ({ events, onClearEvents, activeSiteId, selectedEventId, onEventSelect }) => {
  const [modalContent, setModalContent] = useState<ModalMetadata | null>(null);
  
  // 篩選相關狀態
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isAutoSiteFilterEnabled, setIsAutoSiteFilterEnabled] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['video', 'security', 'env']));
  
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // 處置彈窗狀態
  const [handlingEvent, setHandlingEvent] = useState<SecurityEvent | null>(null);
  const [handleMode, setHandleMode] = useState<'claim' | 'forward' | null>(null);
  const [claimResult, setClaimResult] = useState<'confirmed' | 'false_alarm' | null>(null);
  const [handleNote, setHandleNote] = useState('');
  const [forwardTarget, setForwardTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 監聽外部點擊關閉篩選選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果點擊的地點既不在選單內，也不在篩選按鈕上，才執行關閉
      if (
        filterMenuRef.current && 
        !filterMenuRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 設備映射表
  const deviceMap = useMemo(() => {
    const map: Record<string, { type: string; label: string }> = {};
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') {
        map[node.id] = { type: node.deviceType || 'unknown', label: node.label };
      }
      node.children?.forEach(traverse);
    };
    SITE_TREE_DATA.forEach(traverse);
    return map;
  }, []);

  // 站點 ID 轉名稱映射
  const siteNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    const traverse = (nodes: SiteNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'site') map[n.id] = n.label;
        if (n.children) traverse(n.children);
      });
    };
    traverse(SITE_TREE_DATA);
    return map;
  }, []);

  // 判定事件類別
  const getEventCategory = (event: SecurityEvent): string => {
    const msg = event.message.toUpperCase();
    if (event.type === 'vlm' || msg.includes('影像') || msg.includes('越界') || msg.includes('人形') || msg.includes('IPC')) return 'video';
    if (msg.includes('SOS') || msg.includes('緊急') || msg.includes('門磁') || msg.includes('PIR') || msg.includes('設防')) return 'security';
    if (msg.includes('溫度') || msg.includes('濕度') || msg.includes('亮度') || msg.includes('感測') || msg.includes('環境')) return 'env';
    return 'security'; // 預設歸類為保全
  };

  const filteredEvents = useMemo(() => {
    let result = events.filter(event => event.type === 'alert' || event.type === 'warning' || event.type === 'vlm');
    
    // 類別過濾
    result = result.filter(e => activeCategories.has(getEventCategory(e)));

    // 據點過濾
    if (isAutoSiteFilterEnabled && activeSiteId) {
      const siteLabel = siteNameMap[activeSiteId];
      if (siteLabel) {
        result = result.filter(e => 
          e.location.includes(siteLabel.replace(' (Site)', '')) || 
          (activeSiteId === 'site-hq' && (e.location.includes('大辦公區') || e.location.includes('商研中心')))
        );
      }
    }
    
    return result;
  }, [events, isAutoSiteFilterEnabled, activeSiteId, siteNameMap, activeCategories]);

  const isAnyFilterActive = activeCategories.size < 3 || (isAutoSiteFilterEnabled && !!activeSiteId);

  const toggleCategory = (cat: string) => {
    const next = new Set(activeCategories);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setActiveCategories(next);
  };

  const getCameraThumbnail = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % 4 + 1;
    return `https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_${index}.jpg?raw=true`;
  };

  const handleCaseAction = (event: SecurityEvent) => {
    setHandlingEvent(event);
    setHandleMode(null);
    setClaimResult(null);
    setHandleNote('');
    setForwardTarget(null);
  };

  const isFormValid = useMemo(() => {
    if (!handleMode) return false;
    if (handleMode === 'claim') return claimResult !== null && handleNote.trim() !== '';
    if (handleMode === 'forward') return forwardTarget !== null;
    return false;
  }, [handleMode, claimResult, handleNote, forwardTarget]);

  const submitHandle = () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHandlingEvent(null);
    }, 1000);
  };

  return (
    <div className="w-72 bg-[#0b1121] border-l border-slate-800 flex flex-col h-full flex-shrink-0 relative">
        
      {/* Top Controls */}
      <div className="h-10 bg-[#162032] border-b border-slate-700 flex items-center justify-between px-2 shrink-0">
         <div className="flex space-x-1 relative">
             <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Settings"><Settings size={14} /></button>
             <button 
               ref={filterButtonRef}
               onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
               className={`p-1.5 rounded transition-all ${isAnyFilterActive ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} 
               title="篩選條件"
             >
               <SlidersHorizontal size={14} />
             </button>

             {/* 篩選下拉選單 */}
             {isFilterMenuOpen && (
               <div ref={filterMenuRef} className="absolute top-8 left-0 w-56 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-[1000] overflow-hidden animate-in zoom-in-95 duration-150">
                  <div className="p-3 bg-black/20 border-b border-slate-700">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">事件篩選設定</span>
                  </div>
                  <div className="p-2 space-y-1">
                     <button 
                        onClick={() => setIsAutoSiteFilterEnabled(!isAutoSiteFilterEnabled)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800 rounded-lg transition-colors group"
                     >
                        <div className="flex items-center gap-3">
                           <MapPin size={14} className={isAutoSiteFilterEnabled ? 'text-blue-400' : 'text-slate-600'} />
                           <span className={`text-xs font-bold ${isAutoSiteFilterEnabled ? 'text-slate-200' : 'text-slate-500'}`}>自動據點篩選</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isAutoSiteFilterEnabled ? 'bg-blue-600 border-blue-500' : 'border-slate-700'}`}>
                           {isAutoSiteFilterEnabled && <Check size={10} strokeWidth={4} className="text-white" />}
                        </div>
                     </button>
                     <div className="h-px bg-slate-800 my-1"></div>
                     <FilterToggleItem icon={<Thermometer size={14}/>} label="環境異常" active={activeCategories.has('env')} onClick={() => toggleCategory('env')} />
                     <FilterToggleItem icon={<Video size={14}/>} label="影像異常" active={activeCategories.has('video')} onClick={() => toggleCategory('video')} />
                     <FilterToggleItem icon={<Shield size={14}/>} label="保全事件" active={activeCategories.has('security')} onClick={() => toggleCategory('security')} />
                  </div>
               </div>
             )}
         </div>
         <div className="flex space-x-1">
            <button 
              onClick={onClearEvents}
              className="px-2 py-0.5 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-900/30 text-[10px] rounded border border-slate-700 flex items-center transition-all group"
            >
                <Trash2 size={10} className="mr-1 group-hover:text-red-400"/> 清空訊息
            </button>
            <div className="px-2 py-0.5 bg-blue-900 text-blue-200 text-[10px] rounded border border-blue-700 flex items-center cursor-pointer hover:bg-blue-800 transition-colors">
                <Monitor size={10} className="mr-1"/> 暫停刷新
            </div>
             <div className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-600 flex items-center cursor-pointer hover:bg-slate-600 transition-colors">
                <ImageIcon size={10} className="mr-1"/> 流屏
            </div>
         </div>
      </div>

      <div className="h-10 bg-[#0f172a] border-b border-slate-800 flex items-center justify-end px-2 space-x-2 shrink-0">
          <button className="p-1 bg-blue-600 text-white rounded shadow-lg shadow-blue-900/40"><Monitor size={14}/></button>
          <button className="p-1 text-slate-400 hover:text-white transition-colors"><div className="w-3.5 h-3.5 border border-slate-400 rounded-sm"></div></button>
          <button className="p-1 text-slate-400 hover:text-white grid grid-cols-2 gap-0.5 w-4 h-4 transition-colors">
            <div className="bg-slate-500 rounded-xs"></div><div className="bg-slate-500 rounded-xs"></div>
            <div className="bg-slate-500 rounded-xs"></div><div className="bg-slate-500 rounded-xs"></div>
          </button>
          <button className="p-1 text-slate-400 hover:text-white transition-colors"><Maximize2 size={14}/></button>
      </div>

      <div className="px-4 py-3 bg-[#0a0f1e] border-b border-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">安防觸發事件</span>
                  {(isAutoSiteFilterEnabled && activeSiteId) && (
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">據點過濾已開啟: {siteNameMap[activeSiteId]}</span>
                  )}
              </div>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold border border-red-500/20">
                {filteredEvents.length} 則未處理
              </span>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar bg-black/20">
        {filteredEvents.length > 0 ? filteredEvents.map((event) => {
          const isVlm = event.type === 'vlm';
          const isLineCrossing = event.message.includes('越界偵測');
          const isLinked = !!event.linkedSensorId;
          const mainDevice = event.sensorId ? deviceMap[event.sensorId] : null;
          const linkedDevice = event.linkedSensorId ? deviceMap[event.linkedSensorId] : null;
          const isSelected = selectedEventId === event.id;
          
          const hasVideo = isVlm || mainDevice?.type === 'camera' || linkedDevice?.type === 'camera';
          const cameraId = mainDevice?.type === 'camera' ? event.sensorId! : (linkedDevice?.type === 'camera' ? event.linkedSensorId! : '');
          const isSos = event.message.toUpperCase().includes('SOS') || mainDevice?.type === 'emergency';

          return (
            <div 
              key={event.id} 
              onClick={() => onEventSelect(isSelected ? null : event.id)}
              className={`bg-[#1e293b] border rounded-xl flex flex-col overflow-hidden hover:bg-[#283548] cursor-pointer group transition-all animate-in slide-in-from-right-2 relative
                ${(event.type === 'alert' || event.type === 'vlm') ? 'border-red-500/30' : 'border-orange-500/30'}
                ${isSelected ? 'ring-2 ring-blue-500 shadow-xl scale-[1.02] bg-[#2d3a54]' : ''}
              `}
            >
              <div className="p-3 pb-[52px] flex flex-col">
                <div className="flex items-start space-x-3">
                   <div className={`mt-0.5 flex-shrink-0 rounded-xl p-2.5 transition-all ${
                       isSos ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' :
                       (event.type === 'alert' || event.type === 'vlm') ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                   }`}>
                       {isSos ? <Bell size={20} /> : (isVlm || event.type === 'alert') ? <AlertTriangle size={20}/> : <Shield size={20}/>}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-0.5">
                           <h4 className={`text-[13px] font-bold pr-1 leading-tight tracking-tight ${isSos ? 'text-red-400' : 'text-slate-100'}`}>
                             {event.message}
                           </h4>
                           <div className="flex items-center text-[9px] text-slate-500 font-mono bg-black/40 px-2 py-1 rounded border border-white/5 whitespace-nowrap">
                               <Clock size={10} className="mr-1" />
                               {event.timestamp}
                           </div>
                       </div>
                       <p className="text-[11px] text-slate-400 font-medium opacity-80">{event.location}</p>
                       
                       {isLinked && (
                          <div className="mt-2">
                             <div className="inline-flex items-center gap-1 bg-orange-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-orange-900/20">
                                <LinkIcon size={10}/> LINKED
                             </div>
                          </div>
                       )}
                   </div>
                </div>

                {isVlm && event.vlmData && (
                  <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                     <div className="bg-[#1b2537] rounded-lg border border-slate-700/50 overflow-hidden shadow-inner">
                        <div className="p-2 border-b border-slate-700/50 flex items-center justify-between bg-black/20">
                           <div className="flex items-center gap-2 text-[11px] text-slate-300 font-bold">
                              <ImageIcon size={14} className="text-slate-400" />
                              <span>人臉抓圖</span>
                           </div>
                           <span className="text-[9px] text-slate-500 font-mono">{event.timestamp}</span>
                        </div>
                        
                        <div className="p-3">
                           <p className="text-[11px] text-slate-500 font-bold mb-3">目前站點-櫃台</p>
                           <div className="flex items-start gap-4">
                              <div className="w-20 h-24 bg-black rounded border border-slate-600 overflow-hidden shrink-0 relative group/face">
                                 <img src={event.vlmData.captureUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover/face:scale-110" />
                                 <button 
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      setModalContent({
                                          url: event.vlmData!.captureUrl,
                                          title: "AI 人臉特寫存證",
                                          type: 'face',
                                          location: event.location,
                                          timestamp: event.timestamp,
                                          event: event
                                      });
                                   }}
                                   className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md opacity-0 group-hover/face:opacity-100 transition-all z-20"
                                 >
                                    <Maximize size={12} />
                                 </button>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                 <span className="px-3 py-1 bg-[#2d3a54] text-slate-200 text-[10px] font-bold rounded border border-slate-600">青年</span>
                                 <div className="w-8 h-8 rounded-full bg-[#2d3a54] border border-slate-600 flex items-center justify-center text-slate-200">
                                    <span className="text-lg font-bold">♂</span>
                                 </div>
                              </div>
                           </div>
                           
                           {isSelected && (
                             <div className="animate-in fade-in duration-300">
                                <div className="h-px bg-slate-700/50 -mx-3 my-4"></div>
                                <div className="relative group/vid overflow-hidden rounded-lg border border-slate-700/50 aspect-video bg-black">
                                   <img 
                                     src={event.vlmData.fullSceneUrl || getCameraThumbnail(cameraId)} 
                                     alt="Full Scene" 
                                     className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover/vid:scale-110" 
                                   />
                                   <button 
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setModalContent({
                                            url: event.vlmData!.fullSceneUrl || getCameraThumbnail(cameraId),
                                            title: "全景連動回放",
                                            type: 'video',
                                            location: event.location,
                                            timestamp: event.timestamp,
                                            event: event
                                        });
                                     }}
                                     className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover/vid:opacity-100 transition-all z-20"
                                   >
                                      <Maximize size={16} />
                                   </button>
                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <PlayCircle size={40} className="text-white/60 drop-shadow-2xl transition-transform duration-300 group-hover/vid:scale-125" />
                                   </div>
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                )}

                {!isVlm && hasVideo && (
                   <div className={`mt-3 space-y-3 animate-in zoom-in-95 duration-200 ${!isLineCrossing && !isSelected ? 'hidden' : 'block'}`}>
                      <div className="relative group/vid overflow-hidden rounded-lg border border-slate-700/50 aspect-video bg-black shadow-inner">
                        <img 
                          src={getCameraThumbnail(cameraId)} 
                          alt="Event Evidence" 
                          className="w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover/vid:scale-110" 
                        />
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setModalContent({
                                    url: getCameraThumbnail(cameraId),
                                    title: event.message,
                                    type: 'video',
                                    location: event.location,
                                    timestamp: event.timestamp,
                                    event: event
                                });
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover/vid:opacity-100 transition-all z-20"
                        >
                            <Maximize size={16} />
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <PlayCircle size={48} className="text-white/80 drop-shadow-2xl transition-transform duration-300 group-hover/vid:scale-125" />
                        </div>
                      </div>
                   </div>
                )}
              </div>

              <div className={`absolute bottom-0 left-0 right-0 p-3 flex items-center justify-end space-x-2 bg-[#1e293b]/60 backdrop-blur-sm border-t border-slate-700/30 transition-all duration-300 translate-y-2 opacity-0
                ${isSelected ? 'translate-y-0 opacity-100' : 'group-hover:translate-y-0 group-hover:opacity-100'}
              `}>
                 <button 
                   onClick={(e) => { e.stopPropagation(); }}
                   className="text-[10px] bg-[#1e293b]/80 text-slate-300 border border-slate-700 px-4 py-1.5 rounded-lg hover:bg-slate-700 transition-all font-bold"
                 >
                   已請忽略
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleCaseAction(event); }}
                   className={`text-[10px] px-4 py-1.5 rounded-lg transition-all font-bold shadow-lg shadow-blue-900/40 text-white ${isSos ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-500'}`}
                 >
                   處置案件
                 </button>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-40 opacity-20 select-none">
            <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                <Shield size={40} className="text-slate-400" />
            </div>
            <span className="text-sm font-bold">系統安全無虞</span>
            <span className="text-[10px] mt-1 text-slate-500">當前未偵測到安防異常</span>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-slate-800 text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold bg-[#0b1121] shrink-0">
        SKS Intelligence Node
      </div>

      {/* 處置案件彈窗 */}
      {handlingEvent && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
              
              {/* Header */}
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40">
                       <CheckCircle2 size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">處置案件任務</h2>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Incident: {handlingEvent.message}</p>
                    </div>
                 </div>
                 <button onClick={() => setHandlingEvent(null)} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                    <X size={28} />
                 </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setHandleMode('claim')}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${handleMode === 'claim' ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                       <UserCheck size={28} />
                       <div className="text-center">
                          <span className="block text-sm font-black uppercase tracking-widest">案件認領</span>
                          <span className="text-[9px] opacity-60">由我親自處置</span>
                       </div>
                    </button>
                    <button 
                      onClick={() => setHandleMode('forward')}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${handleMode === 'forward' ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                       <Forward size={28} />
                       <div className="text-center">
                          <span className="block text-sm font-black uppercase tracking-widest">案件轉發</span>
                          <span className="text-[9px] opacity-60">委派專人處理</span>
                       </div>
                    </button>
                 </div>

                 {handleMode === 'claim' && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                             <Shield size={14} className="text-blue-500" /> 處理結果判定
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                             <button 
                               onClick={() => setClaimResult('confirmed')}
                               className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${claimResult === 'confirmed' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                             >
                                確認為警報 (Alarm)
                             </button>
                             <button 
                               onClick={() => setClaimResult('false_alarm')}
                               className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${claimResult === 'false_alarm' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                             >
                                確認為誤報 (False)
                             </button>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                             <MessageSquare size={14} className="text-blue-500" /> 處置內容說明
                          </label>
                          <textarea 
                             value={handleNote}
                             onChange={(e) => setHandleNote(e.target.value)}
                             placeholder="請輸入案件詳細處置狀況或備註事項..."
                             className="w-full h-32 bg-black/40 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                          />
                       </div>

                       <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                <User size={20} />
                             </div>
                             <div>
                                <span className="block text-xs font-black text-white">當前處理人</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Admin (Super Admin)</span>
                             </div>
                          </div>
                          <div className="px-3 py-1 bg-blue-600 text-[9px] font-black text-white rounded-full">SYSTEM OWNER</div>
                       </div>
                    </div>
                 )}

                 {handleMode === 'forward' && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                          <UserPlus size={14} className="text-purple-500" /> 選擇轉發對象
                       </label>
                       <div className="space-y-2">
                          {RECIPIENTS.map(person => (
                             <button 
                                key={person.id}
                                onClick={() => setForwardTarget(person.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${forwardTarget === person.id ? 'bg-purple-600/10 border-purple-500 shadow-xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                             >
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${forwardTarget === person.id ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                      {person.name[0]}
                                   </div>
                                   <div className="text-left">
                                      <span className={`block text-sm font-bold ${forwardTarget === person.id ? 'text-white' : 'text-slate-300'}`}>{person.name}</span>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{person.role}</span>
                                   </div>
                                </div>
                                {forwardTarget === person.id ? <CheckCircle2 size={18} className="text-purple-500" /> : <ChevronRight size={18} className="text-slate-700" />}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              {handleMode && (
                <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end gap-5 animate-in slide-in-from-bottom-2">
                   <button 
                     onClick={() => { setHandlingEvent(null); setHandleMode(null); }}
                     className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-black text-sm border border-slate-700 uppercase tracking-widest"
                   >
                      取消任務
                   </button>
                   <button 
                     onClick={submitHandle}
                     disabled={!isFormValid || isSubmitting}
                     className={`px-14 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3
                       ${!isFormValid || isSubmitting 
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                          : handleMode === 'claim' 
                             ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' 
                             : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'
                       }
                     `}
                   >
                      {isSubmitting ? <><RefreshCw className="animate-spin" size={20}/> 提交中</> : <><CheckCircle2 size={20} /> 完成處置提交</>}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* 放大彈窗 */}
      {modalContent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-10 animate-in fade-in duration-300">
           <div className="relative max-w-7xl w-full bg-[#111827] border border-slate-800 rounded-2xl shadow-[0_0_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[90vh] ring-1 ring-white/5">
              
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-[#0f172a] shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
                        {modalContent.type === 'video' ? <Monitor className="text-blue-400" size={28} /> : <ImageIcon className="text-orange-400" size={28} />}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">{modalContent.title}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                           <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500"/>{modalContent.location}</span>
                           <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                           <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500"/>2025-12-18 {modalContent.timestamp}</span>
                        </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const evt = modalContent.event;
                        setModalContent(null);
                        handleCaseAction(evt);
                      }}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-900/20 flex items-center gap-2.5 transition-all active:scale-95"
                    >
                      <ClipboardList size={16}/> 處置案件
                    </button>
                    <button onClick={() => setModalContent(null)} className="p-3 hover:bg-red-500/20 rounded-2xl text-slate-500 hover:text-red-500 transition-all">
                        <X size={32} />
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                <div className="w-72 bg-[#0b1121] border-r border-slate-800/50 p-6 flex flex-col gap-10 overflow-y-auto custom-scrollbar shrink-0">
                   
                   <div className="space-y-5">
                      <div className="flex items-center gap-3 text-slate-400">
                         <Fingerprint size={18} className="text-blue-500" />
                         <h4 className="text-[11px] font-black uppercase tracking-widest">數位存證證書</h4>
                      </div>
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-4">
                         <div className="space-y-1">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">數位簽章 (SHA-256)</span>
                            <p className="text-[10px] text-slate-400 font-mono break-all leading-tight">f7a8b9c0d1e2f3a4b5c6d7e8f9a0b...</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">存證節點</span>
                            <p className="text-[11px] text-slate-300 font-black">SKS_MAIN_HQ_01</p>
                         </div>
                         <div className="pt-2">
                            <div className="h-1.5 bg-green-500/10 rounded-full overflow-hidden mb-2">
                               <div className="w-full h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                            </div>
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">VERIFIED</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-5">
                      <div className="flex items-center gap-3 text-slate-400">
                         <Info size={18} className="text-blue-500" />
                         <h4 className="text-[11px] font-black uppercase tracking-widest">回放細節</h4>
                      </div>
                      <div className="space-y-4 px-1">
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">設備標籤</span>
                            <span className="text-slate-200 font-mono">{modalContent.event.sensorId || 'CAM-NODE-01'}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">解析度</span>
                            <span className="text-slate-200">1920x1080</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">幀率</span>
                            <span className="text-slate-200">60 FPS</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-600 uppercase tracking-widest">回放長度</span>
                            <span className="text-blue-400 font-mono">00:15 / 02:00</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex-1 bg-black flex flex-col relative group/viewer">
                   <div className="absolute top-8 left-8 right-8 z-10 pointer-events-none flex justify-between items-start">
                      <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-3 bg-red-600 px-5 py-2 rounded-lg text-[13px] font-black tracking-[0.25em] text-white shadow-2xl">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                            REPLAY
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <div className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                            {modalContent.timestamp}<span className="text-2xl opacity-50 ml-1">.483</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                      <img src={modalContent.url} className={`max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(37,99,235,0.1)] transition-opacity duration-700 ${modalContent.type === 'face' ? 'w-2/3 scale-110' : 'w-full'}`} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-500/5">
                         <PlayCircle size={100} className="text-white/20 hover:text-white/40 cursor-pointer transition-all drop-shadow-2xl" />
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="p-8 border-t border-slate-800 flex justify-end items-center bg-[#0b1121] shrink-0">
                 <div className="flex gap-5">
                    <button className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-black text-sm border border-slate-700 flex items-center justify-center gap-4 group shadow-xl uppercase tracking-widest">
                      <Download size={22} className="text-blue-400 group-hover:translate-y-0.5 transition-transform" /> 下載數位存證
                    </button>
                    <button onClick={() => setModalContent(null)} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-black text-sm shadow-2xl shadow-blue-900/40 uppercase tracking-widest ring-1 ring-white/10">
                       確認並關閉
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- 子組件: 篩選切換項 ---
const FilterToggleItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800 rounded-lg transition-colors group"
  >
    <div className="flex items-center gap-3">
       <div className={`${active ? 'text-blue-400' : 'text-slate-600'} transition-colors`}>{icon}</div>
       <span className={`text-xs font-bold ${active ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${active ? 'bg-blue-600 border-blue-500' : 'border-slate-700'}`}>
       {active && <Check size={10} strokeWidth={4} className="text-white" />}
    </div>
  </button>
);

// 用於處置中旋轉的圖示
const RefreshCw = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
    <path d="M21 3v5h-5"></path>
  </svg>
);

export default EventPanel;