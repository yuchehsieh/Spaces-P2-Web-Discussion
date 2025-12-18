
import React, { useState, useEffect } from 'react';
import { GridSize } from '../types';
import { X, Circle } from 'lucide-react';

export interface VideoSlotData {
  id: string;
  label: string;
  isRecording: boolean;
}

interface VideoGridProps {
  gridSize: GridSize;
  activeSlots: Record<number, VideoSlotData>;
  onDropCamera: (index: number, camera: { id: string; label: string }) => void;
  onRemoveCamera: (index: number) => void;
  onToggleRecording: (index: number) => void;
}

const MOCK_CAMERA_IMAGES = [
  'https://github.com/yuchehsieh/Spaces-P2-Web-Discussion/blob/main/images/mock_camera_1.jpg?raw=true',
  'https://github.com/yuchehsieh/Spaces-P2-Web-Discussion/blob/main/images/mock_camera_2.jpg?raw=true',
  'https://github.com/yuchehsieh/Spaces-P2-Web-Discussion/blob/main/images/mock_camera_3.jpg?raw=true',
  'https://github.com/yuchehsieh/Spaces-P2-Web-Discussion/blob/main/images/mock_camera_4.jpg?raw=true',
];

const VideoGrid: React.FC<VideoGridProps> = ({ 
  gridSize, 
  activeSlots, 
  onDropCamera, 
  onRemoveCamera,
  onToggleRecording 
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Helper to pick a consistent image for a given camera ID
  const getCameraImage = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % MOCK_CAMERA_IMAGES.length;
    return MOCK_CAMERA_IMAGES[index];
  };

  // Generate placeholders based on grid size
  const slots = Array.from({ length: gridSize }, (_, i) => i);

  const getGridCols = () => {
    switch (gridSize) {
      case 1: return 'grid-cols-1 grid-rows-1';
      case 4: return 'grid-cols-2 grid-rows-2';
      case 9: return 'grid-cols-3 grid-rows-3';
      case 16: return 'grid-cols-4 grid-rows-4';
      default: return 'grid-cols-2';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'camera') {
        onDropCamera(index, { id: data.id, label: data.label });
      }
    } catch (err) {
      console.error('Invalid drop data', err);
    }
  };

  return (
    <div className={`flex-1 grid ${getGridCols()} gap-[1px] bg-slate-800 h-full overflow-hidden p-[1px]`}>
      {slots.map((index) => {
        const slotData = activeSlots[index];
        const isDragOver = dragOverIndex === index;
        
        return (
          <div 
            key={index} 
            className={`relative bg-[#0a0f1e] border border-slate-800 flex items-center justify-center group overflow-hidden transition-colors ${
              isDragOver ? 'border-2 border-blue-500 bg-blue-900/20' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {slotData ? (
              <div 
                className="relative w-full h-full cursor-pointer"
                onClick={() => onToggleRecording(index)}
              >
                {/* Simulated Live Feed */}
                <img 
                  src={getCameraImage(slotData.id)}
                  alt="Camera Feed" 
                  className="w-full h-full object-cover pointer-events-none"
                />
                
                {/* Overlay Info */}
                <div className="absolute top-2 right-8 text-white text-xs bg-black/50 px-2 py-1 rounded font-mono pointer-events-none">
                  2025-12-17 17:00:40
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCamera(index);
                  }}
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="移除畫面"
                >
                  <X size={12} />
                </button>
                
                {/* Camera Name Overlay */}
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black/40 px-2 py-1 rounded pointer-events-none">
                  {slotData.label}
                </div>

                {/* Recording Indicator */}
                {slotData.isRecording && (
                   <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/80 px-2 py-0.5 rounded animate-pulse pointer-events-none">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-[10px] font-bold text-white tracking-wider">REC</span>
                   </div>
                )}
                
                {/* Click feedback overlay (optional visual aid) */}
                <div className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-colors pointer-events-none"></div>

                {/* Selection Border */}
                <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/50 pointer-events-none"></div>
              </div>
            ) : (
              // Empty Slot / Placeholder
              <div className="flex flex-col items-center justify-center opacity-30 select-none pointer-events-none">
                 {/* Video Camera Icon Placeholder */}
                 <svg className="w-12 h-12 text-slate-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M21 7L17 11V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13L21 17V7Z" />
                 </svg>
                 <span className="text-xs text-slate-500">拖曳攝影機至此</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VideoGrid;
