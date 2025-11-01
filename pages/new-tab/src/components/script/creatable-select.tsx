import { useState, useRef, useEffect } from 'react';
import type React from 'react';

interface Option {
  label: string;
  value: string;
}

interface CreatableSelectProps {
  options: Option[];
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Thêm thể loại...',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRemoveValue = (itemToRemove: string) => {
    if (disabled) return;
    onChange(value.filter(item => item !== itemToRemove));
  };

  const handleAddValue = (itemToAdd: string | Option) => {
    const trimmedItem = typeof itemToAdd === 'string' ? itemToAdd.trim() : itemToAdd.value.trim();
    if (trimmedItem && !value.some(v => v.toLowerCase() === trimmedItem.toLowerCase())) {
      onChange([...value, trimmedItem]);
    }
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        const matchingOption = filteredOptions.find(opt => opt.label.toLowerCase() === inputValue.trim().toLowerCase());
        handleAddValue(matchingOption ?? inputValue);
      }
    }
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      handleRemoveValue(value[value.length - 1]);
    }
  };

  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.some(v => v.toLowerCase() === option.value.toLowerCase()),
  );

  const showCreateOption =
    inputValue.trim() &&
    !options.some(opt => opt.label.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !value.some(v => v.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 shadow-sm transition dark:bg-slate-800 ${isOpen ? 'border-primary ring-primary/20 ring-2' : 'border-slate-300 dark:border-slate-600'} ${disabled ? 'bg-slate-100 opacity-70 dark:bg-slate-700' : ''}`}
        onClick={() => !disabled && inputRef.current?.focus()}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={e => {
          if (disabled) return;
          // Chỉ focus vào input nếu người dùng nhấn Enter/Space trên chính wrapper,
          // không phải trên input con (để tránh chặn phím space khi đang gõ).
          if (e.target !== inputRef.current && (e.key === 'Enter' || e.key === ' ')) {
            inputRef.current?.focus();
          }
        }}>
        {value.map(item => (
          <span
            key={item}
            className="inline-flex items-center gap-x-1.5 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium capitalize text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
            {item}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleRemoveValue(item);
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-indigo-600 transition-colors hover:bg-indigo-200 dark:text-indigo-400 dark:hover:bg-indigo-800"
              disabled={disabled}>
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-grow bg-transparent p-1 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          disabled={disabled}
        />
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <ul className="py-1">
            {filteredOptions.map(option => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleAddValue(option.value)}
                  className="w-full cursor-pointer px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                  {option.label}
                </button>
              </li>
            ))}
            {showCreateOption && (
              <li>
                <button
                  type="button"
                  onClick={() => handleAddValue(inputValue)}
                  className="w-full cursor-pointer px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                  Tạo mới "{inputValue.trim()}"
                </button>
              </li>
            )}
            {filteredOptions.length === 0 && !showCreateOption && (
              <li className="px-3 py-2 text-sm text-slate-500">Không tìm thấy kết quả</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreatableSelect;
