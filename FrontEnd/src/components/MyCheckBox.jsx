import React from 'react'

const MyCheckBox = ({ data, id,isChecked, onCheck , className }) => {
  return (
    <div 
    className='flex items-center mb-3 cursor-pointer group'
    onClick={onCheck}
    >
        <div className="relative flex items-center justify-center mr-3">
            <input
                readOnly
                checked={isChecked}
                id={id}
                type="checkbox"
                className={`peer appearance-none w-5 h-5 border border-gray-300 rounded-sm ${isChecked? 'bg-orange-default':'bg-white'} transition-all duration-200 cursor-pointer`}
            />
            <svg
                className={`absolute w-3 h-3 text-white ${isChecked? 'opacity-100':'opacity-0'} pointer-events-none`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
        <label htmlFor={id} className={`text-sm text-[#333] cursor-pointer pointer-events-none select-none ${className}`}>
            {data}
        </label>
    </div>
  )
}

export default MyCheckBox