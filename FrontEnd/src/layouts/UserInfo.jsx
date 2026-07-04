import { LockKeyhole, PackageMinus, Tag, User2, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button'
import { useMediaQuery } from '../mystate/useMediaQuery'
import Information from '../components/Information'
import ChangePass from '../components/ChangePass'
import MyOrders from './MyOrders'
import MyVoucher from './MyVoucher'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const UserInfo = () => {
    const isMini = useMediaQuery('(max-width: 768px)');
    const [page, setPage] = useState('info');
    const { logout, isAdmin } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const user = JSON.parse(localStorage.getItem('user'));
    const fullName = user?.fullName ?? '';
    return (
    <div className='text-slate-900 dark:text-white flex justify-center bg-white dark:bg-slate-950 min-h-screen'>
        <div className={`w-300 h-auto my-30 p-15 flex ${isMini? 'flex-col':''} gap-8 shadow-2xl bg-white dark:bg-slate-900 rounded-2xl`}>
            <div className={``}>
                <div className='flex items-start justify-between'>
                <div className='flex'>
                <img src="https://static.fbshop.vn/template/assets/images/im-des.png" className='rounded-full h-20 w-20'/>
                    <div className='px-3 flex flex-col justify-center'>
                        <h2 className='text-lg'>{fullName}</h2>
                        <Link
                        to="/"
                        onClick={logout}
                        className='text-slate-500 dark:text-slate-400 underline hover:text-orange-default'>Đăng xuất</Link>
                    </div>
                </div>
                <button
                    onClick={toggleTheme}
                    className='p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
                    title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                </div>
                <div className={`flex flex-col gap-8 pt-8 ${isMini? 'w-full h-auto':'w-60'}`}>
                    <Button 
                    onClick={() => setPage('info')} 
                    className={`flex gap-2 justify-center hover:bg-orange-light dark:hover:bg-orange-500/20 ${page === 'info' ? 'bg-orange-light dark:bg-orange-500/20 font-bold' : ''} rounded-full`}
                    ><User2/> Thông tin tài khoản</Button>
                    <Button 
                    onClick={() => setPage('changePass')} 
                    className={`flex gap-2 justify-center hover:bg-orange-light ${page === 'changePass' ? 'bg-orange-light font-bold' : ''} rounded-full`}
                    ><LockKeyhole/> Thay đổi mật khẩu</Button>
                    {!isAdmin() && <>
                    <Button
                    onClick={() => setPage('orders')}
                    className={`flex gap-2 justify-center hover:bg-orange-light ${page === 'orders' ? 'bg-orange-light font-bold' : ''} rounded-full`}
                    ><PackageMinus/> Lịch sử đơn hàng</Button>
                    <Button
                    onClick={() => setPage('voucher')}
                    className={`flex gap-2 justify-center hover:bg-orange-light ${page === 'voucher' ? 'bg-orange-light font-bold' : ''} rounded-full`}
                    ><Tag/> Voucher của tôi</Button>
                    </>}
                </div>
            </div>
            {page === 'info' && <Information/>}
            {page === 'changePass' && <ChangePass/>}
            {page === 'orders' && <MyOrders/>}
            {page === 'voucher' && <MyVoucher/>}
        </div>
    </div>
  )
}

export default UserInfo