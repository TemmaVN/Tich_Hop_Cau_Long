import React from 'react'
import FlashButton from './FlashButton'
import { Link } from 'react-router-dom'

const Orders = () => {
  return (
    <div className='flex flex-col items-center gap-3'>
        <p>Hiện tại giỏ hàng của bạn đang trống</p>
        <img src="https://static.fbshop.vn/wp-content/themes/monatheme/public/helpers/images/cart-empty.png" alt="" />
        <Link to="/"><FlashButton itemName="Tiếp tục mua sắm"></FlashButton></Link>
    </div>
  )
}

export default Orders