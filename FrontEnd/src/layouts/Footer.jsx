import React from "react";
import { Link } from "react-router-dom";
import Logo from '../Logo/Logo.jpg'
import {
  MapPin,
  User,
  Mail,
  PhoneCall,
  Headset,
  Store,
  CreditCard,
  Truck,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#fffaf4] dark:bg-slate-950 text-gray-700 dark:text-slate-300 pt-8 pb-6 border-t border-orange-100 dark:border-slate-700">
      <div className="max-w-300 mx-auto px-4 flex flex-col lg:flex-row gap-8">
        {/* ================= PHẦN TRÁI: THÔNG TIN CÔNG TY ================= */}
        <div className="w-full lg:w-[28%] flex flex-col items-center text-center gap-3">
          <Link to="/">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-full border-2 border-orange-100 dark:border-slate-700 shadow-sm mb-2 hover:shadow-md transition-shadow">
              <img
                src={Logo}
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </Link>
          <h3 className="font-bold text-gray-800 dark:text-white uppercase text-[15px]">
            Công ty TNHH Minh Nguyên Sport
          </h3>

          <ul className="flex flex-col gap-2 text-[14px] text-gray-600 dark:text-slate-400 w-full mt-2">
            <li className="flex items-start gap-2 justify-center text-left">
              <MapPin size={16} className="text-orange-500 shrink-0 mt-1" />
              <span>Địa chỉ: 12/70 ngõ 102 Trường Chinh, Đống Đa, Hà Nội</span>
            </li>
            <li className="flex items-center gap-2 justify-center text-left">
              <User size={16} className="text-orange-500 shrink-0" />
              <span>Người đại diện: Quản Anh Minh </span>
            </li>
            <li className="flex items-center gap-2 justify-center text-left">
              <Mail size={16} className="text-orange-500 shrink-0" />
              <span>Email: MinhNguyenshop@gmail.com</span>
            </li>
          </ul>

          <p className="text-[13px] text-gray-500 dark:text-slate-500 mt-2 px-2">
            Giấy phép kinh doanh số: 0109370129 đăng ký thay đổi lần 1 ngày
            21/10/2020 (đăng ký lần đầu ngày 09/10/2020) do sở kế hoạch và đầu
            tư Hà Nội cấp.
          </p>

          {/* Logo Bộ Công Thương */}
          <img
            src="https://static.fbshop.vn/template/assets/images/bct.png" // Thay bằng link ảnh BCT thực tế
            alt="Đã thông báo Bộ Công Thương"
            className="w-32 mt-3"
          />
        </div>

        {/* ================= PHẦN PHẢI: LIÊN HỆ & DANH MỤC ================= */}
        <div className="w-full lg:w-[72%] flex flex-col gap-6">
          {/* Hàng 1: Hotline & Hệ thống */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-orange-100 dark:border-slate-700 pb-6">
            <div className="flex flex-col items-center text-center gap-1 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-1">
                <Headset size={20} />
              </div>
              <div className="text-[13px] font-semibold text-gray-600 dark:text-slate-400">
                Tư vấn và CSKH
              </div>
              <span className="text-orange-600 font-bold text-lg">
                0123.456.789
              </span>
            </div>

            <div className="flex flex-col items-center text-center gap-1 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-1">
                <PhoneCall size={20} />
              </div>
              <div className="text-[13px] font-semibold text-gray-600 dark:text-slate-400">
                Khách sỉ liên hệ
              </div>
              <span className="text-orange-600 font-bold text-lg">
                0987.654.321
              </span>
            </div>

            <div className="flex flex-col items-center text-center gap-1 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center text-green-600 mb-1">
                <PhoneCall size={20} />
              </div>
              <div className="text-[13px] font-semibold text-gray-600 dark:text-slate-400">
                Tư vấn nhượng quyền
              </div>
              <span className="text-orange-600 font-bold text-lg">
                0969.696.969
              </span>
            </div>

            <div className="flex flex-col items-center text-center gap-1 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-1">
                <Store size={20} />
              </div>
              <div className="text-[13px] font-semibold text-gray-600 dark:text-slate-400">
                Hệ thống cửa hàng
              </div>
              <span className="text-orange-600 font-bold text-[15px] px-2 leading-tight">
                Hà Nội & Tp.HCM
              </span>
            </div>
          </div>

          {/* Hàng 2: Link Hướng dẫn, Hỗ trợ & Fanpage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cột 2.1: Hướng dẫn khách hàng */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-gray-800 dark:text-white text-[15px]">
                Hướng dẫn khách hàng
              </h3>
              <ul className="flex flex-col gap-2.5 text-[14px]">
                <li>
                  <Link
                    to="/"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Chính sách bảo hành
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Chính sách đổi trả
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Chính sách vận chuyển
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Chính sách thanh toán
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Chính sách bảo mật
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 2.2: Hỗ trợ & Thanh toán */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-gray-800 dark:text-white text-[15px]">
                  Hỗ trợ khách hàng
                </h3>
                <ul className="flex flex-col gap-2.5 text-[14px]">
                  <li>
                    <Link
                      to="/"
                      className="hover:text-orange-500 transition-colors"
                    >
                      Hướng dẫn mua hàng
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/"
                      className="hover:text-orange-500 transition-colors"
                    >
                      Hình thức giao hàng
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <h3 className="font-bold text-gray-800 dark:text-white text-[15px]">
                  Hình thức thanh toán
                </h3>
                <div className="flex gap-3 text-[13px] font-medium">
                  <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm w-24 hover:border-orange-200 dark:hover:border-orange-500/50 transition-colors">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                      <CreditCard size={20} />
                    </div>
                    <span className="text-center">Chuyển khoản</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm w-24 hover:border-orange-200 dark:hover:border-orange-500/50 transition-colors">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                      <Truck size={20} />
                    </div>
                    <span className="text-center">Ship COD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 2.3: Fanpage */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-gray-800 dark:text-white text-[15px]">Fanpage</h3>

              {/* Giả lập Plugin Fanpage */}
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm w-full hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <img
                    src="/Logo.jpeg"
                    alt="Logo"
                    className="w-12 h-12 rounded-full border border-gray-100 dark:border-slate-700 object-cover"
                  />
                  <div className="flex flex-col">
                    <a
                      href="#"
                      className="font-bold text-gray-800 dark:text-white hover:text-orange-500 transition-colors text-[15px]"
                    >
                      Fbshop
                    </a>
                    <span className="text-[12px] text-gray-500 dark:text-slate-500">
                      59.886 người theo dõi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[13px] font-medium">
                  <button className="flex-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-600 hover:text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                    <Facebook size={16} /> Theo dõi
                  </button>
                  <button className="flex-1 bg-gray-50 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                    Chia sẻ
                  </button>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-3 mt-3">
                <a
                  href="#"
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-blue-600 p-2.5 rounded-full hover:bg-blue-600 hover:text-white shadow-sm transition-all duration-300"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="#"
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-2.5 rounded-full hover:bg-blue-400 shadow-sm transition-all duration-300 group"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/30/Zalo_Icon.svg"
                    alt="Zalo"
                    className="w-4.5 h-4.5 group-hover:brightness-0 group-hover:invert transition-all"
                  />
                </a>
                <a
                  href="#"
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-2.5 rounded-full hover:bg-black shadow-sm transition-all duration-300 group"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg"
                    alt="Tiktok"
                    className="w-4.5 h-4.5 group-hover:brightness-0 group-hover:invert transition-all"
                  />
                </a>
                <a
                  href="#"
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-red-600 p-2.5 rounded-full hover:bg-red-600 hover:text-white shadow-sm transition-all duration-300"
                >
                  <Youtube size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
