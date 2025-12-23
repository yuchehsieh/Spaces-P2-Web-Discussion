
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
  SlidersHorizontal
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
  type: 'image' | 'video';
  location: string;
  timestamp: string;
  deviceId?: string;
  vlmFeatures?: string[];
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
              <div className="p-3 pb-[52px] flex flex-col"> {/* 預先保留底部 52px 空間給按鈕 */}
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

                {/* --- 詳情內容 (根據選中狀態展開) --- */}
                
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
                              <div className="w-20 h-24 bg-black rounded border border-slate-600 overflow-hidden shrink-0">
                                 <img src={event.vlmData.captureUrl} className="w-full h-full object-cover" />
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
                                     src={getCameraThumbnail(cameraId)} 
                                     alt="Full Scene" 
                                     className="w-full h-full object-cover opacity-60" 
                                   />
                                   <div className="absolute inset-0 flex items-center justify-center">
                                      <PlayCircle size={40} className="text-white/60 drop-shadow-2xl" />
                                   </div>
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                )}

                {/* 非 VLM 影像事件 (如越界偵測預設顯示影片縮圖) */}
                {!isVlm && hasVideo && (
                   <div className={`mt-3 space-y-3 animate-in zoom-in-95 duration-200 ${!isLineCrossing && !isSelected ? 'hidden' : 'block'}`}>
                      <div className="relative group/vid overflow-hidden rounded-lg border border-slate-700/50 aspect-video bg-black shadow-inner">
                        <img 
                          src={getCameraThumbnail(cameraId)} 
                          alt="Event Evidence" 
                          className="w-full h-full object-cover opacity-70" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <PlayCircle size={48} className="text-white/80 drop-shadow-2xl" />
                        </div>
                      </div>
                   </div>
                )}
              </div>

              {/* --- 操作按鈕區 (浮動於底部並預留空間) --- */}
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

      {/* --- 全域影像放大彈窗 --- */}
      {modalContent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-10 animate-in fade-in duration-300">
           <div className="relative max-w-6xl w-full bg-[#1e293b] border border-slate-700 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-full ring-1 ring-white/10">
              <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-[#111827] shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/30">
                        {modalContent.type === 'video' ? <Monitor className="text-blue-400" size={24} /> : <ImageIcon className="text-orange-400" size={24} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">{modalContent.title}</h3>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                           <span className="flex items-center gap-1">HQ-Primary</span>
                           <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                           <span className="flex items-center gap-1">{modalContent.timestamp}</span>
                        </div>
                    </div>
                 </div>
                 <button onClick={() => setModalContent(null)} className="p-2.5 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-black flex flex-col relative items-center justify-center">
                   <img src={modalContent.url} className="max-w-full max-h-[70vh] object-contain shadow-2xl" />
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-700 flex justify-end items-center bg-[#111827] shrink-0">
                 <div className="flex gap-4">
                    <button className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold text-sm border border-slate-700 flex items-center justify-center gap-3 group">
                      <Download size={18} className="text-blue-400 group-hover:translate-y-0.5 transition-transform" /> 下載數位存證
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

export default EventPanel;
