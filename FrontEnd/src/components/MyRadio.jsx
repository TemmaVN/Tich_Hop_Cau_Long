import React from 'react'

const MyRadio = ({name}) => {
  return (
    <label className='w-auto flex items-center cursor-pointer group'>
        <div className='relative flex items-center justify-center'>
            <input 
            type="radio"
            name="price-filter"
            className='peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full bg-white checked:bg-red-500 transition-all duration-200'
            />
            <div className='absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none'></div>
        </div>
        <span className='ml-3 text-sm font-medium text-gray-700 group-hover:text-black'>{name}</span>
    </label>
  )
}

export default MyRadio