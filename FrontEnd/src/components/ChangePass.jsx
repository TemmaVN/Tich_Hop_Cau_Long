import React, {useState} from 'react'
import { useMediaQuery } from '../mystate/useMediaQuery'
import MyInput from './MyInput';
import FlashButton from './FlashButton';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const ChangePass = () => {
  const isMini = useMediaQuery('(max-width: 768px)');
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { changePassword } = useUser();

    const handleSaveChanges = async () => {
        // Validate input fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
            return;
        }
        if (newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }

        setLoading(true);

        const result =  await changePassword({oldPassword, newPassword});

        if (result.success) {
            alert('Mật khẩu đã được thay đổi thành công!');
            navigate('/');
        } else {
            alert('Thay đổi mật khẩu thất bại: ' + result.message);
        }

        setLoading(false);
    };

  return (
    <form className={`max-w-160 h-full p-8 gap-4 flex flex-col grow border-gray-300 dark:border-slate-700 ${isMini? 'border-t-2':'border-l-2'}`} action="">
        <h2 className='font-bold text-2xl pb-4 text-slate-900 dark:text-white'>Thay đổi mật khẩu</h2>
        <div className='gap-3 flex flex-col font-medium'>
            <label htmlFor="oldPassword" className='text-slate-700 dark:text-slate-300'>Mật khẩu cũ</label>
            <MyInput 
            size="300" 
            type="password" 
            placeholder='Mật khẩu cũ'
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            />
        </div>
        <div className='gap-3 flex flex-col font-medium'>
            <label htmlFor="newPassword" className='text-slate-700 dark:text-slate-300'>Mật khẩu mới</label>
            <MyInput 
            size="300" 
            type="password" 
            placeholder='Mật khẩu mới'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            />
            {(newPassword && newPassword.length < 6) && <span className='text-red-500 text-sm'>Mật khẩu mới phải có ít nhất 6 ký tự</span>}            
        </div>
        <div className='gap-3 flex flex-col font-medium'>
            <label htmlFor="confirmPassword" className='text-slate-700 dark:text-slate-300'>Nhập lại mật khẩu mới</label>
            <MyInput 
            size="300" 
            type="password" 
            placeholder='Nhập lại mật khẩu mới'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {(confirmPassword && confirmPassword !== newPassword) && <span className='text-red-500 text-sm'>Mật khẩu xác nhận không khớp</span>}
        </div>
        <div className='w-full flex justify-center'>
            <FlashButton 
            disabled={loading}
            onClick={handleSaveChanges}
            itemName={loading? "Đang lưu...": "Lưu thay đổi"}
            ></FlashButton>
        </div>
    </form>
  )
}

export default ChangePass