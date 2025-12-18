import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Video, Wifi, DoorOpen, Bell, Search } from 'lucide-react';
import { SiteNode } from '../types';

interface SiteTreeProps {
  data: SiteNode[];
  onSelect: (node: SiteNode) => void;
  selectedId: string | null;
}

// Helper to filter the tree based on search term
const filterTree = (nodes: SiteNode[], searchTerm: string): SiteNode[] => {
  if (!searchTerm) return nodes;
  const lowerTerm = searchTerm.toLowerCase();

  return nodes
    .map((node): SiteNode | null => {
      // Check if current node matches
      const matchesSelf = node.label.toLowerCase().includes(lowerTerm);
      
      // Check children
      const filteredChildren = node.children 
        ? filterTree(node.children, searchTerm) 
        : [];
      
      const hasMatchingChild = filteredChildren.length > 0;

      if (matchesSelf || hasMatchingChild) {
        return {
          ...node,
          children: filteredChildren,
          isOpen: true, // Force open if searching
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
}> = ({ node, level, onSelect, selectedId }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    onSelect(node);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Only allow dragging if it is a camera
    if (node.deviceType === 'camera') {
      e.dataTransfer.setData('application/json', JSON.stringify({
        id: node.id,
        label: node.label,
        type: node.deviceType
      }));
      e.dataTransfer.effectAllowed = 'copy';
    } else {
      e.preventDefault();
    }
  };

  // Icon selection logic
  const getIcon = () => {
    if (node.type === 'device') {
      switch (node.deviceType) {
        case 'camera': return <Video size={14} />;
        case 'door': return <DoorOpen size={14} />;
        case 'emergency': return <Bell size={14} />;
        default: return <Wifi size={14} />;
      }
    }
    return null;
  };

  const isSelected = selectedId === node.id;
  // Can only drag if it's a camera
  const isDraggable = node.deviceType === 'camera';

  return (
    <div className="select-none">
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        className={`flex items-center py-1 pr-2 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-900/50 text-blue-200' : 'text-gray-300 hover:bg-slate-800'
        } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleSelect}
      >
        <span
          onClick={hasChildren ? handleToggle : undefined}
          className={`mr-1 p-0.5 rounded hover:bg-slate-700 ${hasChildren ? 'cursor-pointer' : 'opacity-0'}`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        
        {!getIcon() && <span className="mr-2 text-gray-500">•</span>}
        {getIcon() && <span className="mr-2 text-gray-400">{getIcon()}</span>}
        
        <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{node.label}</span>
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SiteTree: React.FC<SiteTreeProps> = ({ data, onSelect, selectedId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => filterTree(data, searchTerm), [data, searchTerm]);

  return (
    <div className="w-64 bg-black border-r border-slate-800 flex flex-col h-full flex-shrink-0">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-black">
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋設備..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-blue-500"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-slate-500" />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 py-2">
        {filteredData.map((node) => (
          <TreeNode key={node.id} node={node} level={0} onSelect={onSelect} selectedId={selectedId} />
        ))}
        {filteredData.length === 0 && (
          <div className="text-center text-slate-600 text-sm mt-4">無符合項目</div>
        )}
      </div>
      <div className="p-2 border-t border-slate-800 text-center text-xs text-gray-600">
        (Site Group 區)
      </div>
    </div>
  );
};

export default SiteTree;