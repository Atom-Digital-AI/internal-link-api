import { useState } from 'react';
import type { PageInfo, MatchType } from '../../types';

interface FilterOptionsProps {
  targetPages: PageInfo[];
  filterTargetUrl: string;
  filterKeyword: string;
  filterMatchType: MatchType;
  onFilterTargetUrlChange: (url: string) => void;
  onFilterKeywordChange: (keyword: string) => void;
  onFilterMatchTypeChange: (matchType: MatchType) => void;
  onClear: () => void;
}

export function FilterOptions({
  targetPages,
  filterTargetUrl,
  filterKeyword,
  filterMatchType,
  onFilterTargetUrlChange,
  onFilterKeywordChange,
  onFilterMatchTypeChange,
  onClear,
}: FilterOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = filterTargetUrl || filterKeyword;

  return (
    <div className="filter-options">
      <div
        className="filter-options__header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="filter-options__title">
          Filter Options
          {hasActiveFilters && (
            <span className="filter-options__active-badge">Active</span>
          )}
        </span>
        <span className="filter-options__toggle">
          {isExpanded ? '−' : '+'}
        </span>
      </div>

      {isExpanded && (
        <div className="filter-options__body">
          <div className="filter-options__field">
            <label className="filter-options__label">
              Target Page
            </label>
            <select
              className="filter-options__select"
              value={filterTargetUrl}
              onChange={(e) => onFilterTargetUrlChange(e.target.value)}
            >
              <option value="">All target pages</option>
              {targetPages.map((page) => (
                <option key={page.url} value={page.url}>
                  {page.url}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-options__field">
            <label className="filter-options__label">
              Keyword
            </label>
            <input
              type="text"
              className="filter-options__input"
              placeholder="e.g., SEO audit"
              value={filterKeyword}
              onChange={(e) => onFilterKeywordChange(e.target.value)}
            />
            <div className="filter-options__match-type">
              <label className="filter-options__radio-label">
                <input
                  type="radio"
                  name="detailMatchType"
                  checked={filterMatchType === 'stemmed'}
                  onChange={() => onFilterMatchTypeChange('stemmed')}
                />
                Stemmed
              </label>
              <label className="filter-options__radio-label">
                <input
                  type="radio"
                  name="detailMatchType"
                  checked={filterMatchType === 'exact'}
                  onChange={() => onFilterMatchTypeChange('exact')}
                />
                Exact
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-options__actions">
              <button
                type="button"
                className="filter-options__clear"
                onClick={onClear}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
