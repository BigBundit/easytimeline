
import React from 'react';
import { Task, TimelineScale, TimelineTheme } from '../types';

interface TimelineChartProps {
  tasks: Task[];
  scale: TimelineScale;
  theme: TimelineTheme;
  columnCount: number;
  showVerticalLines: boolean;
  onToggleSlot: (taskId: string, slotIndex: number) => void;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ 
  tasks, 
  scale, 
  theme, 
  columnCount, 
  showVerticalLines, 
  onToggleSlot 
}) => {

  const getHeaderLabel = (index: number) => {
    switch (scale) {
      case TimelineScale.DAILY: return `วันที่ ${index + 1}`;
      case TimelineScale.WEEKLY: return `W${index + 1}`;
      case TimelineScale.MONTHLY: {
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const yearOffset = Math.floor(index / 12);
        const monthLabel = months[index % 12];
        return yearOffset > 0 ? `${monthLabel} (ปี ${yearOffset + 1})` : monthLabel;
      }
      default: return `${index + 1}`;
    }
  };

  const textClass = theme.text;
  const gridClass = theme.grid;

  return (
    <div className={`relative inline-block border rounded-xl overflow-hidden ${gridClass} bg-transparent`}>
      <table className="border-collapse">
        <thead>
          <tr className="bg-slate-50/5 backdrop-blur-sm">
            <th className={`sticky left-0 z-10 p-4 text-left font-bold text-xs border-b border-r ${gridClass} min-w-[200px] bg-inherit ${textClass} whitespace-nowrap`}>
              รายการงาน
            </th>
            {Array.from({ length: columnCount }).map((_, i) => (
              <th 
                key={i} 
                className={`p-4 text-center font-bold text-[10px] border-b ${showVerticalLines ? 'border-r last:border-r-0' : ''} ${gridClass} min-w-[70px] ${textClass} opacity-70 whitespace-nowrap`}
              >
                {getHeaderLabel(i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="group hover:bg-slate-500/5 transition-colors">
              <td className={`sticky left-0 z-10 p-4 text-sm font-medium border-r ${gridClass} bg-inherit transition-colors ${textClass} whitespace-nowrap`}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: task.color }} />
                  <span className="truncate max-w-[160px]">{task.label}</span>
                </div>
              </td>
              {Array.from({ length: columnCount }).map((_, i) => {
                const isActive = task.slots.includes(i);
                const isFirst = i === 0 || !task.slots.includes(i - 1);
                const isLast = i === columnCount - 1 || !task.slots.includes(i + 1);
                
                return (
                  <td 
                    key={i} 
                    className={`relative border-b ${showVerticalLines ? 'border-r last:border-r-0' : ''} ${gridClass} cursor-pointer hover:bg-slate-400/10 group/cell p-0 h-14`}
                    onClick={() => onToggleSlot(task.id, i)}
                  >
                    {/* Tick visualization on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                       <div className={`w-1.5 h-1.5 rounded-full ${textClass} opacity-20`} />
                    </div>

                    {/* Bar visualization */}
                    {isActive && (
                      <div 
                        className={`absolute inset-y-2.5 left-0 right-0 z-1 transition-all flex items-center justify-center`}
                        style={{ 
                          backgroundColor: task.color,
                          marginLeft: isFirst ? '6px' : '0',
                          marginRight: isLast ? '6px' : '0',
                          borderRadius: `${isFirst ? '8px' : '0'} ${isLast ? '8px' : '0'} ${isLast ? '8px' : '0'} ${isFirst ? '8px' : '0'}`,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        {/* Connecting visual overlay */}
                        <div className="w-full h-full opacity-30 mix-blend-soft-light" />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* Empty state hint */}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={columnCount + 1} className={`p-16 text-center italic opacity-40 ${textClass}`}>
                ยังไม่มีข้อมูลรายการ กรุณากดปุ่มเพิ่มรายการ (+) ในแผงควบคุม
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TimelineChart;
