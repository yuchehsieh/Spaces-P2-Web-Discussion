
import React, { useMemo, useState } from 'react';
import { 
  Settings, 
  Sliders, 
  Shield, 
  AlertTriangle, 
  Image as ImageIcon, 
  Maximize2, 
  Monitor, 
  Trash2, 
  Clock, 
  PlayCircle, 
  Link as LinkIcon, 
  UserCircle, 
  History, 
  List, 
  Search, 
  X,
  Maximize,
  Download,
  Bell,
  Fingerprint,
  Info,
  Layers,
  Activity,
  Cpu
} from 'lucide-react';
import { SecurityEvent, SiteNode } from '../types';
import { SITE_TREE_DATA } from '../constants';

interface EventPanelProps {
  events: SecurityEvent[];
  onClearEvents?: () => void; 
}

interface ModalMetadata {
  url: string;
  title: string;
  type: 'image' | 'video';
  location: string;
  timestamp: string;
  deviceId?: string;
  vlmFeatures?: string[];
}

const EventPanel: React.FC<EventPanelProps> = ({ events, onClearEvents }) => {
  const [expandedVlmIds, setExpandedVlmIds] = useState<Set<string>>(new Set());
  const [modalContent, setModalContent] = useState<ModalMetadata | null>(null);

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

  const filteredEvents = useMemo(() => {
    return events.filter(event => event.type === 'alert' || event.type === 'warning' || event.type === 'vlm');
  }, [events]);

  const toggleVlmExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedVlmIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
             <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Filters"><Sliders size={14} /></button>
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
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">安防觸發事件</span>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold border border-red-500/20">
                {filteredEvents.length} 則未處理
              </span>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar bg-black/20">
        {filteredEvents.length > 0 ? filteredEvents.map((event) => {
          const isVlm = event.type === 'vlm';
          const isLinked = !!event.linkedSensorId;
          const mainDevice = event.sensorId ? deviceMap[event.sensorId] : null;
          const linkedDevice = event.linkedSensorId ? deviceMap[event.linkedSensorId] : null;
          const isExpanded = expandedVlmIds.has(event.id);
          
          const hasVideo = isVlm || mainDevice?.type === 'camera' || linkedDevice?.type === 'camera';
          const cameraId = mainDevice?.type === 'camera' ? event.sensorId! : (linkedDevice?.type === 'camera' ? event.linkedSensorId! : '');
          const isSos = event.message.toUpperCase().includes('SOS') || mainDevice?.type === 'emergency';

          return (
            <div 
              key={event.id} 
              onClick={(e) => isVlm && toggleVlmExpand(e, event.id)}
              className={`bg-[#1e293b] border rounded-xl flex flex-col overflow-hidden hover:bg-[#283548] cursor-pointer group transition-all animate-in slide-in-from-right-2
                ${event.type === 'alert' || event.type === 'vlm' ? 'border-red-500/30' : 'border-orange-500/30'}
                ${isExpanded ? 'ring-1 ring-blue-500/50 shadow-xl' : ''}
              `}
            >
              {/* Header Info */}
              <div className="p-3 flex items-start space-x-3">
                <div className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${
                    isSos ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-900/40' :
                    (event.type === 'alert' || event.type === 'vlm') ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                }`}>
                    {isSos ? <Bell size={18} /> : (event.type === 'alert' || event.type === 'vlm' ? <AlertTriangle size={18}/> : <Shield size={18}/>)}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`text-[13px] font-bold pr-1 leading-tight ${isSos ? 'text-red-400' : 'text-slate-100'}`}>
                          {event.message}
                        </h4>
                        <div className="flex items-center text-[9px] text-slate-500 font-mono bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                            <Clock size={10} className="mr-1" />
                            {event.timestamp}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{event.location}</p>
                    
                    {isLinked && (
                        <div className="mt-2 flex items-center">
                            <div className="text-[9px] bg-gradient-to-r from-orange-600 to-amber-600 text-white px-2 py-0.5 rounded-md font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg shadow-orange-900/20">
                                <LinkIcon size={10}/> LINKED
                            </div>
                        </div>
                    )}
                </div>
              </div>

              {/* VLM 事件區塊 */}
              {isVlm && event.vlmData && (
                <div className="px-3 pb-3">
                   <div className="bg-[#1b2537] rounded-lg border border-slate-700/50 overflow-hidden flex flex-col transition-all duration-300">
                      <div className="p-2.5 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/20">
                         <div className="flex items-center gap-2 text-xs text-slate-200 font-bold">
                            <ImageIcon size={14} className="text-slate-400" />
                            <span>人臉抓圖</span>
                         </div>
                         <span className="text-[10px] text-slate-500 font-mono">{event.vlmData.timestamp.split(' ')[1]}</span>
                      </div>
                      
                      <div className="p-3 flex flex-col gap-3">
                        <div className="text-[11px] text-slate-400 font-bold">目前站點-{event.vlmData.siteName}</div>
                        
                        <div className="flex items-start gap-4">
                           <div className="relative group/face shrink-0">
                              <div className="w-20 h-24 bg-black rounded border border-slate-600 overflow-hidden shadow-inner flex items-center justify-center">
                                <img src={event.vlmData.captureUrl} className="w-full h-full object-cover" />
                              </div>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setModalContent({ 
                                    url: event.vlmData!.captureUrl, 
                                    title: 'AI 人臉特寫存證', 
                                    type: 'image',
                                    location: event.location,
                                    timestamp: event.vlmData!.timestamp,
                                    vlmFeatures: event.vlmData!.features
                                  }); 
                                }}
                                className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-lg hover:bg-black text-white opacity-0 group-hover/face:opacity-100 transition-opacity"
                              >
                                <Maximize size={12}/>
                              </button>
                           </div>
                           
                           <div className="flex flex-col gap-2 pt-1 flex-1">
                              <div className="flex flex-wrap gap-1.5">
                                 {event.vlmData.features.map(f => (
                                   <span key={f} className="text-[11px] bg-[#2a3547] text-slate-200 px-3 py-1 rounded font-bold border border-slate-600/50 shadow-sm">{f}</span>
                                 ))}
                                 <div className="flex items-center justify-center w-7 h-7 bg-[#2a3547] rounded-full border border-slate-600/50 text-slate-200">
                                    {event.vlmData.gender === 'male' ? <span className="text-lg leading-none">♂</span> : <span className="text-lg leading-none">♀</span>}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                             <div className="h-px bg-slate-700/50"></div>
                             <div className="relative group/full rounded-lg overflow-hidden border border-slate-700/50 bg-black aspect-video shadow-2xl">
                                <img src={event.vlmData.fullSceneUrl} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                   <PlayCircle size={40} className="text-white/40 group-hover:scale-110 transition-transform"/>
                                </div>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setModalContent({ 
                                      url: event.vlmData!.fullSceneUrl, 
                                      title: '全景連動回放', 
                                      type: 'video',
                                      location: event.location,
                                      timestamp: event.vlmData!.timestamp,
                                      deviceId: event.linkedSensorId,
                                      vlmFeatures: event.vlmData!.features
                                    }); 
                                  }}
                                  className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg hover:bg-black text-white opacity-0 group-hover/full:opacity-100 transition-opacity shadow-xl"
                                >
                                  <Maximize size={14}/>
                                </button>
                             </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              )}

              {/* 一般影像回放區塊 */}
              {!isVlm && hasVideo && !isSos && (
                <div className="px-3 pb-3 relative">
                  <div className="relative group/vid overflow-hidden rounded-lg border border-slate-700/50 aspect-video bg-black shadow-inner">
                    <img 
                      src={getCameraThumbnail(cameraId)} 
                      alt="Event Evidence" 
                      className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <PlayCircle size={48} className="text-white/80 drop-shadow-2xl group-hover:scale-110 transition-transform opacity-60 group-hover:opacity-100" />
                    </div>
                    
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setModalContent({ 
                          url: getCameraThumbnail(cameraId), 
                          title: event.message, 
                          type: 'video',
                          location: event.location,
                          timestamp: event.timestamp,
                          deviceId: cameraId
                        }); 
                      }}
                      className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg text-white/80 hover:bg-black hover:text-white opacity-0 group-hover/vid:opacity-100 transition-opacity shadow-2xl border border-white/10"
                    >
                      <Maximize size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Hover Footer Actions */}
              <div className="px-3 py-2 bg-black/20 border-t border-slate-800/50 flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded hover:bg-slate-700 transition-all font-bold">已讀忽略</button>
                <button className={`text-[10px] px-3 py-1 rounded transition-all font-bold shadow-lg ${isSos ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/20' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'}`}>
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

      {/* --- 全域影像放大彈窗 (Pop-up Modal with Metadata) --- */}
      {modalContent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-10 animate-in fade-in duration-300">
           <div className="relative max-w-6xl w-full bg-[#1e293b] border border-slate-700 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-full ring-1 ring-white/10">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-[#111827] shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/30">
                        {modalContent.type === 'video' ? <Monitor className="text-blue-400" size={24} /> : <ImageIcon className="text-orange-400" size={24} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">{modalContent.title}</h3>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                           <span className="flex items-center gap-1"><MapPin size={10} className="text-blue-500" /> {modalContent.location}</span>
                           <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                           <span className="flex items-center gap-1"><Clock size={10} className="text-blue-500" /> {modalContent.timestamp}</span>
                        </div>
                    </div>
                 </div>
                 <button onClick={() => setModalContent(null)} className="p-2.5 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                    <X size={24} />
                 </button>
              </div>
              
              {/* Modal Main Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left: Metadata & Certificate */}
                <div className="hidden lg:flex w-64 bg-[#0a0f1e] border-r border-slate-800 flex-col overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-6">
                        {/* 數位存證證書 */}
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Fingerprint size={12} className="text-blue-500" /> 數位存證證書
                           </h4>
                           <div className="p-3 bg-black/40 rounded-xl border border-slate-800 space-y-2.5">
                              <div className="space-y-1">
                                 <span className="block text-[9px] text-slate-600 font-bold">數位簽章 (SHA-256)</span>
                                 <span className="block text-[10px] text-slate-400 font-mono truncate">f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2</span>
                              </div>
                              <div className="space-y-1">
                                 <span className="block text-[9px] text-slate-600 font-bold">存證節點</span>
                                 <span className="block text-[10px] text-slate-400 font-bold uppercase">SKS_MAIN_HQ_01</span>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                 <div className="flex-1 h-1 bg-green-500/20 rounded-full overflow-hidden">
                                    <div className="w-full h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                 </div>
                                 <span className="text-[9px] font-black text-green-500 uppercase">Verified</span>
                              </div>
                           </div>
                        </div>

                        {/* 回放細節 */}
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Info size={12} className="text-blue-500" /> 回放細節
                           </h4>
                           <div className="space-y-2">
                              <div className="flex justify-between items-center text-[11px]">
                                 <span className="text-slate-500 font-medium">設備標籤</span>
                                 <span className="text-slate-300 font-bold">{modalContent.deviceId || 'CAM-NODE-01'}</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                 <span className="text-slate-500 font-medium">解析度</span>
                                 <span className="text-slate-300 font-bold font-mono">1920x1080</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                 <span className="text-slate-500 font-medium">幀率</span>
                                 <span className="text-slate-300 font-bold font-mono">60 FPS</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                 <span className="text-slate-500 font-medium">回放長度</span>
                                 <span className="text-blue-400 font-bold font-mono">00:15 / 02:00</span>
                              </div>
                           </div>
                        </div>

                        {/* VLM 特徵 (如果有) */}
                        {modalContent.vlmFeatures && (
                          <div className="space-y-3 pt-4 border-t border-slate-800">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                               <Cpu size={12} className="text-orange-500" /> AI 識標摘要
                             </h4>
                             <div className="flex flex-wrap gap-1.5">
                                {modalContent.vlmFeatures.map(f => (
                                  <span key={f} className="px-2.5 py-1 bg-orange-500/10 text-orange-400 text-[10px] font-black rounded-lg border border-orange-500/20">
                                    {f}
                                  </span>
                                ))}
                             </div>
                          </div>
                        )}
                    </div>
                </div>

                {/* Right: Main View Area */}
                <div className="flex-1 bg-black flex flex-col relative">
                   {/* OSD Overlay Layer */}
                   <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 bg-red-600/90 px-3 py-1 rounded text-[11px] font-black tracking-widest text-white shadow-xl">
                               <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                               REPLAY
                            </div>
                            <div className="text-[10px] text-white/50 font-mono tracking-tighter bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm self-start">
                               NODE_AUTH: PASS_SKS_EVIDENCE
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                            <div className="text-xl font-mono font-black text-white tracking-widest drop-shadow-lg">
                               {modalContent.timestamp.split(' ')[1]}
                               <span className="text-sm opacity-60 ml-1">.483</span>
                            </div>
                            <div className="text-[10px] font-bold text-white/40 tracking-[0.3em] uppercase">
                               CAM_UTC+8_028
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                         <div className="flex gap-4">
                            <div className="flex flex-col">
                               <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Longitude</span>
                               <span className="text-xs text-white/70 font-mono">121.5796° E</span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Latitude</span>
                               <span className="text-xs text-white/70 font-mono">25.0629° N</span>
                            </div>
                         </div>
                         <div className="p-2 border border-white/10 rounded-lg bg-black/40 backdrop-blur-sm">
                            <Layers size={16} className="text-white/40" />
                         </div>
                      </div>
                   </div>

                   {/* Background Image / Video Placeholder */}
                   <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                      <img src={modalContent.url} className="max-w-full max-h-[70vh] object-contain shadow-2xl opacity-80" />
                      
                      {modalContent.type === 'video' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <div className="relative mb-6">
                              <div className="absolute -inset-12 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                              <PlayCircle size={80} className="text-white/40 relative drop-shadow-2xl hover:text-white/60 transition-colors cursor-pointer" />
                           </div>
                           <span className="text-white/40 font-black text-sm tracking-[0.5em] uppercase animate-pulse">Playback Ready</span>
                        </div>
                      )}
                   </div>

                   {/* Video Timeline Mockup */}
                   <div className="h-16 bg-[#0a0f1e] border-t border-slate-800 shrink-0 px-6 flex items-center gap-6">
                      <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><History size={16}/></div>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full relative group cursor-pointer overflow-hidden">
                         <div className="absolute top-0 left-0 h-full bg-blue-500 w-1/4 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                         <div className="absolute top-0 left-1/4 h-full bg-blue-400/20 w-1/2"></div>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                        <span className="text-blue-400 font-bold">00:15</span>
                        <span>/</span>
                        <span>02:00</span>
                      </div>
                   </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-700 flex justify-between items-center bg-[#111827] shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Activity size={14} className="text-green-500" />
                        <span className="font-bold uppercase tracking-wider">Bitrate: 8.4 Mbps</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Shield size={14} className="text-blue-500" />
                        <span className="font-bold uppercase tracking-wider">Storage: SK-DATA-SEC-B</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-4">
                    <button className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold text-sm border border-slate-700 flex items-center justify-center gap-3 group">
                      <Download size={18} className="text-blue-400 group-hover:translate-y-0.5 transition-transform" /> 
                      下載數位存證
                    </button>
                    <button onClick={() => setModalContent(null)} className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black text-sm shadow-xl shadow-blue-900/40 uppercase tracking-widest">
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

// 輔助組件: MapPin (lucide-react 本身有提供，這裡確保匯入一致)
const MapPin = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

export default EventPanel;
