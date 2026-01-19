import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Mail, 
  Building2, 
  Star, 
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  HelpCircle,
  Settings2,
  Loader2
} from 'lucide-react';

interface FeedbackTabProps {
  user: {
    name: string;
    email: string;
    site: string;
  };
}

const CATEGORIES = [
  { id: 'technical', label: '技術問題報修', icon: <Settings2 size={16} /> },
  { id: 'suggestion', label: '功能改進建議', icon: <ThumbsUp size={16} /> },
  { id: 'billing', label: '帳務與合約諮詢', icon: <HelpCircle size={16} /> },
  { id: 'other', label: '其他意見', icon: <MessageSquare size={16} /> },
];

const FeedbackTab: React.FC<FeedbackTabProps> = ({ user }) => {
  const [selectedCategory, setSelectedCategory] = useState('technical');
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    // 模擬提交過程
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-20 p-12 bg-[#111827] border border-slate-800 rounded-[3rem] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] mb-8">
          <CheckCircle2 size={48} className="text-emerald-500 animate-in fade-in slide-in-from-bottom-2 duration-700" />
        </div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">意見已成功送出</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
          感謝您的寶貴意見！系統管理員與專服團隊已收到您的回饋，<br />
          若為技術報修項目，我們將於 24 小時內與您聯繫。
        </p>
        <button 
          onClick={() => { setIsSubmitted(false); setContent(''); setRating(0); }}
          className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
        >
          再次填寫回饋
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto p-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-800/50">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Customer Feedback <span className="text-blue-600">.</span></h1>
          <p className="text-sm text-slate-500 font-medium italic">您的聲音是我們進步的動力，歡迎提供關於系統、設備或服務的任何建議</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-600/5 border border-blue-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">SKS Priority Support</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* 左側：帳戶資訊卡 (自動帶入) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full"></div>
             <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <User size={14} className="text-blue-500" /> 帳戶基本資訊 (已自動帶入)
             </h4>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block ml-1">申報者名稱</label>
                   <div className="flex items-center gap-4 p-4 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold">
                         {user.name[0]}
                      </div>
                      <span className="text-sm font-black text-white">{user.name}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block ml-1">聯絡電子郵件</label>
                   <div className="flex items-center gap-4 p-4 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                         <Mail size={18} />
                      </div>
                      <span className="text-sm font-bold text-slate-400">{user.email}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block ml-1">所屬據點節點</label>
                   <div className="flex items-center gap-4 p-4 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                         <Building2 size={18} />
                      </div>
                      <span className="text-sm font-bold text-slate-400">{user.site}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-8 bg-blue-600/5 border border-dashed border-blue-500/20 rounded-[2.5rem] flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <ThumbsUp size={20} className="text-blue-500" />
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">為什麼需要帳戶資訊？</span>
             </div>
             <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
                自動帶入帳戶資訊可幫助技術團隊在處理報修案件時，能第一時間定位硬體節點，加速問題解決。您的聯絡資訊僅用於此次回饋溝通。
             </p>
          </div>
        </div>

        {/* 右側：回饋表單 */}
        <form onSubmit={handleSubmit} className="xl:col-span-2 bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-10 flex flex-col">
          
          {/* 1. 意見分類 */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               <Settings2 size={14} className="text-blue-500" /> 意見類別選擇
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {CATEGORIES.map(cat => (
                 <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      selectedCategory === cat.id 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-900/20' 
                        : 'bg-[#050914] border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                 >
                    <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-lg ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-800'}`}>
                          {cat.icon}
                       </div>
                       <span className="text-sm font-bold">{cat.label}</span>
                    </div>
                    {selectedCategory === cat.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                 </button>
               ))}
            </div>
          </div>

          {/* 2. 評分 */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               <Star size={14} className="text-amber-500" /> 滿意度評分
            </h4>
            <div className="flex items-center gap-4 px-6 py-8 bg-[#050914] border border-slate-800 rounded-[2rem] shadow-inner">
               <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setRating(i)}
                      className="transition-transform active:scale-90"
                    >
                       <Star 
                         size={40} 
                         strokeWidth={i <= rating ? 0 : 2}
                         className={`transition-all ${i <= rating ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-slate-800'}`} 
                       />
                    </button>
                  ))}
               </div>
               <div className="h-10 w-px bg-slate-800 mx-4"></div>
               <span className="text-lg font-black text-slate-400 italic">
                  {rating === 0 ? '請點擊星星進行評分' : rating === 5 ? '非常滿意' : rating >= 3 ? '滿意' : '尚待改進'}
               </span>
            </div>
          </div>

          {/* 3. 詳細內容 */}
          <div className="space-y-4 flex-1 flex flex-col">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               <MessageSquare size={14} className="text-blue-500" /> 詳細回饋內容
            </h4>
            <textarea 
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder="請具體描述您的建議或遇到的問題..."
               className="flex-1 w-full min-h-[250px] bg-[#050914] border border-slate-800 rounded-[2rem] p-8 text-slate-200 text-base font-medium focus:outline-none focus:border-blue-600 transition-all resize-none shadow-inner placeholder:text-slate-800"
            />
          </div>

          {/* 4. 提交按鈕 */}
          <div className="pt-6">
            <button 
               type="submit"
               disabled={isSubmitting || !content.trim()}
               className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 group active:scale-95 ${
                 !content.trim() 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 ring-1 ring-white/10'
               }`}
            >
               {isSubmitting ? (
                 <><Loader2 size={24} className="animate-spin" /> 處理中...</>
               ) : (
                 <><Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 提交回饋意見</>
               )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackTab;