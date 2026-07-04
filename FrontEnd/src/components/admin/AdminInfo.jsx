import React, { useState } from 'react';
import { 
    User, Lock, Settings, Mail, Phone, Calendar, 
    Shield, Loader2, CheckCircle2, AlertCircle, Save, Eye, EyeOff 
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const AdminInfo = () => {
    const userLoad = localStorage.getItem('user');
    const user = JSON.parse(userLoad);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'edit', 'password'
    const [adminData] = useState(user);
    const [loading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [editForm, setEditForm] = useState({ fullName: user.fullName, phoneNumber: user.phoneNumber, dateOfBirth: user.dateOfBirth });
    const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });

    const { changePassword, UpdateProfile} = useUser();

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const result = await UpdateProfile(editForm);
            if (result.success) {
                setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
                alert("Cập nhật thành công");
                setActiveTab('profile');
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi cập nhật.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePwd = async (e) => {
        e.preventDefault();
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            return setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
        }
        setActionLoading(true);
        try {
            const result = await changePassword({
                oldPassword: pwdForm.oldPassword, 
                newPassword: pwdForm.newPassword 
            });
            if (result.success) {
                alert("Đổi mật khẩu thành công");
                setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
                setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(result.message);
                setMessage({ type: 'error', text: result.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi đổi mật khẩu.' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-6">
                <div className="bg-linear-to-r from-orange-500 to-red-500 h-32 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center border-4 border-white dark:border-slate-700">
                            <User size={48} className="text-orange-500" />
                        </div>
                    </div>
                </div>
                <div className="pt-14 pb-6 px-8 flex justify-between items-end flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{adminData?.fullName}</h1>
                        <p className="text-gray-500 dark:text-slate-400 flex items-center gap-1"><Shield size={14}/> Quản trị viên hệ thống</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => {setActiveTab('profile'); setMessage({type:'', text:''})}}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-slate-700 shadow text-orange-600' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                        >
                            Tổng quan
                        </button>
                        <button
                            onClick={() => {setActiveTab('edit'); setMessage({type:'', text:''})}}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-slate-700 shadow text-orange-600' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                        >
                            Sửa hồ sơ
                        </button>
                        <button
                            onClick={() => {setActiveTab('password'); setMessage({type:'', text:''})}}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'password' ? 'bg-white dark:bg-slate-700 shadow text-orange-600' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                        >
                            Bảo mật
                        </button>
                    </div>
                </div>
            </div>

            {/* Alert Message */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {/* Tab Content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                {/* 1. TỔNG QUAN (VIEW MODE) */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <InfoItem icon={<Mail/>} label="Email hệ thống" value={adminData?.email} color="blue" />
                            <InfoItem icon={<Phone/>} label="Số điện thoại" value={adminData?.phoneNumber || 'Chưa cập nhật'} color="green" />
                        </div>
                        <div className="space-y-6">
                            <InfoItem icon={<Calendar/>} label="Ngày sinh" value={adminData?.dateOfBirth ? new Date(adminData.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} color="purple" />
                            <InfoItem icon={<Shield/>} label="Trạng thái" value="Đang hoạt động" color="orange" isTag />
                        </div>
                    </div>
                )}

                {/* 2. CHỈNH SỬA HỒ SƠ */}
                {activeTab === 'edit' && (
                    <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-2xl">
                        <InputGroup label="Họ và tên" name="fullName" value={editForm.fullName} onChange={(e)=>setEditForm({...editForm, fullName: e.target.value})} icon={<User size={18}/>} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Số điện thoại" name="phoneNumber" value={editForm.phoneNumber} onChange={(e)=>setEditForm({...editForm, phoneNumber: e.target.value})} icon={<Phone size={18}/>} />
                            <InputGroup label="Ngày sinh" name="dateOfBirth" type="date" value={editForm.dateOfBirth} onChange={(e)=>setEditForm({...editForm, dateOfBirth: e.target.value})} icon={<Calendar size={18}/>} />
                        </div>
                        <SubmitButton loading={actionLoading} text="Lưu thay đổi" />
                    </form>
                )}

                {/* 3. ĐỔI MẬT KHẨU */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePwd} className="space-y-5 max-w-md">
                        <PwdInput label="Mật khẩu hiện tại" value={pwdForm.oldPassword} onChange={(e)=>setPwdForm({...pwdForm, oldPassword: e.target.value})} show={showPwd.old} onToggle={()=>setShowPwd({...showPwd, old: !showPwd.old})} />
                        <PwdInput label="Mật khẩu mới" value={pwdForm.newPassword} onChange={(e)=>setPwdForm({...pwdForm, newPassword: e.target.value})} show={showPwd.new} onToggle={()=>setShowPwd({...showPwd, new: !showPwd.new})} />
                        <PwdInput label="Xác nhận mật khẩu mới" value={pwdForm.confirmPassword} onChange={(e)=>setPwdForm({...pwdForm, confirmPassword: e.target.value})} show={showPwd.confirm} onToggle={()=>setShowPwd({...showPwd, confirm: !showPwd.confirm})} />
                        <SubmitButton loading={actionLoading} text="Cập nhật mật khẩu" />
                    </form>
                )}
            </div>
        </div>
    );
};

// --- Sub-components để code gọn sạch hơn ---

const InfoItem = ({ icon, label, value, color, isTag }) => (
    <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>{icon}</div>
        <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            {isTag ? (
                <span className="inline-block mt-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold">
                    {value}
                </span>
            ) : (
                <p className="text-gray-800 dark:text-white font-semibold text-lg">{value}</p>
            )}
        </div>
    </div>
);

const InputGroup = ({ label, icon, ...props }) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{label}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">{icon}</span>
            <input {...props} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all focus:border-transparent bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-white" />
        </div>
    </div>
);

const PwdInput = ({ label, show, onToggle, ...props }) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{label}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"><Lock size={18}/></span>
            <input type={show ? "text" : "password"} {...props} className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-white" />
            <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                {show ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
        </div>
    </div>
);

const SubmitButton = ({ loading, text }) => (
    <button type="submit" disabled={loading} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:bg-orange-300">
        {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
        {text}
    </button>
);

export default AdminInfo;