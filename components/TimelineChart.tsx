
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
        return yearOffset > 0 ? `${monthLabel} (${yearOffset + 1})` : monthLabel;
      }
      default: return `${index + 1}`;
    }
  };

  const textClass = theme.text;
  const gridClass = theme.grid;

  return (
    <div className={`relative inline-block border rounded-xl overflow-hidden ${gridClass} bg-white min-w-full`}>
      <table className="border-collapse min-w-full bg-white">
        <thead>
          <tr className="bg-slate-50/10">
            <th className={`sticky left-0 z-20 p-3 md:p-4 text-left font-bold text-[10px] md:text-xs border-b border-r ${gridClass} min-w-[120px] md:min-w-[200px] bg-white ${textClass} whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.02)]`}>
              รายการงาน
            </th>
            {Array.from({ length: columnCount }).map((_, i) => (
              <th 
                key={i} 
                className={`p-3 md:p-4 text-center font-bold text-[9px] md:text-[10px] border-b ${showVerticalLines ? 'border-r last:border-r-0' : ''} ${gridClass} min-w-[50px] md:min-w-[70px] ${textClass} opacity-70 whitespace-nowrap bg-white/50`}
              >
                {getHeaderLabel(i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="group hover:bg-slate-50 transition-colors">
              <td className={`sticky left-0 z-10 p-3 md:p-4 text-xs md:text-sm font-medium border-r ${gridClass} bg-white transition-colors ${textClass} whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.02)]`}>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-2.5 h-2.5 md:w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: task.color }} />
                  <span className="truncate max-w-[80px] md:max-w-[160px]">{task.label}</span>
                </div>
              </td>
              {Array.from({ length: columnCount }).map((_, i) => {
                const isActive = task.slots.includes(i);
                const isFirst = i === 0 || !task.slots.includes(i - 1);
                const isLast = i === columnCount - 1 || !task.slots.includes(i + 1);
                
                return (
                  <td 
                    key={i} 
                    className={`relative border-b ${showVerticalLines ? 'border-r last:border-r-0' : ''} ${gridClass} cursor-pointer hover:bg-slate-100 group/cell p-0 h-10 md:h-14 bg-white`}
                    onClick={() => onToggleSlot(task.id, i)}
                  >
                    {/* Tick visualization on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                       <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${textClass} opacity-20`} />
                    </div>

                    {/* Bar visualization */}
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
              <td colSpan={columnCount + 1} className={`p-12 md:p-16 text-center italic text-xs md:text-sm opacity-40 ${textClass} bg-white`}>
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
