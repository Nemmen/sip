interface FilterOption {
  label: string;
  value: string;
}

interface BaseFilter {
  type?: 'search' | 'text' | 'select' | 'number';
  value: string;
  onChange?: (value: string) => void;
}

interface SearchFilter extends BaseFilter {
  type: 'search';
  placeholder: string;
}

interface TextFilter extends BaseFilter {
  type: 'text';
  label: string;
  placeholder: string;
}

interface SelectFilter extends BaseFilter {
  type: 'select';
  label: string;
  options: FilterOption[];
}

interface NumberFilter extends BaseFilter {
  type: 'number';
  label: string;
  placeholder: string;
}

interface SimpleSelectFilter {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
}

type Filter = SearchFilter | TextFilter | SelectFilter | NumberFilter | SimpleSelectFilter;

interface FilterBarProps {
  filters: Filter[];
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
}

function isSimpleFilter(filter: Filter): filter is SimpleSelectFilter {
  return 'key' in filter && !('type' in filter);
}

export function FilterBar({ filters, onFilterChange, onReset }: FilterBarProps) {
  const hasActiveFilters = filters.some(f => f.value !== '');

  const handleChange = (filter: Filter, value: string) => {
    if (isSimpleFilter(filter)) {
      onFilterChange?.(filter.key, value);
    } else {
      filter.onChange?.(value);
    }
  };

  return (
    <div className="bg-white border-2 border-[var(--border)] p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] uppercase tracking-wide">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters:
        </div>

        {filters.map((filter, index) => {
          // Simple select filter (admin pages)
          if (isSimpleFilter(filter)) {
            return (
              <div key={filter.key} className="flex items-center gap-2">
                <label className="text-sm text-[var(--text-secondary)]">{filter.label}:</label>
                <select
                  value={filter.value}
                  onChange={(e) => handleChange(filter, e.target.value)}
                  className="px-3 py-1.5 border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition"
                >
                  <option value="">All</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          // Advanced filters (student pages)
          if (filter.type === 'search') {
            return (
              <div key={index} className="flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder={filter.placeholder}
                  value={filter.value}
                  onChange={(e) => handleChange(filter, e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>
            );
          }

          if (filter.type === 'text') {
            return (
              <div key={index} className="flex items-center gap-2">
                <label className="text-sm text-[var(--text-secondary)]">{filter.label}:</label>
                <input
                  type="text"
                  placeholder={filter.placeholder}
                  value={filter.value}
                  onChange={(e) => handleChange(filter, e.target.value)}
                  className="px-3 py-1.5 border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition w-40"
                />
              </div>
            );
          }

          if (filter.type === 'select') {
            return (
              <div key={index} className="flex items-center gap-2">
                <label className="text-sm text-[var(--text-secondary)]">{filter.label}:</label>
                <select
                  value={filter.value}
                  onChange={(e) => handleChange(filter, e.target.value)}
                  className="px-3 py-1.5 border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition"
                >
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (filter.type === 'number') {
            return (
              <div key={index} className="flex items-center gap-2">
                <label className="text-sm text-[var(--text-secondary)]">{filter.label}:</label>
                <input
                  type="number"
                  placeholder={filter.placeholder}
                  value={filter.value}
                  onChange={(e) => handleChange(filter, e.target.value)}
                  className="px-3 py-1.5 border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition w-32"
                />
              </div>
            );
          }

          return null;
        })}

        {hasActiveFilters && onReset && (
          <button
            onClick={onReset}
            className="ml-auto px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
