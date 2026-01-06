import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Video, 
  DoorOpen, 
  Bell, 
  Search, 
  Layout, 
  Building2, 
  Server, 
  FolderOpen,
  Wifi,
  Image as ImageIcon,
  Star,
  Thermometer,
  UserSearch,
  Tablet,
  Activity,
  DoorClosed
} from 'lucide-react';
import { SiteNode } from '../types';

interface SiteTreeProps {
  data: SiteNode[];
  onSelect: (node: SiteNode) => void;
  selectedId: string | null;
  showFloorPlanIcons?: boolean;
  idsWithFloorPlan?: Set<string>;
  defaultViewId?: string | null;
  onSetDefaultView?: (id: string | null) => void;
}

const filterTree = (nodes: SiteNode[], searchTerm: string): SiteNode[] => {
  if (!searchTerm) return nodes;
  const lowerTerm = searchTerm.toLowerCase();

  return nodes
    .map((node): SiteNode | null => {
      const matchesSelf = node.label.toLowerCase().includes(lowerTerm);
      const filteredChildren = node.children ? filterTree(node.children, searchTerm) : [];
      const hasMatchingChild = filteredChildren.length > 0;

      if (matchesSelf || hasMatchingChild) {
        return {
          ...node,
          children: filteredChildren,
          isOpen: true,
        };
      }
      return null;
    })
    .filter((node): node is SiteNode => node !== null);
};

const TreeNode: React.FC<{
  node: SiteNode;
  level: number;
  onSelect: (node: SiteNode) => void;
  selectedId: string | null;
  showFloorPlanIcons?: boolean;
  idsWithFloorPlan?: Set<string>;
  defaultViewId?: string | null;
  onSetDefaultView?: (id: string | null) => void;
}> = ({ node, level, onSelect, selectedId, showFloorPlanIcons, idsWithFloorPlan, defaultViewId, onSetDefaultView }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const hasFloorPlan = showFloorPlanIcons && idsWithFloorPlan?.has(node.id);
  const isDefaultView = showFloorPlanIcons && defaultViewId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    onSelect(node);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSetDefaultView) {
      onSetDefaultView(node.id);
    }
  };

  // 更新：主機 (host) 也支援拖曳
  const isDraggable = node.type === 'device' || node.type === 'host';

  const handleDragStart = (e: React.DragEvent) => {
    if (isDraggable) {
      e.dataTransfer.setData('application/json', JSON.stringify({
        id: node.id,
        label: node.label,
        deviceType: node.deviceType,
        nodeType: node.type, // 新增：傳遞節點類型以利區分主機與設備
        type: 'device' // 保持通用的 Drag Type
      }));
      e.dataTransfer.effectAllowed = 'copy';
    } else {
      e.preventDefault();
    }
  };

  const getIcon = () => {
    if (node.type === 'device') {
      if (node.label === '環境偵測器') return <Thermometer size={14} className="text-cyan-400" />;
      if (node.label === '空間偵測器') return <UserSearch size={14} className="text-emerald-400" />;
      if (node.label === '多功能按鈕') return <Tablet size={14} className="text-amber-400" />;
      if (node.label === 'PIR') return <Activity size={14} className="text-blue-400" />;
      if (node.label === '門磁') return <DoorClosed size={14} className="text-orange-400" />;

      switch (node.deviceType) {
        case 'camera': return <Video size={14} className="text-slate-400" />;
        case 'door': return <DoorOpen size={14} className="text-slate-400" />;
        case 'emergency': return <Bell size={14} className="text-slate-400" />;
        default: return <Wifi size={14} className="text-slate-400" />;
      }
    }
    
    switch (node.type) {
      case 'group': return <Layout size={16} className="text-blue-500" />;
      case 'site': return <Building2 size={16} className="text-blue-400" />;
      case 'host': return <Server size={14} className="text-slate-400" />;
      case 'zone': return <FolderOpen size={14} className={isSelected ? 'text-white' : 'text-slate-500'} />;
      default: return null;
    }
  };

  return (
    <div className="select-none">
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onClick={handleSelect}
        className={`flex items-center py-2 pr-2 cursor-pointer transition-all rounded-xl mb-0.5 group ${
          isSelected 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
            : 'text-slate-400 hover:bg-slate-800'
        } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <span
          onClick={hasChildren ? handleToggle : undefined}
          className={`mr-1 p-0.5 rounded hover:bg-white/10 ${hasChildren ? 'cursor-pointer' : 'opacity-0 pointer-events-none'}`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        
        <span className="mr-2 shrink-0">{getIcon()}</span>
        
        <span className={`text-xs truncate ${isSelected ? 'font-black' : 'font-bold'}`}>
          {node.label}
        </span>

        {isDefaultView ? (
          <div 
            className="ml-auto flex items-center pr-1" 
            title="目前以此區域作為預設進入視角 (點擊取消)"
            onClick={handleIconClick}
          >
             <div className={`p-1 rounded-md transition-all active:scale-75 ${
               isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
             }`}>
                <Star size={10} strokeWidth={4} fill="currentColor" />
             </div>
          </div>
        ) : hasFloorPlan ? (
          <div 
            className="ml-auto flex items-center pr-1" 
            title="此區域已配置圖資 (點擊設為預設視角)"
            onClick={handleIconClick}
          >
            <div className={`p-1 rounded-md transition-all active:scale-75 hover:bg-blue-500 hover:text-white ${
              isSelected 
                ? 'bg-white/20 text-white' 
                : 'bg-blue-500/10 text-blue-400'
            }`}>
              <ImageIcon size={10} strokeWidth={3} />
            </div>
          </div>
        ) : null}
      </div>

      {hasChildren && isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              showFloorPlanIcons={showFloorPlanIcons}
              idsWithFloorPlan={idsWithFloorPlan}
              defaultViewId={defaultViewId}
              onSetDefaultView={onSetDefaultView}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SiteTree: React.FC<SiteTreeProps> = ({ 
  data, 
  onSelect, 
  selectedId, 
  showFloorPlanIcons, 
  idsWithFloorPlan,
  defaultViewId,
  onSetDefaultView
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => filterTree(data, searchTerm), [data, searchTerm]);

  return (
    <div className="w-80 bg-[#0b1121] border-r border-slate-800 flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b border-slate-800/50">
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋區域或分區..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 shadow-inner"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-slate-600" />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-3 custom-scrollbar">
        {filteredData.map((node) => (
          <TreeNode 
            key={node.id} 
            node={node} 
            level={0} 
            onSelect={onSelect} 
            selectedId={selectedId} 
            showFloorPlanIcons={showFloorPlanIcons}
            idsWithFloorPlan={idsWithFloorPlan}
            defaultViewId={defaultViewId}
            onSetDefaultView={onSetDefaultView}
          />
        ))}
        {filteredData.length === 0 && (
          <div className="text-center text-slate-600 text-xs mt-10 italic">無符合搜尋結果</div>
        )}
      </div>
      
      <div className="p-3 border-t border-slate-800/50 text-center bg-black/10">
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
          SKS Site Hierarchy
        </span>
      </div>
    </div>
  );
};

export default SiteTree;