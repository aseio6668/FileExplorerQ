import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import { FileItem } from '@/types';

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #3c3c3c;
  border-radius: 4px;
  padding: 0;
  margin: 0 12px;
  border: 1px solid #555555;
  min-width: 200px;
  
  &:focus-within {
    border-color: #0078d4;
  }
`;

const SearchIconContainer = styled.div`
  padding: 8px 12px;
  color: #a0a0a0;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 14px;
  flex: 1;
  padding: 8px 0;
  outline: none;
  
  &::placeholder {
    color: #a0a0a0;
  }
`;

const ClearButton = styled.button`
  background: transparent;
  border: none;
  color: #a0a0a0;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #ffffff;
  }
`;

const FilterButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? '#0078d4' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#ffffff' : '#a0a0a0'};
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 0 3px 3px 0;
  
  &:hover {
    background-color: ${props => props.active ? '#0e639c' : '#555555'};
  }
`;

const FilterDropdown = styled.div<{ visible?: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: #3c3c3c;
  border: 1px solid #555555;
  border-radius: 4px;
  margin-top: 4px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const FilterSection = styled.div`
  padding: 12px;
  border-bottom: 1px solid #555555;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FilterTitle = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
`;

const FilterOption = styled.label`
  display: flex;
  align-items: center;
  padding: 4px 0;
  cursor: pointer;
  font-size: 13px;
  color: #ffffff;
  
  &:hover {
    color: #0078d4;
  }
`;

const FilterCheckbox = styled.input`
  margin-right: 8px;
  accent-color: #0078d4;
`;

const SearchResultsInfo = styled.div`
  padding: 8px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #404040;
  font-size: 12px;
  color: #a0a0a0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export interface SearchFilters {
  fileTypes: string[];
  showHidden: boolean;
  sizeRange: {
    min: number;
    max: number;
  };
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

interface SearchBarProps {
  items: FileItem[];
  onSearchResults: (filteredItems: FileItem[]) => void;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  items,
  onSearchResults,
  onSearchChange,
  placeholder = 'Search files and folders...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    fileTypes: [],
    showHidden: false,
    sizeRange: { min: 0, max: Infinity },
    dateRange: { from: null, to: null },
  });

  // Get available file types
  const availableFileTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach(item => {
      if (!item.isDirectory && item.extension) {
        types.add(item.extension.toLowerCase());
      }
    });
    return Array.from(types).sort();
  }, [items]);

  // Filter items based on search query and filters
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    // Apply file type filters
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(item => {
        if (item.isDirectory) return true;
        return item.extension && filters.fileTypes.includes(item.extension.toLowerCase());
      });
    }

    // Apply hidden files filter
    if (!filters.showHidden) {
      filtered = filtered.filter(item => !item.name.startsWith('.'));
    }

    // Apply size range filter
    filtered = filtered.filter(item => {
      if (item.isDirectory) return true;
      return item.size >= filters.sizeRange.min && item.size <= filters.sizeRange.max;
    });

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = item.lastModified;
        if (filters.dateRange.from && itemDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && itemDate > filters.dateRange.to) return false;
        return true;
      });
    }

    return filtered;
  }, [items, searchQuery, filters]);

  // Update search results
  useEffect(() => {
    onSearchResults(filteredItems);
  }, [filteredItems, onSearchResults]);

  // Update search change callback
  useEffect(() => {
    onSearchChange(searchQuery);
  }, [searchQuery, onSearchChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleFileTypeToggle = useCallback((fileType: string) => {
    setFilters(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(fileType)
        ? prev.fileTypes.filter(type => type !== fileType)
        : [...prev.fileTypes, fileType],
    }));
  }, []);

  const handleShowHiddenToggle = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      showHidden: !prev.showHidden,
    }));
  }, []);

  const isFilterActive = useMemo(() => {
    return (
      filters.fileTypes.length > 0 ||
      filters.showHidden ||
      filters.sizeRange.min > 0 ||
      filters.sizeRange.max < Infinity ||
      !!filters.dateRange.from ||
      !!filters.dateRange.to
    );
  }, [filters]);

  const hasSearchOrFilter = searchQuery.trim() || isFilterActive;

  return (
    <>
      {hasSearchOrFilter && (
        <SearchResultsInfo>
          <span>
            {filteredItems.length} of {items.length} items
            {searchQuery.trim() && ` matching "${searchQuery}"`}
          </span>
          {isFilterActive && (
            <span>Filters applied</span>
          )}
        </SearchResultsInfo>
      )}
      
      <SearchContainer style={{ position: 'relative' }}>
        <SearchIconContainer>
          <FaSearch size={14} />
        </SearchIconContainer>
        
        <SearchInput
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
        />
        
        {searchQuery && (
          <ClearButton onClick={handleClearSearch} title="Clear search">
            <FaTimes size={12} />
          </ClearButton>
        )}
        
        <FilterButton
          active={isFilterActive}
          onClick={() => setShowFilters(!showFilters)}
          title="Show filters"
        >
          <FaFilter size={12} />
        </FilterButton>
        
        <FilterDropdown visible={showFilters}>
          <FilterSection>
            <FilterTitle>File Types</FilterTitle>
            {availableFileTypes.map(fileType => (
              <FilterOption key={fileType}>
                <FilterCheckbox
                  type="checkbox"
                  checked={filters.fileTypes.includes(fileType)}
                  onChange={() => handleFileTypeToggle(fileType)}
                />
                {fileType} files
              </FilterOption>
            ))}
          </FilterSection>
          
          <FilterSection>
            <FilterTitle>Options</FilterTitle>
            <FilterOption>
              <FilterCheckbox
                type="checkbox"
                checked={filters.showHidden}
                onChange={handleShowHiddenToggle}
              />
              Show hidden files
            </FilterOption>
          </FilterSection>
        </FilterDropdown>
      </SearchContainer>
    </>
  );
};