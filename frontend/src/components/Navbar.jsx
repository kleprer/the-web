import React from 'react';
import { UserOutlined } from '@ant-design/icons';

const Navbar = () => {
  const isLoggedIn = true; // заглушка

  return (
    <nav className="bg-[#151516] p-4 relative z-50 border-b border-gray-700"> {/* Добавил border */}
      <div className="bg-[#151516] max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {isLoggedIn && (
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <UserOutlined className="text-black text-lg text-[24px]" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="font-comorant-sc font-semibold text-2xl text-white leading-none">
              ПАУТИНА
            </p>
            <p className="font-inter font-light text-sm text-white leading-none mt-1">
              ассистент журналиста
            </p>
          </div>
          <img 
            src="/logo.svg" 
            alt="Логотип" 
            className="h-10 w-10" 
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;