import React from 'react';

const ConnectionLine = ({ start, end, isTemp = false }) => {
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    >
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={isTemp ? "#60A5FA" : "#3B82F6"}
        strokeWidth={isTemp ? "1.5" : "2"}
        strokeDasharray={isTemp ? "5,5" : "none"}
      />
      {!isTemp && (
        <>
          <circle cx={start.x} cy={start.y} r="3" fill="#3B82F6" />
          <circle cx={end.x} cy={end.y} r="3" fill="#3B82F6" />
        </>
      )}
    </svg>
  );
};

export default ConnectionLine;