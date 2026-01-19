import React, { useMemo } from 'react';
import { History, Clock, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';

interface TriggerRecord {
  id: string;
  timestamp: string;
  message: string;
  status: string;
  statusType: 'auto' | 'admin' | 'normal';
}

interface TriggerHistoryProps {
  deviceLabel: string;
}

const TriggerHistory: React.FC<TriggerHistoryProps> = ({ deviceLabel }) => {
  const records = useMemo((): TriggerRecord[] => {
    const now = new Date();
    const dateStr = "2025-12-18"; // 固定日期以符合圖片範例
    
    // 根據設備名稱決定顯示訊息內容
    let msg = "偵測到活動";
    if (deviceLabel.includes('多功能按鈕')) msg = "按鈕按壓觸發";
    else if (deviceLabel.includes('SOS')) msg = "緊急按鈕按壓觸發";
    else if (deviceLabel.includes('門磁')) msg = "偵測門磁觸發";
    else if (deviceLabel.includes('PIR')) msg = "偵測到人員活動";

    return [
      { id: '1', timestamp: `${dateStr} 17:05:22`, message: msg, status: "自動結案", statusType: 'auto' },
      { id: '2', timestamp: `${dateStr} 16:42:15`, message: msg, status: "管理員檢視", statusType: 'admin' },
      { id: '3', timestamp: `${dateStr} 12:05:30`, message: msg, status: "正常", statusType: 'normal' },
      { id: '4', timestamp: `${dateStr} 09:15:00`, message: msg, status: "自動結案", statusType: 'auto' },
    ];
  }, [deviceLabel]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* 標題 */}
      <div className="flex items-center justify-between bg-black/20 p-5 rounded-[2rem] border border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
             <History size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">設備觸發歷史紀錄</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Device Event Trigger Logs</p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-[#050914] border border-slate-800 rounded-xl">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total {records.length} Records</span>
        </div>
      </div>

      {/* 紀錄列表 */}
      <div className="space-y-3">
        {records.map((record) => (
          <div 
            key={record.id}
            className="flex items-center justify-between p-6 bg-[#1e293b]/30 border border-slate-800 rounded-[1.8rem] hover:bg-[#1e293b]/50 transition-all group"
          >
            <div className="flex items-center gap-8">
              {/* 時間戳記 */}
              <div className="bg-black/40 px-4 py-1.5 rounded-lg border border-white/5 shadow-inner">
                <span className="text-xs font-mono font-black text-slate-500 tracking-tighter group-hover:text-slate-300 transition-colors">
                  {record.timestamp}
                </span>
              </div>

              {/* 事件訊息 */}
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                <span className="text-sm font-black text-slate-200 tracking-tight">{record.message}</span>
              </div>
            </div>

            {/* 狀態與圖示 */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {record.statusType === 'auto' ? (
                  <ShieldCheck size={14} className="text-slate-600" />
                ) : record.statusType === 'admin' ? (
                  <UserCheck size={14} className="text-slate-600" />
                ) : (
                  <CheckCircle2 size={14} className="text-slate-600" />
                )}
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-widest">
                  {record.status}
                </span>
              </div>
              <div className="text-slate-800 group-hover:text-blue-500 transition-colors">
                <History size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center py-4 opacity-30">
         <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">End of Records</span>
      </div>
    </div>
  );
};

export default TriggerHistory;