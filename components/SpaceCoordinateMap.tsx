import React, { useMemo } from 'react';
import { Crosshair, MapPin, Layers, Info } from 'lucide-react';

const SpaceCoordinateMap: React.FC = () => {
  // 模擬即時座標點位數據
  const points = useMemo(() => [
    { x: 25, y: 35, size: 80, intensity: 0.6 },
    { x: 65, y: 55, size: 120, intensity: 0.8 },
  ], []);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 h-full">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between bg-black/20 p-5 rounded-[2.5rem] border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner">
             <Crosshair size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">空間即時座標映射圖</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Real-time spatial coordinate mapping</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-[#050914] border border-slate-800 rounded-xl shadow-inner">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Live Scanning</span>
        </div>
      </div>

      {/* 核心網格映射區 */}
      <div className="flex-1 bg-[#0b1121] border border-slate-800 rounded-[3rem] p-1 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[500px]">
        {/* 背景網格 */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 opacity-[0.05] pointer-events-none">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="border border-white/40"></div>
          ))}
        </div>

        {/* 座標映射容器 */}
        <div className="relative w-full h-full max-w-[1000px] max-h-[600px] border border-blue-500/10 rounded-2xl">
           {/* 模擬熱力暈染 (Glow) */}
           {points.map((p, i) => (
             <div 
               key={`glow-${i}`}
               className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen animate-pulse"
               style={{ 
                 left: `${p.x}%`, 
                 top: `${p.y}%`, 
                 width: `${p.size * 2}px`, 
                 height: `${p.size * 2}px`,
                 background: `radial-gradient(circle, rgba(249, 115, 22, ${p.intensity * 0.3}) 0%, transparent 70%)`,
                 animationDuration: `${2 + i}s`
               }}
             />
           ))}

           {/* 座標點 (Green Dots) */}
           {points.map((p, i) => (
             <div 
               key={`point-${i}`}
               className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
               style={{ left: `${p.x}%`, top: `${p.y}%` }}
             >
                <div className="relative">
                   <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(16,185,129,0.8)] ring-4 ring-emerald-500/20 group-hover:scale-125 transition-transform duration-300"></div>
                   {/* Label */}
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-[9px] font-black shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                      ID: OBJ-0{i+1} (Target)
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* 邊角裝飾標籤 */}
        <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none opacity-40">
           <span className="text-[8px] font-black text-slate-500 font-mono tracking-widest">FOV_X: 120DEG</span>
           <span className="text-[8px] font-black text-slate-500 font-mono tracking-widest">FOV_Y: 90DEG</span>
        </div>
        <div className="absolute bottom-8 right-8 pointer-events-none">
           <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
              <Layers size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Multi-layered Spatial View</span>
           </div>
        </div>
      </div>

      {/* 底部說明 */}
      <div className="flex items-center gap-4 px-6 py-4 bg-blue-600/5 border border-dashed border-blue-500/20 rounded-2xl">
         <Info size={16} className="text-blue-500 shrink-0" />
         <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic uppercase tracking-widest">
            座標圖顯示當前空間內所有感測目標的 X/Y 相對位置，點位顏色深淺代表偵測信號強度。數據每 500ms 自動更新。
         </p>
      </div>
    </div>
  );
};

export default SpaceCoordinateMap;