import { PhoneCall } from 'lucide-react'
import React from 'react'

const TuVan = ({name, phoneNumber}) => {
  return (
    <div className='flex justify-center items-center gap-2 font-bold'>
        <PhoneCall className='text-orange-default'/>
        <div>
            <p className='text-black'>{name}</p>
            <p className='text-orange-default'>{phoneNumber}</p>
        </div>
    </div>
  )
}

export default TuVan