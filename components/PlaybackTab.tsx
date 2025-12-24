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
  GripHorizontal
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
  
  // 擷取框互動狀態 (以像素為單位)
  const [selectionBox, setSelectionBox] = useState({ top: 150, height: 100 });
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isResizingTop, setIsResizingTop] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const dragStartY = useRef(0);
  const initialBoxY = useRef(0);
  const initialBoxH = useRef(0);
  
  const viewportRef = useRef<HTMLDivElement>(null);

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
      alert("開始下載選取片段...");
      setIsClipping(false);
      setHasSelection(false);
    }
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
                  <span className="text-[10px] text-blue-200 font-bold">{hasSelection ? '拖動藍色方框調整區間，完成後點擊確認' : '請在右側時間軸選擇欲擷取的範圍'}</span>
                </div>
                <button onClick={discardCapture} className="ml-4 p-1.5 bg-black/30 hover:bg-red-500/50 rounded-lg transition-all"><X size={16} className="text-white"/></button>
            </div>
          )}
        </div>
      </div>

      {/* 右側時間軸區域 - 設計優化 */}
      <div className="w-72 bg-[#0b1121] border-l border-slate-800 flex flex-col h-full shrink-0">
        
        {/* Header Section - Stacked for better spacing */}
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
                
                {/* 中央主要軌道 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-800 -translate-x-1/2 rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-0 w-full bg-blue-900/40 border-x border-blue-500/20"></div>
                </div>

                {/* 刻度與標籤 - 以軌道為中心左右分布 */}
                <div className="h-full w-full relative">
                    {timeLabels.map((label, idx) => (
                        <div key={idx} className="absolute w-full flex items-center justify-center" style={{ top: `${idx * 5}%` }}>
                            {/* 左側時間標籤 */}
                            <div className="absolute right-[calc(50%+1rem)] text-[10px] font-black text-slate-500 font-mono tracking-tighter w-20 text-right">
                                {label}
                            </div>
                            {/* 中央刻度點 */}
                            <div className={`h-px w-3 bg-slate-500/50 ${idx % 5 === 0 ? 'w-5 bg-slate-400' : ''}`}></div>
                        </div>
                    ))}
                </div>

                {/* LIVE LINE - 中心橫跨 */}
                {timeOffset === 0 && (
                  <div className="absolute top-8 left-0 right-0 z-20 flex items-center">
                      <div className="h-px bg-red-500 flex-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                      <div className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-widest z-10 mx-auto border border-red-400">
                          LIVE
                      </div>
                      <div className="h-px bg-red-500 flex-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  </div>
                )}

                {/* 擷取範圍選取區 - 支援拖動與縮放 */}
                {isClipping && (
                  <div 
                    style={{ top: `${selectionBox.top}px`, height: `${selectionBox.height}px` }}
                    className="absolute left-12 right-12 bg-blue-500/30 border border-blue-400/60 rounded-lg z-30 transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] group/box"
                    onMouseDown={(e) => handleMouseDown(e, 'box')}
                  >
                      {/* 上方縮放拉桿 */}
                      <div 
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-400 rounded-full cursor-ns-resize flex items-center justify-center border border-white/20 opacity-0 group-hover/box:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleMouseDown(e, 'top')}
                      >
                        <div className="w-4 h-0.5 bg-white/60 rounded-full"></div>
                      </div>

                      {/* 內容指示器 */}
                      <div className="h-full w-full flex items-center justify-center">
                         <div className="bg-blue-600 rounded-full p-2 shadow-xl ring-2 ring-blue-400">
                           <Scissors size={14} className="text-white" />
                         </div>
                         <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-[9px] font-black px-2 py-1 rounded shadow-xl text-white whitespace-nowrap border border-blue-400 translate-x-full">
                            {Math.round(selectionBox.height / 5)} MINS
                         </div>
                      </div>

                      {/* 下方縮放拉桿 */}
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

        {/* Timeline Bottom Controls */}
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
    </div>
  );
};

export default PlaybackTab;