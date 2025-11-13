// components/Navbar.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';

const Navbar = () => {
  const { boardId } = useParams();
  const isLoggedIn = true; // заглушка

  return (
    <nav className="bg-transparent p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
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