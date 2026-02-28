'use client';

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface KanbanColumn {
  id: string;
  title: string;
  count: number;
  color: string;
  items: KanbanItem[];
}

interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  tags?: string[];
  badge?: { label: string; color: string };
  meta?: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onItemClick?: (item: KanbanItem, columnId: string) => void;
  onColumnWidthChange?: (columnId: string, width: number) => void;
  minColumnWidth?: number;
  defaultColumnWidth?: number;
  internshipId?: string;
}

const DEFAULT_COLUMN_WIDTH = 320;
const MIN_COLUMN_WIDTH = 280;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onItemClick,
  onColumnWidthChange,
  minColumnWidth = MIN_COLUMN_WIDTH,
  defaultColumnWidth = DEFAULT_COLUMN_WIDTH,
  internshipId,
}) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    columns.reduce((acc, col) => ({ ...acc, [col.id]: defaultColumnWidth }), {})
  );
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(columnId);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const deltaX = e.movementX;
      const newWidth = Math.max(minColumnWidth, columnWidths[isResizing] + deltaX);

      setColumnWidths(prev => ({
        ...prev,
        [isResizing]: newWidth,
      }));

      onColumnWidthChange?.(isResizing, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, columnWidths, minColumnWidth, onColumnWidthChange]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition((e.target as HTMLDivElement).scrollLeft);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[var(--background)] to-white border-2 border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b-2 border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--primary)]">Application Pipeline</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Total: <span className="font-semibold">{columns.reduce((sum, col) => sum + col.count, 0)}</span> applications
            </p>
          </div>
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--background)]">
              <span>Drag columns to resize</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-x-auto overflow-y-hidden bg-[var(--background)] px-6 py-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-4 h-full min-w-min pb-4">
          {columns.map((column, index) => (
            <div
              key={column.id}
              className="relative flex flex-col bg-white border-2 border-[var(--border)] shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex-shrink-0"
              style={{ width: columnWidths[column.id] || defaultColumnWidth }}
            >
              {/* Column Header */}
              <div
                className={clsx(
                  'px-4 py-3 border-b-2 border-[var(--border)]',
                  column.color === 'blue' && 'bg-gradient-to-r from-blue-50 to-blue-50',
                  column.color === 'purple' && 'bg-gradient-to-r from-purple-50 to-purple-50',
                  column.color === 'yellow' && 'bg-gradient-to-r from-yellow-50 to-yellow-50',
                  column.color === 'green' && 'bg-gradient-to-r from-green-50 to-green-50',
                  column.color === 'red' && 'bg-gradient-to-r from-red-50 to-red-50',
                  column.color === 'gray' && 'bg-gradient-to-r from-gray-100 to-gray-100'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={clsx(
                        'w-3 h-3 flex-shrink-0',
                        column.color === 'blue' && 'bg-blue-500',
                        column.color === 'purple' && 'bg-purple-500',
                        column.color === 'yellow' && 'bg-yellow-500',
                        column.color === 'green' && 'bg-green-500',
                        column.color === 'red' && 'bg-red-500',
                        column.color === 'gray' && 'bg-gray-400'
                      )}
                    />
                    <h3 className="font-bold text-sm text-[var(--primary)] truncate">{column.title}</h3>
                  </div>
                  <span className="inline-flex items-center justify-center min-w-fit px-2.5 py-1 bg-[var(--background-alt)] text-[var(--primary)] text-xs font-bold">
                    {column.count}
                  </span>
                </div>
              </div>

              {/* Column Items */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2">
                {column.items.length > 0 ? (
                  column.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (internshipId) {
                          // Navigate to application detail page
                          window.location.href = `/employer/internships/${internshipId}/applications/${item.id}`;
                        } else {
                          onItemClick?.(item, column.id);
                        }
                      }}
                      className="p-3 bg-white border-2 border-[var(--border)] hover:border-[var(--accent)] hover:shadow-md cursor-pointer transition-all duration-150 group"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-[var(--primary)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                            {item.title}
                          </h4>
                          {item.subtitle && (
                          <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{item.subtitle}</p>
                          )}
                        </div>
                        {item.badge && (
                          <div
                            className={clsx(
                              'px-2 py-1 text-xs font-semibold whitespace-nowrap flex-shrink-0',
                              item.badge.color === 'blue' && 'bg-blue-100 text-blue-700',
                              item.badge.color === 'green' && 'bg-green-100 text-green-700',
                              item.badge.color === 'red' && 'bg-red-100 text-red-700',
                              item.badge.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
                              item.badge.color === 'purple' && 'bg-purple-100 text-purple-700'
                            )}
                          >
                            {item.badge.label}
                          </div>
                        )}
                      </div>

                      {/* Card Description */}
                      {item.description && (
                        <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{item.description}</p>
                      )}

                      {/* Card Footer with Tags and Meta */}
                      <div className="space-y-2">
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[var(--background)] text-[var(--primary)] border border-[var(--border)]"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {item.meta && (
                          <p className="text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-2">
                            {item.meta}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-xs font-medium">No applications</p>
                  </div>
                )}
              </div>

              {/* Column Resize Handle */}
              {index < columns.length - 1 && (
                <div
                  onMouseDown={(e) => handleMouseDown(column.id, e)}
                  className="absolute right-0 top-0 bottom-0 w-1 hover:w-1 hover:bg-blue-400 cursor-col-resize transition-all duration-150"
                  style={{ 
                    position: 'absolute', 
                    right: '-2px', 
                    width: '4px',
                    background: 'transparent',
                  }}
                  title="Drag to resize column"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
