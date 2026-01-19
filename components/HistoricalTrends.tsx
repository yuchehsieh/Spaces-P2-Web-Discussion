import React, { useState, useMemo } from 'react';
import { History, TrendingUp, Calendar, Clock } from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month' | 'half_year' | 'year';

const HistoricalTrends: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');

  // 模擬不同維度的數據特徵
  const rangeLabels: Record<TimeRange, string> = {
    day: '24H 回溯',
    week: '7D 回溯',
    month: '30D 回溯',
    half_year: '180D 回溯',
    year: '1Y 回溯'
  };

  const timeOptions = [
    { id: 'day', label: '日' },
    { id: 'week', label: '週' },
    { id: 'month', label: '月' },
    { id: 'half_year', label: '半年' },
    { id: 'year', label: '年' }
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* 頂部切換控制區 */}
      <div className="flex items-center justify-between bg-black/20 p-5 rounded-[2rem] border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
             <History size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">歷史數據趨勢 ({rangeLabels[timeRange]})</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Sensor telemetry historical analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
           {timeOptions.map(opt => (
             <button 
               key={opt.id}
               onClick={() => setTimeRange(opt.id as TimeRange)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === opt.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </div>

      {/* 趨勢圖表區 */}
      <div className="space-y-6">
         {/* 溫度趨勢 */}
         <TrendCard 
            title="溫度趨勢 (°C)" 
            color="#f97316" 
            max="25" 
            cur="22.5" 
            points={[20, 22, 21, 23, 23.5, 25, 24.5, 22, 21, 20.5]} 
         />
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 濕度趨勢 */}
            <TrendCard 
               title="濕度趨勢 (%)" 
               color="#3b82f6" 
               max="60" 
               cur="54" 
               points={[45, 52, 48, 55, 58, 60, 52, 51, 54, 53]} 
            />
            {/* 光照強度 */}
            <TrendCard 
               title="光照強度 (LUX)" 
               color="#facc15" 
               max="500" 
               cur="50" 
               points={[10, 100, 300, 450, 500, 420, 200, 50, 40, 30]} 
            />
         </div>
      </div>

      <div className="p-6 bg-blue-600/5 border border-dashed border-blue-500/20 rounded-[2rem] flex items-center gap-4 opacity-60">
         <Clock size={20} className="text-blue-500" />
         <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic uppercase tracking-widest">
            以上數據採樣率為每 5 分鐘一次，系統自動保存近一年度完整數據紀錄。
         </p>
      </div>
    </div>
  );
};

const TrendCard = ({ title, color, max, cur, points }: { title: string, color: string, max: string, cur: string, points: number[] }) => {
  // 生成 SVG Path 數據
  const pathData = useMemo(() => {
    const width = 1000;
    const height = 200;
    const maxVal = Math.max(...points) * 1.2;
    return points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - (p / maxVal) * height;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }, [points]);

  return (
    <div className="bg-[#1e293b]/30 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-8 relative z-10">
         <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
         <div className="flex items-center gap-6 font-mono italic">
            <div className="flex items-baseline gap-2">
               <span className="text-[9px] font-black text-slate-600 uppercase">MAX:</span>
               <span className="text-sm font-black text-white">{max}</span>
            </div>
            <div className="flex items-baseline gap-2">
               <span className="text-[9px] font-black text-slate-600 uppercase">CUR:</span>
               <span className="text-sm font-black" style={{ color }}>{cur}</span>
            </div>
         </div>
      </div>

      <div className="h-44 w-full relative">
         {/* 網格背景 */}
         <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 opacity-[0.03] pointer-events-none">
            {Array.from({length: 20}).map((_, i) => <div key={i} className="border border-white"></div>)}
         </div>

         {/* 趨勢線 SVG */}
         <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
               <filter id={`glow-${title.charAt(0)}`}>
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
               </filter>
            </defs>
            <path 
              d={pathData} 
              fill="none" 
              stroke={color} 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter={`url(#glow-${title.charAt(0)})`}
              className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            />
            {/* 區域填滿漸層 */}
            <path 
              d={`${pathData} L1000,200 L0,200 Z`} 
              fill={`url(#grad-${title.charAt(0)})`}
            />
            <defs>
               <linearGradient id={`grad-${title.charAt(0)}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
               </linearGradient>
            </defs>
         </svg>
      </div>
    </div>
  );
};

export default HistoricalTrends;