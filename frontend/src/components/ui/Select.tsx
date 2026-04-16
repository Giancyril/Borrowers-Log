import React from "react";
import { FaChevronDown } from "react-icons/fa";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  className?: string;
}

/**
 * A reusable, styled custom dropdown component.
 * Uses a native select with custom styling for maximum reliability and accessibility.
 */
export const Select: React.FC<SelectProps> = ({ label, error, className = "", children, ...props }) => {
  const inputCls =
    "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/20 appearance-none transition-all pr-10 disabled:opacity-50";
  const labelCls =
    "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className={`relative ${className}`}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative group">
        <select {...props} className={inputCls}>
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-gray-300 transition-colors">
          <FaChevronDown size={10} />
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};
