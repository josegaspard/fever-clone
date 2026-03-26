'use client';

import { useState, useEffect, useCallback } from 'react';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  large?: boolean;
  debounceMs?: number;
}

export default function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Buscar eventos, experiencias...',
  large = false,
  debounceMs = 400,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const debounced = useCallback(
    (() => {
      let timer: NodeJS.Timeout;
      return (val: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => onSearch(val), debounceMs);
      };
    })(),
    [onSearch, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    debounced(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <svg
          className={large ? 'w-5 h-5' : 'w-4 h-4'}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition ${
          large ? 'pl-12 pr-4 py-4 text-lg' : 'pl-10 pr-4 py-2.5 text-sm'
        }`}
      />
    </form>
  );
}
