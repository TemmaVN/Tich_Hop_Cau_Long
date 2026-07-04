import React from 'react';
import Filter from './Filter';

const FilterDrawer = ({ isOpen, setIsOpen, rangePrice, setRangePrice }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 z-121 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Thân Drawer trượt từ phải sang */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-100 bg-white dark:bg-slate-900 z-122 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Nút X để đóng */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center border border-gray-100 dark:border-slate-700 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors z-10 dark:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Nội dung bộ lọc */}
        <div className="h-full overflow-y-auto pt-12 px-2 
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700
          [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Tái sử dụng Filter component của bạn */}
          <Filter 
            rangePrice={rangePrice} 
            setRangePrice={setRangePrice} 
            className="border-none shadow-none" 
          />
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;