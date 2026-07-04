import React from 'react'
import { Link } from 'react-router-dom'
import ContractInfo from '../components/ContractInfo'
import { Mail, MapPin, PhoneCall } from 'lucide-react'
import MyInput from '../components/MyInput'
import FlashButton from '../components/FlashButton'
import { useMediaQuery } from '../mystate/useMediaQuery'

const Contract = () => {
  const isMiddle = useMediaQuery('(min-width: 830px)');
  const isNear = useMediaQuery('(min-width: 1200px)');
  const isSmall = useMediaQuery('(min-width: 580px) and (max-width: 830px)');
  return (
    <div>
        <div className='bg-cover bg-center w-full h-auto flex flex-col gap-4 items-center justify-center relative group'>
            <img className='w-full shrink-0 object-cover' src="https://static.fbshop.vn/wp-content/uploads/2023/08/banner-page-img-1.jpg" alt="" />
            <div className='absolute z-10 flex flex-col justify-center'>
              <h1 className={`font-bold text-white text-5xl ${isMiddle ? 'pt-60' : 'pt-20'}`}>LIÊN HỆ</h1>
              <div className='flex justify-center'>
                  <Link to="/" className='text-white'>Trang chủ</Link>
                  <span className='text-white'> / </span>
                  <Link to="/contract" className='text-orange-default'>Liên hệ</Link>
              </div>
            </div>
        </div>
        <div className='w-full '>
            <div className={`flex max-w-300 grow h-auto mx-auto my-10 shadow-2xl rounded-2xl ${isMiddle? 'flex-row': 'flex-col'}`}>
              <div className={`${isNear? 'pl-10':''} gap-6 flex justify-center ${isMiddle? 'w-1/2' : 'w-full'} ${isSmall ? 'flex-row' : 'flex-col'} bg-orange-500 rounded-l-2xl h-auto`}>
                <div className=' flex flex-col gap-6'>
                  <ContractInfo
                icon={<PhoneCall/>}
                title="Tư vấn và CSKH"
                content="0979.170.274"
                />
                <ContractInfo
                icon={<PhoneCall/>}
                title="Hàn vợt carbon"
                content="0866.346.993"
                />
                </div>
                <div className='flex flex-col gap-6'>
                  <ContractInfo
                  icon={<Mail/>}
                  title="Email liên hệ"
                  content="temma@gmail.com"
                  /><ContractInfo
                  icon={<MapPin/>}
                  title="Xem hệ thống cửa hàng"
                  content="Tại Hà Nội và Tp. Hồ Chí Minh"
                  />
                </div>
              </div>
              <div className='flex flex-col p-6 text-black gap-8 w-full'>
                <h2 className='font-bold text-3xl'>Gửi tin nhắn cho Shop</h2>
                <div className='flex grow w-full gap-4 md:gap-6'>
                  <div className='flex grow gap-2 flex-col'>
                    <label htmlFor="">Họ và tên *</label>
                    <MyInput type='text' placeHolder='Nhập họ và tên của bạn' size='150'></MyInput>
                  </div>
                  <div className='flex grow gap-2 flex-col'>
                    <label htmlFor="">Email *</label>
                    <MyInput type='text' placeHolder='Họ và tên' size='150'></MyInput>
                  </div>
                </div>
                <div className='flex grow flex-col gap-2'>
                  <label htmlFor="">Số điện thoại *</label>
                  <MyInput type='text' placeHolder='Nhập số điện thoại của bạn' size='300' className='h-40'></MyInput>
                </div>
                <div className='flex flex-col grow gap-2'>
                  <label htmlFor="">Nội dung tin nhắn *</label>
                  <textarea 
                  type="text" 
                  placeholder='Nội dung'
                  className='w-full rounded-2xl h-50 p-4 border border-gray-200'
                  />
                </div>
                <div className='flex justify-center'>
                  <FlashButton itemName="Gửi tin nhắn"></FlashButton>
                </div>
              </div>
            </div>
        </div>
    </div>

  )
}

// bg-[url()] 

export default Contract