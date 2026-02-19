import React from 'react';
import { InputFieldProps } from '../types/props';

const InputField: React.FC<InputFieldProps> = ({ 
  placeholder, 
  value, 
  onChange,
  type = "text",
  className = "",
  ...props 
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`
        min-w-[15em0]
        border-[1px]
        border-white 
        rounded-[20px] 
        bg-[#151516]
        border-opacity-100
        text-white 
        placeholder-white 
        placeholder-opacity-60
        px-3 
        py-2
        text-[20px]
        focus:outline-none 
        focus:ring-2 
        focus:ring-white 
        focus:ring-opacity-50
        ${className}
      `}
      {...props}
    />
  );
};

export default InputField;