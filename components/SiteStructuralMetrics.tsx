import React from 'react';
import { Layers, Monitor } from 'lucide-react';

const SiteStructuralMetrics: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full opacity-40 animate-in fade-in py-40">
       <Layers size={64} className="mb-4" />
       <h3 className="text-xl font-black uppercase italic text-white mb-4">結構指標數據計算中...</h3>
       <div className="flex items-center gap-2 text-slate-500">
          <Monitor size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest italic">數據計算中心連線中...</span>
       </div>
    </div>
  );
};

export default SiteStructuralMetrics;