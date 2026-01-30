
import React from 'react';
import { Task, TimelineScale, TimelineTheme, HeaderGroup } from '../types';

interface TimelineChartProps {
  tasks: Task[];
  headerGroups: HeaderGroup[];
  scale: TimelineScale;
  theme: TimelineTheme;
  columnCount: number;
  minColumnWidth: number;
  showVerticalLines: boolean;
  customTimeLabels?: Record<string, string>;
  taskListLabel: string;
  onUpdateTimeLabel?: (index: number, value: string) => void;
  onToggleSlot: (taskId: string, slotIndex: number) => void;
  onAddTask: () => void;
  onRemoveTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onUpdateTaskListLabel: (value: string) => void;
  onUpdateHeaderGroupLabel: (id: string, label: string) => void;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ 
  tasks, 
  headerGroups,
  scale, 
  theme, 
  columnCount,
  minColumnWidth,
  showVerticalLines, 
  customTimeLabels = {},
  taskListLabel,
  onUpdateTimeLabel,
  onToggleSlot,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onUpdateTaskListLabel,
  onUpdateHeaderGroupLabel
}) => {

  const getDefaultHeaderLabel = (index: number) => {
    switch (scale) {
      case TimelineScale.DAILY: return `${index + 1}`;
      case TimelineScale.WEEKLY: return `W${index + 1}`;
      case TimelineScale.MONTHLY: {
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const yearOffset = Math.floor(index / 12);
        const monthLabel = months[index % 12];
        return yearOffset > 0 ? `${monthLabel} (${yearOffset + 1})` : monthLabel;
      }
      default: return `${index + 1}`;
    }
  };

  const textClass = theme.text;
  const gridClass = theme.grid;
  const bgClass = theme.bg;
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
            className={`p-2 border-b border-r ${gridClass} text-center font-bold text-[10px] md:text-xs ${headerGroupBg} ${textClass}`}
          >
            <input
              type="text"
              value={group.label}
              onChange={(e) => onUpdateHeaderGroupLabel(group.id, e.target.value)}
              className={`bg-transparent text-center w-full h-full focus:outline-none ${inputBgClass} rounded cursor-pointer ${textClass} font-bold`}
              placeholder="ชื่อหัวข้อ..."
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
    <div className={`relative inline-block border rounded-xl overflow-hidden ${gridClass} ${bgClass} min-w-full`}>
      <table className={`border-collapse min-w-full ${bgClass}`}>
        <thead>
          <tr>
            <th className={`sticky left-0 z-20 border-b border-r ${gridClass} ${bgClass} shadow-[2px_0_5px_rgba(0,0,0,0.02)]`} />
            {getParentHeaderRow()}
          </tr>
          <tr className={headerRowBg}>
            <th className={`sticky left-0 z-20 p-3 md:p-4 text-left font-bold text-[10px] md:text-xs border-b border-r ${gridClass} min-w-[120px] md:min-w-[200px] ${bgClass} ${textClass} whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.02)]`}>
               <input
                type="text"
                value={taskListLabel}
                onChange={(e) => onUpdateTaskListLabel(e.target.value)}
                className={`bg-transparent w-full h-full focus:outline-none ${inputBgClass} rounded cursor-pointer font-bold ${textClass}`}
              />
            </th>
            {Array.from({ length: columnCount }).map((_, i) => {
              const isGroupEnd = groupEndIndices.has(i);
              const labelKey = `${scale}-${i}`;
              const displayLabel = customTimeLabels[labelKey] ?? getDefaultHeaderLabel(i);

              return (
                <th 
                  key={i} 
                  style={{ minWidth: `${minColumnWidth}px` }}
                  className={`p-1 md:p-1 text-center font-bold text-[9px] md:text-[10px] border-b ${showVerticalLines && isGroupEnd ? `border-r ${gridClass}` : ''} ${gridClass} ${textClass} opacity-70 whitespace-nowrap bg-transparent align-middle`}
                >
                  <input
                    type="text"
                    value={displayLabel}
                    onChange={(e) => onUpdateTimeLabel && onUpdateTimeLabel(i, e.target.value)}
                    className={`bg-transparent text-center w-full h-full p-2 focus:outline-none ${inputBgClass} focus:ring-2 focus:ring-blue-100 rounded-md transition-all cursor-pointer hover:bg-black/5 ${textClass}`}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className={`group ${hoverClass} transition-colors`}>
              <td className={`sticky left-0 z-10 p-3 md:p-4 text-xs md:text-sm font-medium border-r ${gridClass} ${bgClass} transition-colors ${textClass} whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.02)]`}>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-2.5 h-2.5 md:w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: task.color }} />
                  <input
                    type="text"
                    value={task.label}
                    onChange={(e) => onUpdateTask(task.id, { label: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onAddTask();
                      } else if (e.key === 'Backspace' && task.label === '') {
                        onRemoveTask(task.id);
                      }
                    }}
                    className={`bg-transparent border-none w-full p-1 -ml-1 rounded focus:ring-2 focus:ring-blue-100 ${inputBgClass} hover:bg-black/5 transition-colors text-xs md:text-sm font-medium ${textClass} placeholder:text-slate-400 focus:outline-none`}
                    placeholder="ชื่อรายการ..."
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
                    className={`relative border-b ${showVerticalLines && isGroupEnd ? `border-r ${gridClass}` : ''} cursor-pointer ${hoverClass} group/cell p-0 h-10 md:h-14 ${bgClass}`}
                    onClick={() => onToggleSlot(task.id, i)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                       <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${textClass} opacity-20`} />
                    </div>

                    {isActive && (
                      <div 
                        className={`absolute inset-y-2 md:inset-y-2.5 left-0 right-0 z-1 transition-all flex items-center justify-center`}
                        style={{ 
                          backgroundColor: task.color,
                          marginLeft: isFirst ? '4px' : '0',
                          marginRight: isLast ? '4px' : '0',
                          borderRadius: `${isFirst ? '6px' : '0'} ${isLast ? '6px' : '0'} ${isLast ? '6px' : '0'} ${isFirst ? '6px' : '0'}`,
                          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div className="w-full h-full opacity-30 mix-blend-soft-light" />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={columnCount + 1} className={`p-12 md:p-16 text-center italic text-xs md:text-sm opacity-40 ${textClass} ${bgClass}`}>
                ยังไม่มีรายการงาน กรุณากดปุ่ม (+) ในเมนูเพื่อเพิ่ม
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TimelineChart;
