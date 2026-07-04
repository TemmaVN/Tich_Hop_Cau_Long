import React from 'react'

const FlashButton = ({itemName,icon,className,...others}) => {
  return (
    <button 
    className={`group relative overflow-hidden bg-orange-default hover:bg-orange-dark text-white font-bold py-3 px-4 rounded-full w-fit ${className}`}
    {...others}
    >    
      <span className="
          absolute inset-0 
          bg-black w-full h-full 
          -translate-x-[110%] -skew-x-20
          group-hover:animate-flash
      "></span>
      <span className="relative z-10 flex justify-between gap-2 ">
          {icon}
          <p>{itemName}</p>
      </span>
    </button>
  )
}

export default FlashButton