// components/ButtonFilled.jsx
import React from 'react';

const ButtonFilled = ({ 
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
        w-min-[10em]
        border-[1px]
        border-white 
        rounded-[20px] 
        bg-white
        border-opacity-100
        text-[#151516] 
        px-3 
        py-2
        text-[20px]
        focus:outline-none 
        focus:ring-2 
        focus:ring-white 
        focus:ring-opacity-50
        hover:bg-gray-200
        hover:border-gray-200
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

export default ButtonFilled;