/* eslint-disable react-refresh/only-export-components */
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react'
import Button from './Button';
import { cva } from 'class-variance-authority';

export const inputStyle = cva(["transition-colors"], {
  variants: {
    variant: {
     default: [
      ""
     ]
    }
  }
})

const MyInput = ({type, placeHolder, size, value, onChange ,isReadOnly=false ,className}) => {
  const [isFocus, setIsFocus] = useState(false);
  const [isHide, setIsHide] = useState(true);
  const actualType = type === 'password' ? (isHide ? 'password' : 'text') : type;
  return (
    <div className={`flex justify-between border ${isFocus? 'border-orange-default': 'border-gray-200 dark:border-slate-600'} max-w-${size} rounded-full p-3 bg-white dark:bg-slate-800`}>
        <input
        readOnly={isReadOnly}
        type={actualType}
        placeholder={placeHolder}
        value={value}
        onChange={onChange}
        className={`focus:border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent w-full h-auto ${className || ''}`}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        />
        {type=='password'? 
        <button
        className='text-orange-default hover:transition-transform hover:duration-150 hover:scale-125'
        onClick={() => setIsHide(!isHide)}
        type='button'
        >
          {
            isHide? <EyeOff></EyeOff>:<Eye></Eye>
          }
        </button>:
        <></>}
    </div>
  )
}

export default MyInput;