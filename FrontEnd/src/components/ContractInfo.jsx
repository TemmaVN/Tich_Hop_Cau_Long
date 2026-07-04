import React from 'react'

const ContractInfo = ({icon, title, content}) => {
  return (
    <div className='bg-orange-500 flex items-center gap-4 text-white px-4 py-2 max-w-100 grow'>
        <div className='w-10 h-10 flex justify-center items-center'>{icon}</div>
        <div className='border-l-2 border-white pl-4'>
            <h2 className='font-bold'>{title}</h2>
            <p>{content}</p>
        </div>
    </div>
  )
}

export default ContractInfo