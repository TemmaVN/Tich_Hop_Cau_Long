import React from 'react'
import MenuData from '../components/MenuData'

const MenuHeader = ({isOpen, setIsOpen}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 z-99 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />
      <div className={`fixed left-0 h-full w-full max-w-150 bg-white dark:bg-slate-900 z-100 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto pt-12 px-2 
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200
          dark:[&::-webkit-scrollbar-thumb]:bg-slate-700
          [&::-webkit-scrollbar-thumb]:rounded-full">
          <MenuData isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
      </div>
    </>
    
  )
}

export default MenuHeader