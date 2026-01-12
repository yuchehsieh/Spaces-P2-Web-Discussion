import React, { useState, useMemo, useRef, useEffect } from 'react';
import SiteTree from './SiteTree';
import VideoGrid, { VideoSlotData } from './VideoGrid';
import { SITE_TREE_DATA } from '../constants';
import { SiteNode, GridSize } from '../types';
import { 
  Grid2x2, 
  Grid3x3, 
  Square, 
  History, 
  Calendar, 
  Search, 
  Plus, 
  Minus, 
  Download, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  CloudDownload,
  Scissors,
  X,
  Check,
  RefreshCcw,
  GripHorizontal,
  HardDrive,
  Cloud,
  Loader2,
  Play,
  Video,
  CheckSquare,
  Square as SquareIcon
} from 'lucide-react';

const PlaybackTab: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [videoSlots, setVideoSlots] = useState<Record<number, VideoSlotData>>({});
  
  // 時間軸狀態
  const [timeOffset, setTimeOffset] = useState(0); 
  const [isClipping, setIsClipping] = useState(false);
  const [hasSelection, setHasSelection] = useState(false); 
  const [zoomLevel, setZoomLevel] = useState(50); 
  
  // 下載彈窗狀態
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [storageType, setStorageType] = useState<'device' | 'cloud'>('device');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedCameraIds, setSelectedCameraIds] = useState<Set<string>>(new Set());

  // 擷取框互動狀態 (以像素為單位)
  const [selectionBox, setSelectionBox] = useState({ top: 150, height: 100 });
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isResizingTop, setIsResizingTop] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const dragStartY = useRef(0);
  const initialBoxY = useRef(0);
  const initialBoxH = useRef(0);
  
  const viewportRef = useRef<HTMLDivElement>(null);

  const activeCameras = useMemo(() => Object.values(videoSlots), [videoSlots]);

  const cameraOnlyTree = useMemo(() => {
    const filter = (nodes: SiteNode[]): SiteNode[] => {
      return nodes.map(node => {
        if (node.type === 'device') {
          return node.deviceType === 'camera' ? node : null;
        }
        const filteredChildren = node.children ? filter(node.children) : [];
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      }).filter((n): n is SiteNode => n !== null);
    };
    return filter(SITE_TREE_DATA);
  }, []);

  const handleNodeSelect = (node: SiteNode) => setSelectedNodeId(node.id);

  const handleDropCamera = (index: number, camera: { id: string; label: string }) => {
    setVideoSlots(prev => ({ ...prev, [index]: { ...camera, isRecording: false } }));
  };

  const handleRemoveCamera = (index: number) => {
    setVideoSlots(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const handleToggleRecording = (index: number) => {
    setVideoSlots(prev => {
        if (!prev[index]) return prev;
        return { ...prev, [index]: { ...prev[index], isRecording: !prev[index].isRecording } };
    });
  };

  const handleTimelineWheel = (e: React.WheelEvent) => {
    setTimeOffset(prev => Math.max(0, prev + (e.deltaY < 0 ? 1 : -1)));
  };

  const handleBackToLive = () => {
    setTimeOffset(0);
    setIsClipping(false);
    setHasSelection(false);
  };

  // 生成時間標籤邏輯
  const timeLabels = useMemo(() => {
    const labels = [];
    const baseMinutes = 17 * 60 + 55; // 05:55 PM
    const currentBase = baseMinutes - timeOffset;
    const step = zoomLevel > 70 ? 2 : zoomLevel > 30 ? 5 : 10;
    for (let i = 0; i < 20; i++) {
        const totalMins = currentBase - (i * step);
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        labels.push(`${displayHours < 10 ? '0' + displayHours : displayHours}:${mins < 10 ? '0' + mins : mins} ${period}`);
    }
    return labels;
  }, [timeOffset, zoomLevel]);

  // 擷取框拖動邏輯
  const handleMouseDown = (e: React.MouseEvent, type: 'box' | 'top' | 'bottom') => {
    e.stopPropagation();
    dragStartY.current = e.clientY;
    initialBoxY.current = selectionBox.top;
    initialBoxH.current = selectionBox.height;
    if (type === 'box') setIsDraggingBox(true);
    if (type === 'top') setIsResizingTop(true);
    if (type === 'bottom') setIsResizingBottom(true);
    setHasSelection(true);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingBox && !isResizingTop && !isResizingBottom) return;
      const deltaY = e.clientY - dragStartY.current;
      
      if (isDraggingBox) {
        setSelectionBox(prev => ({ ...prev, top: Math.max(0, initialBoxY.current + deltaY) }));
      } else if (isResizingTop) {
        const newTop = Math.max(0, initialBoxY.current + deltaY);
        const newHeight = Math.max(20, initialBoxH.current - (newTop - initialBoxY.current));
        setSelectionBox({ top: newTop, height: newHeight });
      } else if (isResizingBottom) {
        setSelectionBox(prev => ({ ...prev, height: Math.max(20, initialBoxH.current + deltaY) }));
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingBox(false);
      setIsResizingTop(false);
      setIsResizingBottom(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingBox, isResizingTop, isResizingBottom]);

  const handleCaptureAction = () => {
    if (!isClipping) {
      setIsClipping(true);
      setHasSelection(false);
    } else if (!hasSelection) {
      setHasSelection(true);
    } else {
      if (activeCameras.length === 0) {
        alert("請先載入至少一台攝影機畫面");
        return;
      }
      // 初始化全選
      setSelectedCameraIds(new Set(activeCameras.map(c => c.id)));
      setDownloadProgress(0);
      setIsDownloading(false);
      setIsDownloadModalOpen(true);
    }
  };

  const toggleCameraSelection = (id: string) => {
    const next = new Set(selectedCameraIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCameraIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedCameraIds.size === activeCameras.length) {
      setSelectedCameraIds(new Set());
    } else {
      setSelectedCameraIds(new Set(activeCameras.map(c => c.id)));
    }
  };

  const startDownloadSimulation = () => {
    if (selectedCameraIds.size === 0) {
      alert("請至少選擇一個頻道進行下載");
      return;
    }
    setIsDownloading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        setDownloadProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsDownloadModalOpen(false);
          setIsClipping(false);
          setHasSelection(false);
          alert("影像下載完成！");
        }, 800);
      } else {
        setDownloadProgress(Math.floor(progress));
      }
    }, 400);
  };

  const discardCapture = () => {
    setIsClipping(false);
    setHasSelection(false);
  };

  const Grid4x4Icon = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1h2.5v2.5H1V1zm3.5 0h2.5v2.5H4.5V1zm3.5 0h2.5v2.5H8V1zm3.5 0H14v2.5h-2.5V1zM1 4.5h2.5v2.5H1v-2.5zm3.5 0h2.5v2.5H4.5v-2.5zm3.5 0h2.5v2.5H8v-2.5zm3.5 0H14v2.5h-2.5v-2.5zM1 8h2.5v2.5H1V8zm3.5 0h2.5v2.5H4.5V8zm3.5 0h2.5v2.5H8V8zm3.5 0H14v2.5h-2.5V8zm-10.5 3.5h2.5v2.5H1v-2.5zm3.5 0h2.5v2.5H4.5v-2.5zm3.5 0h2.5v2.5H8v-2.5zm3.5 0H14v2.5h-2.5v-2.5z" />
    </svg>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#050914]">
      <SiteTree data={cameraOnlyTree} onSelect={handleNodeSelect} selectedId={selectedNodeId} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex items-center bg-black border-b border-slate-800 h-10 px-4">
          <div className="flex items-center gap-2 text-slate-300">
            <History size={16} className="text-blue-400" />
            <span className="text-sm font-bold tracking-tight uppercase">回放中心監控網格</span>
          </div>
          <div className="ml-auto flex items-center space-x-1 pr-2">
            <button onClick={() => setGridSize(1)} className={`p-1 rounded ${gridSize === 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Square size={16} /></button>
            <button onClick={() => setGridSize(4)} className={`p-1 rounded ${gridSize === 4 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Grid2x2 size={16} /></button>
            <button onClick={() => setGridSize(9)} className={`p-1 rounded ${gridSize === 9 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Grid3x3 size={16} /></button>
            <button onClick={() => setGridSize(16)} className={`p-1 rounded ${gridSize === 16 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Grid4x4Icon size={16} /></button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-black">
          <VideoGrid gridSize={gridSize} activeSlots={videoSlots} onDropCamera={handleDropCamera} onRemoveCamera={handleRemoveCamera} onToggleRecording={handleToggleRecording} />
          
          {isClipping && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600/90 backdrop-blur-md px-8 py-3 rounded-2xl border border-blue-400 shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                <Scissors size={20} className="text-white animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white tracking-widest uppercase">影像片段擷取模式</span>
                  <span className="text-[10px] text-blue-200 font-bold">{hasSelection ? '拖動藍色方框調整區間，完成後點擊下載' : '請在右側時間軸選擇欲擷取的範圍'}</span>
                </div>
                <button onClick={discardCapture} className="ml-4 p-1.5 bg-black/30 hover:bg-red-500/50 rounded-lg transition-all"><X size={16} className="text-white"/></button>
            </div>
          )}
        </div>
      </div>

      <div className="w-72 bg-[#0b1121] border-l border-slate-800 flex flex-col h-full shrink-0">
        
        <div className="p-4 border-b border-slate-800 bg-black/20 space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Surveillance Date</span>
                    <span className="text-sm font-black text-slate-200 tracking-tight">2025年 12月 22日</span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded-lg text-slate-500">
                    <Calendar size={18} />
                </div>
            </div>
            
            <button 
              onClick={handleBackToLive}
              disabled={timeOffset === 0}
              className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 border shadow-xl
                ${timeOffset === 0 
                  ? 'bg-slate-900/30 border-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                  : 'bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-red-900/30 active:scale-95'
                }
              `}
            >
              <RefreshCcw size={14} className={timeOffset > 0 ? 'animate-spin' : ''} style={{ animationDuration: '3s' }}/> 
              Back to Live Feed
            </button>
        </div>

        <div 
          ref={viewportRef}
          className="flex-1 relative overflow-hidden flex justify-center py-12 cursor-ns-resize"
          onWheel={handleTimelineWheel}
        >
            <div className="h-full w-full relative">
                
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-800 -translate-x-1/2 rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-0 w-full bg-blue-900/40 border-x border-blue-500/20"></div>
                </div>

                <div className="h-full w-full relative">
                    {timeLabels.map((label, idx) => (
                        <div key={idx} className="absolute w-full flex items-center justify-center" style={{ top: `${idx * 5}%` }}>
                            <div className="absolute right-[calc(50%+1rem)] text-[10px] font-black text-slate-500 font-mono tracking-tighter w-20 text-right">
                                {label}
                            </div>
                            <div className={`h-px w-3 bg-slate-500/50 ${idx % 5 === 0 ? 'w-5 bg-slate-400' : ''}`}></div>
                        </div>
                    ))}
                </div>

                {timeOffset === 0 && (
                  <div className="absolute top-8 left-0 right-0 z-20 flex items-center">
                      <div className="h-px bg-red-500 flex-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                      <div className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-widest z-10 mx-auto border border-red-400">
                          LIVE
                      </div>
                      <div className="h-px bg-red-500 flex-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  </div>
                )}

                {isClipping && (
                  <div 
                    style={{ top: `${selectionBox.top}px`, height: `${selectionBox.height}px` }}
                    className="absolute left-12 right-12 bg-blue-500/30 border border-blue-400/60 rounded-lg z-30 transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] group/box"
                    onMouseDown={(e) => handleMouseDown(e, 'box')}
                  >
                      <div 
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-400 rounded-full cursor-ns-resize flex items-center justify-center border border-white/20 opacity-0 group-hover/box:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleMouseDown(e, 'top')}
                      >
                        <div className="w-4 h-0.5 bg-white/60 rounded-full"></div>
                      </div>

                      <div className="h-full w-full flex items-center justify-center">
                         <div className="bg-blue-600 rounded-full p-2 shadow-xl ring-2 ring-blue-400">
                           <Scissors size={14} className="text-white" />
                         </div>
                         <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-[9px] font-black px-2 py-1 rounded shadow-xl text-white whitespace-nowrap border border-blue-400 translate-x-full">
                            {Math.round(selectionBox.height / 5)} MINS
                         </div>
                      </div>

                      <div 
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-400 rounded-full cursor-ns-resize flex items-center justify-center border border-white/20 opacity-0 group-hover/box:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                      >
                        <div className="w-4 h-0.5 bg-white/60 rounded-full"></div>
                      </div>
                  </div>
                )}
            </div>
        </div>

        <div className="p-6 bg-black/60 border-t border-slate-800 space-y-8">
            <div className="flex items-center gap-4 px-1">
                <ZoomOut size={16} className="text-slate-500" />
                <div className="flex-1 h-6 flex items-center">
                  <input 
                    type="range" min="0" max="100" 
                    value={zoomLevel} onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer"
                  />
                </div>
                <ZoomIn size={16} className="text-slate-500" />
            </div>

            <div className="flex gap-3">
                <button 
                  onClick={discardCapture}
                  className="flex items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all shadow-lg"
                >
                    <Trash2 size={20} />
                </button>
                <button 
                  onClick={handleCaptureAction}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl
                    ${isClipping 
                      ? hasSelection 
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/30' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                    {isClipping ? (
                      hasSelection ? <><Download size={20} /> 下載選取片段</> : <><Check size={20} /> 請在軸上拖選</>
                    ) : (
                      <><Scissors size={20} /> 擷取影像片段</>
                    )}
                </button>
            </div>
            
            <div className="text-center opacity-40">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                   Centralized Sync
                </span>
            </div>
        </div>
      </div>

      {/* 影像下載任務確認彈窗 - 優化頻道選取與影格呈現 */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-6xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] ring-1 ring-white/5">
              
              {/* Header */}
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40">
                       <CloudDownload size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">影像下載任務確認</h2>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Review your video clipping request ({activeCameras.length} Active Channels)</p>
                    </div>
                 </div>
                 <button onClick={() => setIsDownloadModalOpen(false)} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                    <X size={28} />
                 </button>
              </div>

              <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                 {/* Top Settings: Time & Storage */}
                 <div className="grid grid-cols-2 gap-8 shrink-0">
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                          <History size={14} /> 時間範圍確認
                       </div>
                       <div className="bg-black/40 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 shadow-inner">
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">開始時間</span>
                             <span className="text-lg font-mono font-black text-white bg-blue-900/20 px-3 py-1 rounded-lg">2025-12-22 17:15:30</span>
                          </div>
                          <div className="h-px bg-slate-800/50"></div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">結束時間</span>
                             <span className="text-lg font-mono font-black text-white bg-blue-900/20 px-3 py-1 rounded-lg">2025-12-22 17:20:30</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                          <HardDrive size={14} /> 儲存位置設定
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setStorageType('device')}
                            className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${storageType === 'device' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:bg-slate-800/40'}`}
                          >
                             <HardDrive size={24} />
                             <span className="text-xs font-black uppercase tracking-widest">裝置本機儲存</span>
                          </button>
                          <button 
                            onClick={() => setStorageType('cloud')}
                            className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${storageType === 'cloud' ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:bg-slate-800/40'}`}
                          >
                             <Cloud size={24} />
                             <span className="text-xs font-black uppercase tracking-widest">SKS 雲端存證</span>
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Multi-Channel Selection & Filmstrip */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <Play size={14} /> 影格分段預覽與頻道選取
                       </div>
                       <div className="flex items-center gap-6">
                          <button 
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-xs font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                          >
                             {selectedCameraIds.size === activeCameras.length ? <CheckSquare size={16}/> : <SquareIcon size={16}/>}
                             {selectedCameraIds.size === activeCameras.length ? '取消全選' : '全選所有頻道'}
                          </button>
                          <span className="text-[10px] font-black text-slate-600 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-tighter">
                             預計檔案大小: {(selectedCameraIds.size * 48.2).toFixed(1)} MB
                          </span>
                       </div>
                    </div>
                    
                    <div className="space-y-12">
                        {activeCameras.map((camera, camIdx) => {
                           const isSelected = selectedCameraIds.has(camera.id);
                           return (
                             <div 
                               key={camera.id} 
                               className={`space-y-4 p-6 rounded-[2.5rem] border transition-all duration-300 relative ${isSelected ? 'bg-blue-600/5 border-blue-500/30' : 'bg-black/20 border-slate-800 opacity-60'}`}
                             >
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                     <button 
                                       onClick={() => toggleCameraSelection(camera.id)}
                                       className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                                     >
                                        {isSelected ? <CheckSquare size={18} /> : <SquareIcon size={18} />}
                                     </button>
                                     <div className="flex items-center gap-2">
                                        <Video size={16} className={isSelected ? 'text-blue-400' : 'text-slate-600'} />
                                        <span className={`text-sm font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-500'}`}>{camera.label}</span>
                                     </div>
                                  </div>
                                  {isSelected && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-900/20 px-3 py-1 rounded-full animate-pulse">READY TO DOWNLOAD</span>}
                               </div>

                               <div className="bg-black/60 rounded-[1.8rem] border border-slate-800/50 p-3 overflow-x-auto no-scrollbar shadow-inner">
                                  <div className="flex gap-4 min-w-max px-2 py-4">
                                     {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="flex flex-col gap-2">
                                           {/* 重點優化：時間戳記標籤置頂且顯眼 */}
                                           <div className="flex justify-center">
                                              <span className="text-[10px] font-mono font-black text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shadow-sm tracking-tighter">
                                                 17:1{i}:{(i*6)%60 < 10 ? '0' : ''}${(i*6)%60}
                                              </span>
                                           </div>
                                           <div className="w-36 h-20 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative shrink-0 group transition-transform hover:scale-105 hover:z-10 cursor-pointer">
                                              <img 
                                                src={`https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_${(i % 4) + 1}.jpg?raw=true`} 
                                                className={`w-full h-full object-cover transition-opacity duration-500 ${isSelected ? 'opacity-80' : 'opacity-30'} group-hover:opacity-100`} 
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                             </div>
                           );
                        })}
                    </div>
                 </div>

                 {/* Progress Indicator */}
                 {isDownloading && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 shrink-0 bg-blue-600/5 p-8 rounded-3xl border border-blue-500/20">
                       <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                             <Loader2 size={16} className="animate-spin" /> 下載執行中... ({selectedCameraIds.size} / {activeCameras.length} 頻道)
                          </span>
                          <span className="text-lg font-mono font-black text-blue-500">{downloadProgress}%</span>
                       </div>
                       <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5">
                          <div className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)] transition-all duration-500 ease-out rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                       </div>
                    </div>
                 )}
              </div>

              {/* Footer */}
              <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-4">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">已選取頻道</span>
                          <span className="text-xl font-black text-white tracking-tighter">{selectedCameraIds.size} <span className="text-xs text-slate-500">CH</span></span>
                       </div>
                       <div className="w-px h-8 bg-slate-800"></div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">預計總時長</span>
                          <span className="text-xl font-black text-white tracking-tighter">05:00 <span className="text-xs text-slate-500">MINS</span></span>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-5">
                    <button 
                      onClick={() => setIsDownloadModalOpen(false)}
                      className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-black text-sm border border-slate-700 uppercase tracking-widest"
                    >
                       取消任務
                    </button>
                    <button 
                      onClick={startDownloadSimulation}
                      disabled={isDownloading || selectedCameraIds.size === 0}
                      className={`px-14 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-4
                        ${isDownloading || selectedCameraIds.size === 0 
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 ring-1 ring-white/10 active:scale-95'
                        }
                      `}
                    >
                       {isDownloading ? <><Loader2 size={20} className="animate-spin"/> 下載中...</> : <><CloudDownload size={20} /> 下載選取內容</>}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PlaybackTab;