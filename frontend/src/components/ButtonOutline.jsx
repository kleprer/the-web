// components/ButtonOutline.jsx
import React from 'react';

const ButtonOutline = ({ 
  children,
  onClick,
  className = "",
  type = "button",
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        min-w-[10em]
        border-[1px]
        border-[#FF1717] 
        rounded-[20px] 
        bg-[#151516]
        border-opacity-100
        text-white 
        px-3 
        py-2
        text-[20px]
        focus:outline-none 
        focus:ring-2 
        focus:ring-[#FF1717] 
        focus:ring-opacity-50
        hover:bg-[#FF1717]
        hover:bg-opacity-10
        transition-colors
        duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonOutline;