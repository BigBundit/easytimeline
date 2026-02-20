
import React, { useRef, useEffect } from 'react';
import { Task, TimelineScale, TimelineTheme, HeaderGroup } from '../types';

interface TimelineChartProps {
  tasks: Task[];
  headerGroups: HeaderGroup[];
  scale: TimelineScale;
  theme: TimelineTheme;
  columnCount: number;
  minColumnWidth: number;
  taskListWidth: number;
  showVerticalLines: boolean;
  customTimeLabels?: Record<string, string>;
  taskListLabel: string;
  onUpdateTimeLabel?: (index: number, value: string) => void;
  onToggleSlot: (taskId: string, slotIndex: number, forceState?: boolean) => void;
  onAddTask: () => void;
  onRemoveTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onUpdateTaskListLabel: (value: string) => void;
  onUpdateHeaderGroupLabel: (id: string, label: string) => void;
  onPasteTasks: (taskId: string, lines: string[]) => void;
  onTaskListWidthChange: (width: number) => void;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ 
  tasks, 
  headerGroups,
  scale, 
  theme, 
  columnCount,
  minColumnWidth,
  taskListWidth,
  showVerticalLines, 
  customTimeLabels = {},
  taskListLabel,
  onUpdateTimeLabel,
  onToggleSlot,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onUpdateTaskListLabel,
  onUpdateHeaderGroupLabel,
  onPasteTasks,
  onTaskListWidthChange
}) => {

  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Drag-to-select state
  const dragInfo = useRef<{ isDragging: boolean; taskId: string | null; adding: boolean }>({
    isDragging: false,
    taskId: null,
    adding: true
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    resizingRef.current = true;
    startXRef.current = e.pageX;
    startWidthRef.current = taskListWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (resizingRef.current) {
        const diff = moveEvent.pageX - startXRef.current;
        const newWidth = Math.max(80, startWidthRef.current + diff);
        onTaskListWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      resizingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    resizingRef.current = true;
    startXRef.current = e.touches[0].pageX;
    startWidthRef.current = taskListWidth;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (resizingRef.current) {
        const diff = moveEvent.touches[0].pageX - startXRef.current;
        const newWidth = Math.max(80, startWidthRef.current + diff);
        onTaskListWidthChange(newWidth);
      }
    };

    const handleTouchEnd = () => {
      resizingRef.current = false;
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleSlotMouseDown = (taskId: string, slotIndex: number, isCurrentlySelected: boolean) => {
    dragInfo.current = {
      isDragging: true,
      taskId: taskId,
      adding: !isCurrentlySelected 
    };
    // Apply immediate change to start slot
    onToggleSlot(taskId, slotIndex, !isCurrentlySelected);
    
    // Prevent default browser drag behavior
    document.body.style.userSelect = 'none';
  };

  const handleSlotMouseEnter = (taskId: string, slotIndex: number) => {
    if (dragInfo.current.isDragging && dragInfo.current.taskId === taskId) {
      onToggleSlot(taskId, slotIndex, dragInfo.current.adding);
    }
  };

  const handleGlobalMouseUp = () => {
    if (dragInfo.current.isDragging) {
      dragInfo.current = { isDragging: false, taskId: null, adding: true };
      document.body.style.userSelect = '';
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const getDefaultHeaderLabel = (index: number) => {
    switch (scale) {
      case TimelineScale.DAILY: return `${index + 1}`;
      case TimelineScale.WEEKLY: return `W${index + 1}`;
      case TimelineScale.MONTHLY: {
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const yearOffset = Math.floor(index / 12);
        const monthLabel = months[index % 12];
        return yearOffset > 0 ? `${monthLabel} '${(yearOffset + 1).toString().slice(-2)}` : monthLabel;
      }
      default: return `${index + 1}`;
    }
  };

  const textClass = theme.text;
  const gridClass = theme.grid;
  const bgClass = theme.bg;
  const headerGroupTextClass = theme.headerGroupText || theme.text;
  const headerGroupBg = theme.headerGroupBg;
  const headerRowBg = theme.headerRowBg;
  const hoverClass = theme.hover;
  const inputBgClass = theme.inputBg;

  // Pre-calculate indices that represent the end of a header group to draw vertical separators
  const groupEndIndices = new Set(headerGroups.map(g => g.end));

  const getParentHeaderRow = () => {
    const rowCells = [];
    let currentIdx = 0;
    const sortedGroups = [...headerGroups].sort((a, b) => a.start - b.start);

    while (currentIdx < columnCount) {
      const group = sortedGroups.find(g => g.start === currentIdx);
      if (group) {
        const span = Math.min(group.end - group.start + 1, columnCount - currentIdx);
        rowCells.push(
          <th 
            key={`g-${group.id}`} 
            colSpan={span}
            className={`p-1 border-b border-r ${gridClass} text-center ${headerGroupBg} relative overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <input
              type="text"
              value={group.label}
              onChange={(e) => onUpdateHeaderGroupLabel(group.id, e.target.value)}
              className={`bg-white text-center w-full py-2 focus:outline-none ${inputBgClass} rounded-lg cursor-pointer ${headerGroupTextClass} font-black text-[10px] md:text-xs uppercase tracking-wide border border-slate-200 shadow-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all`}
              placeholder="GROUP NAME"
            />
          </th>
        );
        currentIdx += span;
      } else {
        const nextGroup = sortedGroups.find(g => g.start > currentIdx);
        const span = nextGroup ? nextGroup.start - currentIdx : columnCount - currentIdx;
        rowCells.push(
          <th 
            key={`empty-${currentIdx}`} 
            colSpan={span}
            className={`p-2 border-b border-r ${gridClass} bg-transparent`}
          />
        );
        currentIdx += span;
      }
    }
    return rowCells;
  };

  return (
    <div className={`relative inline-block ${bgClass} min-w-full font-sans`}>
      <table className={`border-collapse min-w-full border-spacing-0`}>
        <thead>
          <tr>
            <th 
              className={`sticky left-0 z-30 border-b border-r ${gridClass} ${headerGroupBg}`}
              style={{ width: taskListWidth, minWidth: taskListWidth, maxWidth: taskListWidth }}
            />
            {getParentHeaderRow()}
          </tr>
          <tr className={headerRowBg}>
            <th 
              className={`sticky left-0 z-30 p-2 text-left border-b border-r ${gridClass} ${bgClass} backdrop-blur-md shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] relative`}
              style={{ width: taskListWidth, minWidth: taskListWidth, maxWidth: taskListWidth }}
            >
               <div className="px-2 py-1 rounded-lg hover:bg-slate-100/50 transition-colors">
                 <input
                  type="text"
                  value={taskListLabel}
                  onChange={(e) => onUpdateTaskListLabel(e.target.value)}
                  className={`bg-transparent w-full focus:outline-none cursor-pointer font-black text-xs md:text-sm uppercase tracking-wider ${textClass}`}
                />
               </div>
               {/* Resizer Handle */}
               <div 
                 className="absolute top-0 right-0 bottom-0 w-6 -mr-3 cursor-col-resize z-50 flex justify-center group touch-none select-none"
                 onMouseDown={handleMouseDown}
                 onTouchStart={handleTouchStart}
               >
                  <div className="w-1 h-full bg-transparent group-hover:bg-blue-400/50 transition-colors" />
               </div>
            </th>
            {Array.from({ length: columnCount }).map((_, i) => {
              const labelKey = `${scale}-${i}`;
              const displayLabel = customTimeLabels[labelKey] ?? getDefaultHeaderLabel(i);
              const isGroupEnd = groupEndIndices.has(i);

              return (
                <th 
                  key={i} 
                  style={{ minWidth: `${minColumnWidth}px` }}
                  className={`relative p-1 text-center border-b ${showVerticalLines && isGroupEnd ? `border-r ${gridClass}` : ''} ${gridClass} ${textClass} bg-transparent align-middle group`}
                >
                  <input
                    type="text"
                    value={displayLabel}
                    onChange={(e) => onUpdateTimeLabel && onUpdateTimeLabel(i, e.target.value)}
                    className={`bg-transparent text-center w-full py-2 focus:outline-none ${inputBgClass} rounded hover:bg-black/5 transition-all cursor-pointer font-bold text-[10px] md:text-[11px] ${textClass}`}
                  />
                  {/* Subtle hover guide line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className={`group ${hoverClass} transition-colors duration-150`}>
              <td 
                className={`sticky left-0 z-20 p-2 md:py-3 md:px-4 border-r ${gridClass} ${bgClass} shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]`}
                style={{ width: taskListWidth, minWidth: taskListWidth, maxWidth: taskListWidth }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 md:w-5 md:h-5 rounded-md shadow-sm flex-shrink-0 border border-slate-200" 
                    style={{ backgroundColor: task.color }} 
                  />
                  <input
                    type="text"
                    value={task.label}
                    onChange={(e) => onUpdateTask(task.id, { label: e.target.value })}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
                      if (lines.length > 1) {
                         e.preventDefault();
                         onPasteTasks(task.id, lines);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onAddTask();
                      } else if (e.key === 'Backspace' && task.label === '') {
                        onRemoveTask(task.id);
                      }
                    }}
                    className={`flex-1 bg-transparent border-none p-1 -ml-1 rounded focus:ring-0 ${inputBgClass} hover:bg-black/5 transition-colors text-xs md:text-sm font-bold ${textClass} placeholder:text-slate-400 focus:outline-none`}
                    placeholder="Type task name..."
                  />
                </div>
              </td>
              {Array.from({ length: columnCount }).map((_, i) => {
                const isActive = task.slots.includes(i);
                const isFirst = i === 0 || !task.slots.includes(i - 1);
                const isLast = i === columnCount - 1 || !task.slots.includes(i + 1);
                const isGroupEnd = groupEndIndices.has(i);
                
                return (
                  <td 
                    key={i} 
                    className={`relative border-b ${showVerticalLines && isGroupEnd ? `border-r ${gridClass}` : ''} cursor-pointer group/cell p-0 h-10 md:h-14 transition-colors duration-75 select-none`}
                    onMouseDown={(e) => {
                      // Only left click
                      if (e.button === 0) {
                        handleSlotMouseDown(task.id, i, isActive);
                      }
                    }}
                    onMouseEnter={() => handleSlotMouseEnter(task.id, i)}
                  >
                    {/* Hover indicator dot */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-0">
                       <div className={`w-1.5 h-1.5 rounded-full bg-slate-400/30`} />
                    </div>

                    {/* Active Bar */}
                    {isActive && (
                      <div 
                        className={`absolute inset-y-2 md:inset-y-3 left-0 right-0 z-10 transition-all duration-300 ease-out flex items-center justify-center overflow-hidden pointer-events-none border border-slate-200`}
                        style={{ 
                          backgroundColor: task.color,
                          marginLeft: isFirst ? '4px' : '-2px', // Overlap borders
                          marginRight: isLast ? '4px' : '-2px',
                          borderRadius: `${isFirst ? '8px' : '0'} ${isLast ? '8px' : '0'} ${isLast ? '8px' : '0'} ${isFirst ? '8px' : '0'}`,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                         {/* Cartoon Highlight Line */}
                         <div className="absolute top-1 left-2 right-2 h-[2px] bg-white/30 rounded-full pointer-events-none" />
                      </div>
                    )}
                    
                    {/* Grid line helper on hover row */}
                    {!isActive && <div className="absolute inset-0 border-l border-transparent group-hover/cell:border-slate-100/50 pointer-events-none" />}
                  </td>
                );
              })}
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={columnCount + 1} className={`py-20 text-center text-sm opacity-60 ${textClass} font-bold`}>
                <div className="flex flex-col items-center justify-center gap-3">
                  <span className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-2 transform -rotate-6 hover:rotate-6 transition-transform">
                     <span className="text-4xl text-slate-300 font-black">+</span>
                  </span>
                  เริ่มสร้างไทม์ไลน์ของคุณโดยการเพิ่มรายการงาน
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TimelineChart;
