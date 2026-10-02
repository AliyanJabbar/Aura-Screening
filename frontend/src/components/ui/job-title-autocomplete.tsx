"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { JobTitleOption, filterJobTitles } from "@/lib/job-titles";

interface JobTitleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectOption?: (option: JobTitleOption) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function JobTitleAutocomplete({
  value,
  onChange,
  onSelectOption,
  placeholder = "e.g. Full Stack Engineer, AI Engineer, Marketing...",
  className = "",
  required = false,
  disabled = false,
}: JobTitleAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Only show matching options when user has typed something
  const filteredOptions = filterJobTitles(value, 8);
  const showDropdown = isOpen && value.trim().length > 0 && filteredOptions.length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (option: JobTitleOption) => {
    onChange(option.title);
    if (onSelectOption) {
      onSelectOption(option);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          e.preventDefault();
          handleSelect(filteredOptions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            if (value.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className={`w-full px-3.5 py-2 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/30 text-xs text-[#141413] focus:outline-none focus:border-[#cc785c] transition-colors ${
            value ? "pr-8" : ""
          } ${className}`}
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 p-1 rounded-md text-[#a09d96] hover:text-[#141413] hover:bg-[#efe9de] transition-colors"
            title="Clear"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Clean, Simple Dropdown of Matching Options */}
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-[#e6dfd8] rounded-xl shadow-lg max-h-56 overflow-y-auto py-1 divide-y divide-[#e6dfd8]/50"
        >
          {filteredOptions.map((opt, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={opt.title}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(opt)}
                className={`px-3.5 py-2 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                  isSelected
                    ? "bg-[#efe9de] text-[#141413] font-medium"
                    : "text-[#3d3d3a] hover:bg-[#efe9de]/60"
                }`}
              >
                <span>{opt.title}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
