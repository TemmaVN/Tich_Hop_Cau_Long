import MyInput from '../components/MyInput'
import Button from '../components/Button'
import FlashButton from '../components/FlashButton'
import { useMediaQuery } from '../mystate/useMediaQuery'
import { Link } from 'react-router-dom'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const isShowPic = useMediaQuery("(min-width: 700px)");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e) => {
        e.preventDefault();
        if (!acceptTerms) {
            alert("Vui lòng đồng ý với Điều khoản sử dụng dịch vụ!");
            return;
        }
        if (password !== confirmPassword){
          alert("Mật khẩu nhập lại không khớp!");
            return;
        }
        setLoading(true);

        const result = await register({email, password});

        if (result.success) {
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate('/login');
        } else {
            alert(result.message);
        }

        setLoading(false);
    };
  
  return (
    <div className='flex w-full h-auto text-black dark:text-white'>
      {
        isShowPic && <img src="/images/register-badminton.webp" alt="" className='w-1/2 h-auto'/>
      }
        <form action="" className='flex flex-col grow max-w-150 mx-10 my-20 md:mx-20 justify-center gap-1'>
            <label htmlFor="" className='font-bold text-4xl'>Đăng ký</label>
            <label htmlFor="" className='pt-8' size='150'>Email</label>
            <MyInput 
            type='text' 
            placeHolder='Email' 
            className='' 
            size='150' 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            ></MyInput>
            <label htmlFor="" className='pt-8'>Mật khẩu</label>
            <MyInput 
            type='password' 
            placeHolder='password' 
            size='150' value={password} 
            onChange={(e) => setPassword(e.target.value)}
            ></MyInput>
            {(password.length < 6 && password.length > 0) && <p className='text-red-500 text-sm'>Mật khẩu phải có ít nhất 6 ký tự</p>}
            <label htmlFor="" className='pt-8'>Nhập lại mật khẩu</label>
            <MyInput 
            type='password' 
            placeHolder='confirm password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
             size='150' 
            ></MyInput>
            {(confirmPassword.length > 0 && confirmPassword !== password) && <p className='text-red-500 text-sm'>Mật khẩu nhập lại không khớp</p>}  
            <div className='relative z-200 w-full flex gap-2 py-2'>
                <input 
                type="checkbox"
                name="ok"
                className='size-4 accent-blue-600 cursor-pointer' 
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label>Tôi đồng ý với Điều khoản sử dụng dịch vụ</label>
            </div>
            <div className='w-full flex justify-center'>
              <FlashButton
              disabled={loading}
              type='submit'
              onClick={handleSubmit}
              itemName={loading ? "Đang xử lý..." : "Đăng ký"}
            >
            </FlashButton>
            </div>
            <div className={`flex ${isShowPic? '':'justify-center'}`}>
              <div className={`flex gap-2 py-3`}>
              <label htmlFor="">Bạn đã có tài khoản?</label>
              <Link to="/login" className='text-orange-default hover:text-orange-900'>Đăng nhập</Link>
              </div>
            </div>
        </form>
    </div>
  )
}

export default Register;