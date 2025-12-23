
import React, { useMemo, useState, useEffect } from 'react';
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
  MapPin
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

const EventPanel: React.FC<EventPanelProps> = ({ events, onClearEvents, activeSiteId, selectedEventId, onEventSelect }) => {
  const [modalContent, setModalContent] = useState<ModalMetadata | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // 當 activeSiteId 改變時，自動啟用或調整篩選狀態
  useEffect(() => {
    if (activeSiteId) {
      setIsFilterActive(true);
    } else {
      setIsFilterActive(false);
    }
  }, [activeSiteId]);

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

  // 站點 ID 轉名稱映射 (用於過濾)
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

  const filteredEvents = useMemo(() => {
    let result = events.filter(event => event.type === 'alert' || event.type === 'warning' || event.type === 'vlm');
    
    if (isFilterActive && activeSiteId) {
      const siteLabel = siteNameMap[activeSiteId];
      if (siteLabel) {
        result = result.filter(e => 
          e.location.includes(siteLabel.replace(' (Site)', '')) || 
          (activeSiteId === 'site-hq' && (e.location.includes('大辦公區') || e.location.includes('商研中心')))
        );
      }
    }
    
    return result;
  }, [events, isFilterActive, activeSiteId, siteNameMap]);

  const getCameraThumbnail = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 4 + 1;
    return `https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_${index}.jpg?raw=true`;
  };

  return (
    <div className="w-72 bg-[#0b1121] border-l border-slate-800 flex flex-col h-full flex-shrink-0 relative">
        
      {/* Top Controls */}
      <div className="h-10 bg-[#162032] border-b border-slate-700 flex items-center justify-between px-2 shrink-0">
         <div className="flex space-x-1">
             <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Settings"><Settings size={14} /></button>
             <button 
               onClick={() => setIsFilterActive(!isFilterActive)}
               className={`p-1.5 rounded transition-all ${isFilterActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} 
               title="Toggle Filter"
             >
               <SlidersHorizontal size={14} />
             </button>
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
                  {isFilterActive && activeSiteId && (
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
              {/* Header Info Area */}
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

                {/* --- 詳情內容 --- */}
                
                {/* VLM 事件核心資訊 */}
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

                {/* 非 VLM 影像事件 */}
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

              {/* --- 操作按鈕區 --- */}
              <div className={`absolute bottom-0 left-0 right-0 p-3 flex items-center justify-end space-x-2 bg-[#1e293b]/60 backdrop-blur-sm border-t border-slate-700/30 transition-all duration-300 translate-y-2 opacity-0
                ${isSelected ? 'translate-y-0 opacity-100' : 'group-hover:translate-y-0 group-hover:opacity-100'}
              `}>
                 <button 
                   onClick={(e) => { e.stopPropagation(); }}
                   className="text-[10px] bg-[#1e293b]/80 text-slate-300 border border-slate-700 px-4 py-1.5 rounded-lg hover:bg-slate-700 transition-all font-bold"
                 >
                   已讀忽略
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); }}
                   className={`text-[10px] px-4 py-1.5 rounded-lg transition-all font-bold shadow-lg shadow-blue-900/40 text-white ${isSos ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-500'}`}
                 >
                   {isSos ? '即刻處置' : '處置案件'}
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

      {/* --- 精確對齊附件的專業存證放大彈窗 --- */}
      {modalContent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-10 animate-in fade-in duration-300">
           <div className="relative max-w-7xl w-full bg-[#111827] border border-slate-800 rounded-2xl shadow-[0_0_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[90vh] ring-1 ring-white/5">
              
              {/* Header Section */}
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
                 <button onClick={() => setModalContent(null)} className="p-3 hover:bg-red-500/20 rounded-2xl text-slate-500 hover:text-red-500 transition-all">
                    <X size={32} />
                 </button>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                {/* Left Metadata Panel */}
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

                   {modalContent.event.vlmData && (
                     <div className="space-y-5 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-400">
                           <Cpu size={18} className="text-orange-500" />
                           <h4 className="text-[11px] font-black uppercase tracking-widest">AI 識標摘要</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 px-1">
                           <span className="px-3 py-1.5 bg-orange-900/20 text-orange-400 text-[10px] font-black rounded-lg border border-orange-500/30 uppercase tracking-widest">青年</span>
                        </div>
                     </div>
                   )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-black flex flex-col relative group/viewer">
                   
                   {/* Viewer Overlays */}
                   <div className="absolute top-8 left-8 right-8 z-10 pointer-events-none flex justify-between items-start">
                      <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-3 bg-red-600 px-5 py-2 rounded-lg text-[13px] font-black tracking-[0.25em] text-white shadow-2xl">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                            REPLAY
                         </div>
                         <div className="text-[11px] text-white/40 font-mono tracking-tighter bg-black/50 px-4 py-1.5 rounded-lg border border-white/5 uppercase backdrop-blur-md">
                            NODE_AUTH: PASS_SKS_EVIDENCE
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <div className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                            {modalContent.timestamp}<span className="text-2xl opacity-50 ml-1">.483</span>
                         </div>
                         <div className="text-[11px] font-black text-white/40 tracking-[0.5em] uppercase mt-1">CAM_UTC+8_028</div>
                      </div>
                   </div>

                   {/* Main Media */}
                   <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                      <img src={modalContent.url} className={`max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(37,99,235,0.1)] transition-opacity duration-700 ${modalContent.type === 'face' ? 'w-2/3 scale-110' : 'w-full'}`} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-500/5">
                         <PlayCircle size={100} className="text-white/20 hover:text-white/40 cursor-pointer transition-all drop-shadow-2xl" />
                      </div>
                   </div>

                   {/* Bottom Overlays */}
                   <div className="absolute bottom-24 left-8 right-8 z-10 pointer-events-none flex justify-between items-end">
                      <div className="flex gap-10">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Longitude</span>
                            <span className="text-base text-white/80 font-mono font-bold">121.5796° E</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Latitude</span>
                            <span className="text-base text-white/80 font-mono font-bold">25.0629° N</span>
                         </div>
                      </div>
                      <div className="p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer">
                         <Layers size={24} className="text-white/50" />
                      </div>
                   </div>

                   {/* Playback Control Bar */}
                   <div className="h-1 bg-white/10 mx-8 mb-12 relative group/progress cursor-pointer rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-blue-600 w-1/4 shadow-[0_0_20px_rgba(37,99,235,0.8)]"></div>
                      <div className="absolute top-0 left-1/4 h-full bg-blue-400/20 w-1/2"></div>
                   </div>
                </div>
              </div>
              
              {/* Footer Section */}
              <div className="p-8 border-t border-slate-800 flex justify-between items-center bg-[#0b1121] shrink-0">
                 <div className="flex items-center gap-12 text-slate-500">
                    <div className="flex items-center gap-3">
                       <Activity size={20} className="text-green-500" />
                       <span className="text-[11px] font-black uppercase tracking-widest">Bitrate: <span className="text-slate-300 font-bold ml-1">8.4 MBPS</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Shield size={20} className="text-blue-500" />
                       <span className="text-[11px] font-black uppercase tracking-widest">Storage: <span className="text-slate-300 font-bold ml-1">SK-DATA-SEC-B</span></span>
                    </div>
                 </div>

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

export default EventPanel;
