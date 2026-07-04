/* eslint-disable react-refresh/only-export-components */
import { cva } from 'class-variance-authority';
import React from 'react'
import { twMerge } from 'tailwind-merge';
export const buttonStyles = cva(["transition-colors"], {
  variants: {
    variant: {
      default: ["bg-white", "text-orange-default", 'border border-gray-200 hover:border-orange-default'],
      ghost: ["bg-gray-bg", "text-gray-500"],
      find: [
        "bg-orange-default",
        "hover:bg-orange-dark"
      ],
      flash: [
        "bg-orange-default",
        "text-white",
        "font-bold",
      ],
      search: [
        "bg-gray-100",
        "rounded-full",
        "hover:bg-orange-default",
        "hover:text-white",
        "transition-colors",
        "font-bold"
      ],
      filter: [
        "flex",
        "items-center",
        "border",
        "border-gray-200",
        "font-semibold",
        "hover:bg-gray-50",
        "transition",
        "text-gray-700"
      ]
    },
    size: {
      default: [" rounded", "p-2"],
      icon: [
        "rounded-full",
        "w-12",
        "h-12",
        "flex",
        "items-center",
        "justify-center",
        "p-2.5",
      ],
      flash: [
        "rounded-full",
        "w-36",
        "h-12"
      ],
      find: [
        'h-full',
        'px-6'
      ]
      ,
      search: [
        "p-5",
        "gap-2"
      ],
      filter: [
        "px-5",
        "py-2",
        "gap-2"
      ]
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  }
})

const Button = ({variant, size, className, ...props}) => {
  return (
    <button
      {...props}
      className={twMerge(buttonStyles({variant, size}), className)}
    />
  );
}

export default Button;