import React, { useState, useRef, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

export interface FilterItem {
  id: string;
  type: 'toggle' | 'dropdown' | 'multi-select';
  label: string;
  value: any;
  options?: Array<{value: string, label: string}>;
  disabled?: boolean;
  description?: string;
}

export interface FilterBarProps {
  title?: string;
  filters: FilterItem[];
  onFilterChange: (filterId: string, value: any) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  title = "Filters",
  filters,
  onFilterChange,
  isExpanded = false,
  onToggleExpanded,
  className
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(isMobile ? false : isExpanded);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with external expanded state
  useEffect(() => {
    setIsOpen(isExpanded);
  }, [isExpanded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggleExpanded?.();
  };

  const handleFilterChange = (filterId: string, value: any) => {
    onFilterChange(filterId, value);
  };

  const renderFilter = (filter: FilterItem) => {
    switch (filter.type) {
      case 'toggle':
        return (
          <div key={filter.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors">
            <Switch 
              id={filter.id} 
              checked={filter.value} 
              onCheckedChange={(checked) => handleFilterChange(filter.id, checked)}
              disabled={filter.disabled}
            />
            <label 
              htmlFor={filter.id} 
              className={cn(
                "text-sm text-gray-700 select-none cursor-pointer flex-1",
                filter.disabled && "text-gray-400"
              )}
            >
              {filter.label}
            </label>
          </div>
        );

      case 'dropdown':
        return (
          <div key={filter.id} className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(dropdownOpen === filter.id ? null : filter.id)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 touch-manipulation"
              disabled={filter.disabled}
            >
              <span className="truncate">
                {filter.options?.find(opt => opt.value === filter.value)?.label || filter.label}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {dropdownOpen === filter.id && filter.options && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filter.options.map(option => (
                  <div 
                    key={option.value}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer touch-manipulation"
                    onClick={() => {
                      handleFilterChange(filter.id, option.value);
                      setDropdownOpen(null);
                    }}
                  >
                    <span>{option.label}</span>
                    {filter.value === option.value && <span className="text-blue-600">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'multi-select':
        return (
          <div key={filter.id} className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(dropdownOpen === filter.id ? null : filter.id)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 touch-manipulation"
              disabled={filter.disabled}
            >
              <span className="truncate">
                {filter.value?.has('all') ? 'All Events' : 
                 filter.value?.size === 1 ? 
                   filter.options?.find(opt => opt.value === Array.from(filter.value)[0])?.label :
                   `${filter.value?.size || 0} selected`}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {dropdownOpen === filter.id && filter.options && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <div 
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer touch-manipulation"
                  onClick={() => {
                    const newValue = new Set(['all']);
                    handleFilterChange(filter.id, newValue);
                    setDropdownOpen(null);
                  }}
                >
                  <span>All Events</span>
                  {filter.value?.has('all') && <span className="text-blue-600">✓</span>}
                </div>
                {filter.options.map(option => (
                  <div 
                    key={option.value}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer touch-manipulation"
                    onClick={() => {
                      const newValue = new Set(filter.value);
                      if (newValue.has(option.value)) {
                        newValue.delete(option.value);
                        if (newValue.size === 0) newValue.add('all');
                      } else {
                        newValue.delete('all');
                        newValue.add(option.value);
                      }
                      handleFilterChange(filter.id, newValue);
                    }}
                  >
                    <span>{option.label}</span>
                    {filter.value?.has(option.value) && <span className="text-blue-600">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("bg-gray-50 border border-gray-200 rounded-lg p-3", className)}>
      {/* Header - Always visible */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <button
          onClick={handleToggle}
          className="p-2 hover:bg-gray-200 rounded transition-colors touch-manipulation"
          aria-label={isOpen ? "Collapse filters" : "Expand filters"}
        >
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Filter Content - Expandable */}
      {isOpen && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          {filters.map(renderFilter)}
        </div>
      )}
    </div>
  );
};

export default FilterBar; 