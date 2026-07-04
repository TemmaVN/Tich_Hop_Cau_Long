import React from 'react'
import { Link } from 'react-router-dom'
import TuVan from '../components/TuVan'
import { LocationEditIcon, Mail, User2 } from 'lucide-react'
import { useCategory } from '../contexts/CategoryContext'

const ACCESSORY_SLUG = 'phu-kien'

const MenuData = ({ setIsOpen }) => {
  const { categories, setPageCatagory } = useCategory()

  const close = (label) => {
    setIsOpen(false)
    if (label) setPageCatagory(label)
  }

  return (
    <div className="flex flex-col grow text-slate-900 dark:text-white gap-2.5 p-5">
      {/* Nav links */}
      <div className="flex flex-col border-b border-b-gray-900 dark:border-b-slate-600 pb-3">
        <Link
          onClick={() => close()}
          to="/"
          className="font-bold px-2 pt-5 hover:text-orange-500"
        >
          Trang chủ
        </Link>

        {categories.map((cat) => {
          const label = cat.categoryName?.toUpperCase()
          return (
            <Link
              key={cat.slug}
              to={`/${cat.slug}`}
              onClick={() => close(label)}
              className="font-bold px-2 pt-5 hover:text-orange-500"
            >
              {label}
            </Link>
          )
        })}

        <Link
          to={`/${ACCESSORY_SLUG}`}
          onClick={() => close('PHỤ KIỆN')}
          className="font-bold px-2 pt-5 hover:text-orange-500"
        >
          PHỤ KIỆN
        </Link>

        <Link
          onClick={() => close()}
          to="/sales"
          className="font-bold px-2 pt-5 hover:text-orange-500"
        >
          GIẢM GIÁ
        </Link>

        <Link
          onClick={() => close()}
          to="/contract"
          className="font-bold px-2 pt-5 hover:text-orange-500"
        >
          Liên hệ
        </Link>
      </div>

      {/* Tư vấn */}
      <div className="flex justify-between border-b border-b-gray-900 dark:border-b-slate-600 pb-3">
        <div className="flex flex-col gap-3">
          <TuVan name="Tư vấn sản phẩm" phoneNumber="0979.170.274" />
          <TuVan name="Bảo hành và CSKH" phoneNumber="0979.170.274" />
        </div>
        <div className="flex flex-col gap-3">
          <TuVan name="Hàn vợt carbon" phoneNumber="0979.170.274" />
          <TuVan name="Xem hệ thống cửa hàng" phoneNumber="0979.170.274" />
        </div>
      </div>

      {/* Thông tin */}
      <div>
        <div className="flex gap-2 py-4">
          <User2 className="text-orange-500" />
          <p className="font-bold">Người đại diện</p>
          <p>Trương Minh Thành</p>
        </div>
        <div className="flex gap-2 py-4">
          <LocationEditIcon className="text-orange-500" />
          <p className="font-bold">Địa chỉ</p>
          <p>12/70 ngõ 102 Trường Chinh, Đống Đa, Hà Nội</p>
        </div>
        <div className="flex gap-2 py-4">
          <Mail className="text-orange-500" />
          <p className="font-bold">Email</p>
          <p>caulongshop@gmail.com</p>
        </div>
      </div>
    </div>
  )
}

export default MenuData
