import React, {useState} from 'react'
import MyInput from '../components/MyInput'
import { useMediaQuery } from '../mystate/useMediaQuery'
import FlashButton from '../components/FlashButton'
import { UserCircleIcon } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useAuth } from '../contexts/AuthContext'

const Information = () => {
    const storedUser = localStorage.getItem('user');
    const user = JSON.parse(storedUser);
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        return dateString.split('T')[0]; 
    };
    const [fullName, setFullName] = useState(user.fullName);
    const [dateOfBirth, setDateOfBirth] = useState(formatDateForInput(user.dateOfBirth));
    const [email, setEmail] = useState(user.email);
    const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);

    const [city, setCity] = useState(user.city || '');
    const [district, setDistrict] = useState(user.district || '');
    const [detailedAddress, setDetailedAddress] = useState(user.detailedAddress || '');
    const { UpdateProfile } = useUser();
    const {isAdmin} = useAuth();
    const {  getUserInfo} = useUser();

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        if (!fullName || !email) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }
        if ((!city || !district || !detailedAddress) && !isAdmin()) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }
        const result = await UpdateProfile({fullName, dateOfBirth, phoneNumber, city, district, detailedAddress});
        if (result.success) {
            alert('Thông tin đã được lưu thành công!');
            getUserInfo();
        } else {
            alert('Lỗi:', result.message);
        }
    };

    const isCol = useMediaQuery('(min-width: 970px)');
    const isMini = useMediaQuery('(max-width: 768px)');
    const isFlexData = useMediaQuery('(max-width: 1030px)');

    return (
        <form 
        onSubmit={handleSaveInfo}
        className={`w-full h-full p-8 flex flex-col border-gray-300 dark:border-slate-700 ${isMini? 'border-y-2':'border-l-2'}`}>
                <div className='border-b-2 border-gray-300 dark:border-slate-700 pb-8'>
                    <h2 className='font-bold text-2xl pb-8 text-slate-900 dark:text-white'>Thông tin tài khoản</h2>
                    <div className='flex flex-wrap gap-3 justify-around items-center '>
                        <img src="https://static.fbshop.vn/template/assets/images/im-des.png" className='rounded-full h-20 w-20'/>
                        <div className={`flex grow ${isCol? '':'flex-wrap'} max-w-160 gap-3`}>
                            <div className={`flex flex-wrap grow ${isCol? 'max-w-80': 'max-w-120'}`}>
                                <div className='flex flex-col grow max-w-120'>
                                    <div className='flex gap-2 pb-2'>
                                        <label htmlFor="" className="text-slate-700 dark:text-slate-300">Họ và tên</label>
                                        <span className='text-orange-default'>*</span>
                                    </div>
                                    <MyInput 
                                    size="200" 
                                    className=''
                                    placeHolder="Họ và tên"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                                <div className='flex flex-col grow max-w-120'>
                                    <label className='pb-2 text-slate-700 dark:text-slate-300' htmlFor="">Ngày sinh</label>
                                    <MyInput 
                                    size="200" 
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={`flex flex-wrap grow ${isCol? 'max-w-80': 'max-w-120'}`}>
                                <div className='flex grow flex-col max-w-120'>
                                    <label className='pb-2 text-slate-700 dark:text-slate-300' htmlFor="email">Email</label>
                                    <MyInput 
                                    size="200" 
                                    isReadOnly={true}
                                    placeHolder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className='flex grow flex-col max-w-120'>
                                    <label className='pb-2 text-slate-700 dark:text-slate-300' htmlFor="phone">Số điện thoại</label>
                                    <MyInput 
                                    size="200" 
                                    placeHolder="Số điện thoại"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {!isAdmin() && <div className='pt-8 gap-8 flex flex-col'>
                    <h2 className='font-bold text-2xl text-slate-900 dark:text-white'>Thông tin giao hàng</h2>
                    <div className={`flex flex-col grow ${isFlexData? '':'flex-wrap'} gap-3 justify-around items-center`}>
                        <div className={`flex grow ${isFlexData? 'flex-col':''} justify-around items-center gap-5 w-full`}>
                            <div className='w-full flex flex-col h-25'>
                                <div className='flex pb-2 gap-2'>
                                    <label htmlFor="" className="text-slate-700 dark:text-slate-300">Tỉnh/thành phố </label>
                                    <span className='text-orange-default'></span>  
                                </div>
                                <MyInput 
                                size="800" 
                                placeHolder="Tỉnh/thành phố"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                />
                            </div>
                            <div className='w-full flex flex-col h-25'>
                                <div className='flex pb-2 gap-2'>
                                    <label htmlFor="" className="text-slate-700 dark:text-slate-300">Phường/xã</label>
                                    <span className='text-orange-default'></span>  
                                </div>
                                <MyInput 
                                size="800" 
                                placeHolder="Phường/xã"
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className='w-full flex flex-col h-25'>
                                <div className='flex pb-2 gap-2'>
                                    <label htmlFor="" className="text-slate-700 dark:text-slate-300">Địa chỉ</label>
                                    <span className='text-orange-default'></span>  
                                </div>
                                <MyInput 
                                size="800" 
                                placeHolder="Địa chỉ của bạn"
                                value={detailedAddress}
                                onChange={(e) => setDetailedAddress(e.target.value)}
                                />
                            </div>
                    </div>
                    
                </div>}
                <div className='flex w-full justify-center mt-4'>
                        <FlashButton 
                        type='submit'
                        itemName="Lưu thông tin"
                        />
                    </div>
            </form>
  )
}

export default Information