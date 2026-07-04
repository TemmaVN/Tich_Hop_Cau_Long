import React, { useEffect, useState} from 'react';
import {
  ChevronLeftIcon, MapPinIcon, CreditCardIcon, BanknotesIcon,
  WalletIcon, ShieldCheckIcon, ChevronRightIcon,
  UserIcon, PhoneIcon, MapIcon, HomeIcon, DocumentTextIcon, ShoppingBagIcon,
  TagIcon, ChevronDownIcon, ChevronUpIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, CheckIcon } from '@heroicons/react/24/solid';
import {useCart} from '../contexts/CartContext'
import { orderApi, voucherApi } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { ALargeSmall } from 'lucide-react';
import QrCode from '../Logo/Test.png';

const CartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy productItem từ route state, null = order từ cart
  const productItem = location.state?.productItem ?? null;
  const isSingleItem = productItem !== null;
  // 1. STATE QUẢN LÝ BƯỚC & THANH TOÁN
  const [step, setStep] = useState(1); 
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isLoading, setIsLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [vouchers, setVouchers]           = useState([]);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState([]);
  const [voucherOpen, setVoucherOpen]     = useState(false);

  const [pendingPaymentMethod, setPendingPaymentMethod] = useState(null);
  const [incompatibleVouchers, setIncompatibleVouchers] = useState([]);
  const [showPaymentWarning, setShowPaymentWarning]     = useState(false);

  const PAYMENT_METHOD_NAMES = {
    'COD': 'Thanh toán khi nhận hàng',
    'Bank Transfer': 'Chuyển khoản ngân hàng',
    'E-Wallet': 'Ví điện tử',
  };

  useEffect(() => {
    const orderDetails = displayItems.map(item => ({ detailId: item.detailId, quantity: item.quantity }));
    voucherApi.getAvailableVouchers({ paymentMethod, orderDetails })
      .then(res => {
        setVouchers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setVouchers([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);
  const calcDiscount = (voucher, base) => {
    if (base < voucher.minOrderValue) return 0;
    if (voucher.isPercent) {
      const d = base * (voucher.discountValue / 100);
      return voucher.maxDiscountAmount ? Math.min(d, voucher.maxDiscountAmount) : d;
    }
    return voucher.discountValue;
  };

  const toggleVoucher = (id) =>
    setSelectedVoucherIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handlePaymentMethodChange = async (newMethod) => {
    if (newMethod === paymentMethod) return;

    if (selectedVoucherIds.length === 0) {
      setPaymentMethod(newMethod);
      return;
    }

    try {
      const orderDetails = displayItems.map(item => ({ detailId: item.detailId, quantity: item.quantity }));
      const res = await voucherApi.getAvailableVouchers({ paymentMethod: newMethod, orderDetails });
      const newVouchers = Array.isArray(res.data) ? res.data : [];
      // Voucher bị incompatible = không có trong response mới, HOẶC isEligible: false với phương thức mới
      const incompatible = selectedVouchers.filter(sv => {
        const found = newVouchers.find(nv => nv.voucherId === sv.voucherId);
        return !found || !found.isEligible;
      });

      if (incompatible.length > 0) {
        setIncompatibleVouchers(incompatible);
        setPendingPaymentMethod(newMethod);
        setShowPaymentWarning(true);
      } else {
        setPaymentMethod(newMethod);
      }
    } catch {
      setPaymentMethod(newMethod);
    }
  };

  const confirmSwitchPayment = () => {
    const incompatibleIds = incompatibleVouchers.map(v => v.voucherId);
    setSelectedVoucherIds(prev => prev.filter(id => !incompatibleIds.includes(id)));
    setPaymentMethod(pendingPaymentMethod);
    setShowPaymentWarning(false);
    setPendingPaymentMethod(null);
    setIncompatibleVouchers([]);
  };

  const cancelSwitchPayment = () => {
    setShowPaymentWarning(false);
    setPendingPaymentMethod(null);
    setIncompatibleVouchers([]);
  };


  const {cart, deleteCartItem, fetchCart} = useCart();
  const displayItems = isSingleItem
    ? [{
        cartItemId: productItem.detailId,
        imageUrl: productItem.imageUrl,
        productName: productItem.productName,
        variantInfo: productItem.variantInfo,
        quantity: productItem.quantity,
        unitPrice: productItem.unitPrice,
        subTotal: productItem.unitPrice * productItem.quantity,
        detailId: productItem.detailId,
      }]
    : cart;

  const subtotal      = displayItems.reduce((acc, item) => acc + item.subTotal, 0);
  const totalQuantity = displayItems.reduce((acc, item) => acc + item.quantity, 0);
  const shippingFee   = subtotal > 500_000 ? 30_000 : 0;

  const selectedVouchers = vouchers.filter(v => selectedVoucherIds.includes(v.voucherId));
  const totalDiscount = Math.min(
    selectedVouchers.reduce((sum, v) => sum + calcDiscount(v, subtotal), 0),
    subtotal
  );
  const finalTotal = subtotal + shippingFee - totalDiscount;
  const user = JSON.parse(localStorage.getItem('user'));
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    city: user.city || '',
    district: user.district || '',
    address: user.detailedAddress || '',
    note: ''
  });

  // Hàm cập nhật dữ liệu form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
    const handleNextAction = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phoneNumber || !formData.address) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
      }
      if (formData.phoneNumber.length !== 10 || formData.phoneNumber[0] !== '0') {
        alert("vui lòng nhập đúng số điện thoại có 10 số và bắt đầu bằng số 0");
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsLoading(true);
      setOrderError('');
      try {
        const orderPayload = {
          receiverName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          shippingAddress: `${formData.address}, ${formData.district}, ${formData.city}`,
          note: formData.note,
          paymentMethod: paymentMethod,
          voucherIds: selectedVoucherIds.length > 0 ? selectedVoucherIds : undefined,
          orderDetails: displayItems.map(item => ({
            detailId: item.detailId,
            quantity: item.quantity,
          })),
        };
        const previewRes = await orderApi.preview(orderPayload);
        if (!previewRes.data?.isValid) {
          setOrderError(previewRes.data?.errorMessage || 'Đơn hàng không hợp lệ. Vui lòng kiểm tra lại.');
          return;
        }
        const response = await orderApi.create(orderPayload);
        if (response.status === 200 || response.status === 201) {
          // Xóa cart riêng, KHÔNG để lỗi ở đây block UX
          if (!isSingleItem) {
            try {
              await Promise.all(cart.map(item => deleteCartItem(item.cartItemId)));
              await fetchCart();
            } catch (err) {
              fetchCart().catch(() => {});
              alert(err)
            }
          }
          
          alert('Đặt hàng thành công! 🎉');
          navigate('/');
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại!';
        setOrderError(msg);
        alert(msg)
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 py-10 px-4 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => step === 2 ? setStep(1) : window.history.back()}
            className="p-3 bg-white dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-black">Đặt hàng</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {step === 1 ? 'Thông tin giao hàng' : 'Xác nhận & thanh toán'}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex items-center mb-12 relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3 z-10 bg-[#fcfcfc] dark:bg-slate-950 pr-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-orange-default text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}>
              {step > 1 ? <CheckCircleIcon className="w-6 h-6" /> : '1'}
            </div>
            <span className={`text-sm font-semibold ${step >= 1 ? 'text-orange-default' : 'text-gray-400 dark:text-slate-500'}`}>Thông tin</span>
          </div>

          <div className={`absolute top-5 left-0 right-0 h-0.5 -z-10 transition-colors duration-300 ${step > 1 ? 'bg-orange-default' : 'bg-gray-100 dark:bg-slate-700'}`}></div>

          <div className="flex items-center gap-3 z-10 bg-[#fcfcfc] dark:bg-slate-950 pl-4 ml-auto">
            <span className={`text-sm font-semibold ${step === 2 ? 'text-orange-default' : 'text-gray-400 dark:text-slate-500'}`}>Xác nhận</span>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step === 2 ? 'bg-orange-default text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}>
              2
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT CHIA 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          
          {/* CỘT TRÁI: Động theo Step */}
          <div className="space-y-6">
            
            {/* BƯỚC 1: FORM ĐIỀN THÔNG TIN */}
            {step === 1 && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-orange-100 dark:bg-orange-500/20 text-orange-default rounded-full">
                    <MapPinIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-black dark:text-white">Thông tin người nhận</h2>
                </div>

                <div className="space-y-6">
                  <InputField label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleInputChange} icon={UserIcon} placeholder="VD: Nguyễn Văn An" required />
                  <InputField label="Số điện thoại" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} icon={PhoneIcon} placeholder="VD: 0901234567" required />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Có thể thay thành thẻ <select> thật nếu bạn có danh sách API */}
                    <InputField label="Tỉnh / Thành phố" name="city" value={formData.city} onChange={handleInputChange} placeholder="VD: TP. Hồ Chí Minh" required />
                    <InputField label="Phường / Xã" name="district" value={formData.district} onChange={handleInputChange} icon={MapIcon} placeholder="VD: Phường 2" required />
                  </div>

                  <InputField label="Số nhà, tên đường" name="address" value={formData.address} onChange={handleInputChange} icon={HomeIcon} placeholder="VD: 123 Nguyễn Trãi" required />

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Ghi chú đơn hàng (tuỳ chọn)</label>
                    <div className="relative">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute top-4 left-4" />
                      <textarea 
                        name="note"
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder="Giao giờ hành chính, gọi trước khi giao..." 
                        rows="4"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-100 dark:border-slate-600 rounded-2xl bg-[#fafafa] dark:bg-slate-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600 text-sm focus:ring-1 focus:ring-orange-default focus:border-orange-default outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BƯỚC 2: XÁC NHẬN & THANH TOÁN */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* Box Tóm tắt địa chỉ lấy từ Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPinIcon className="w-6 h-6 text-orange-default" />
                    <h2 className="text-lg font-black text-gray-800 dark:text-white">Địa chỉ giao hàng</h2>
                  </div>
                  <button onClick={() => setStep(1)} className="absolute top-6 right-6 text-orange-default text-sm font-bold hover:underline">Thay đổi</button>
                  <div className="space-y-1 text-sm">
                    <p className="font-black text-base dark:text-white">{formData.fullName}</p>
                    <p className="text-gray-600 dark:text-slate-400 flex items-center gap-2"><PhoneIcon className="w-4 h-4" /> {formData.phoneNumber }</p>
                    <p className="text-gray-600 dark:text-slate-400 flex items-start gap-2 mt-2">
                      <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formData.address}, {formData.district}, {formData.city}</span>
                    </p>
                    {formData.note && <p className="text-gray-500 dark:text-slate-500 italic mt-2">- Ghi chú: {formData.note}</p>}
                  </div>
                </div>

                {/* Box Phương thức thanh toán */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <CreditCardIcon className="w-6 h-6 text-orange-default" />
                    <h2 className="text-lg font-black dark:text-white">Phương thức thanh toán</h2>
                  </div>
                  <div className="space-y-4">
                    <PaymentOption id="COD" title="Thanh toán khi nhận hàng" desc="Trả tiền mặt khi nhận hàng (COD)" icon={<BanknotesIcon className="w-6 h-6" />} selected={paymentMethod === 'COD'} onSelect={() => handlePaymentMethodChange('COD')} />
                    <PaymentOption id="Bank Transfer" title="Chuyển khoản ngân hàng" desc="Vietcombank, BIDV, Techcombank..." icon={<CreditCardIcon className="w-6 h-6" />} selected={paymentMethod === 'Bank Transfer'} onSelect={() => handlePaymentMethodChange('Bank Transfer')} />
                    <PaymentOption id="E-Wallet" title="Ví điện tử" desc="Thanh toán nhanh qua ví điện tử" icon={<WalletIcon className="w-6 h-6" />} selected={paymentMethod === 'E-Wallet'} onSelect={() => handlePaymentMethodChange('E-Wallet')} />
                  </div>
                </div>

                {/* QR Code khi chọn chuyển khoản hoặc ví điện tử */}
                {(paymentMethod === 'Bank Transfer' || paymentMethod === 'E-Wallet') && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm text-center">
                    <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Quét mã QR để thanh toán
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mb-4">
                      {paymentMethod === 'Bank Transfer' ? 'Chuyển khoản ngân hàng' : 'Ví điện tử'} · {Math.round(finalTotal).toLocaleString()} đ
                    </p>
                    <div className="flex justify-center">
                      <img
                        src={QrCode}
                        alt="QR thanh toán"
                        className="w-52 h-52 object-contain rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-3">
                      Chụp ảnh màn hình hoặc quét trực tiếp bằng app ngân hàng / ví điện tử
                    </p>
                  </div>
                )}

                {/* Shield Note */}
                <div className="p-4 bg-orange-50/50 dark:bg-orange-500/10 rounded-2xl flex items-center gap-3 text-orange-default border border-orange-100/50 dark:border-orange-500/20">
                  <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                  <p className="text-[11px] font-medium">Thông tin của bạn được bảo mật an toàn. Đổi trả dễ dàng trong 7 ngày.</p>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: BILL THANH TOÁN */}
          <div className="lg:sticky lg:top-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-default rounded-full">
                  <ShoppingBagIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black dark:text-white">Đơn hàng ({totalQuantity} sản phẩm)</h3>
             </div>

             {/* Danh sách sản phẩm - Giải quyết vấn đề bị rớt dòng */}
             <div className="space-y-4 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
               {displayItems.map(item => (
                <div key={item.cartItemId} className="flex flex-row items-center gap-4 py-3 border-b border-gray-50 dark:border-slate-700 last:border-0">
                  <div className="relative shrink-0">
                    <img 
                      src={item.imageUrl}          
                      alt={item.productName}       
                      className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-slate-700 shadow-sm"
                    />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-default text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                      {item.quantity}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 line-clamp-2 leading-tight">
                      {item.productName}           
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {item.variantInfo}
                    </p>
                  </div>

                  <div className="text-sm font-bold text-orange-default whitespace-nowrap">
                    {item.unitPrice.toLocaleString()} đ   
                  </div>
                </div>
              ))}
             </div>

             {/* ── Voucher selector ── */}
             {/* Chỉ hiện những voucher isEligible: true (phù hợp phương thức thanh toán hiện tại) */}
             {(vouchers.some(v => v.isEligible) && step === 2) && (
               <div className="mt-5 border border-dashed border-orange-200 dark:border-orange-500/30 rounded-2xl overflow-hidden">
                 <button
                   onClick={() => setVoucherOpen(o => !o)}
                   className="w-full flex items-center justify-between px-4 py-3 bg-orange-50/60 dark:bg-orange-500/10 hover:bg-orange-50 dark:hover:bg-orange-500/20 transition-colors"
                 >
                   <span className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                     <TagIcon className="w-4 h-4" />
                     Mã giảm giá
                     {selectedVoucherIds.length > 0 && (
                       <span className="bg-orange-default text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                         {selectedVoucherIds.length}
                       </span>
                     )}
                   </span>
                   {voucherOpen
                     ? <ChevronUpIcon className="w-4 h-4 text-orange-500" />
                     : <ChevronDownIcon className="w-4 h-4 text-orange-500" />}
                 </button>

                 {voucherOpen && (
                   <div className="divide-y divide-orange-50 dark:divide-slate-700 max-h-56 overflow-y-auto">
                     {vouchers.filter(v => v.isEligible).map(v => {
                       const isSelected = selectedVoucherIds.includes(v.voucherId);
                       const discount   = calcDiscount(v, subtotal);
                       const meetsMin   = discount > 0;
                       return (
                         <button
                           key={v.voucherId}
                           onClick={() => meetsMin && toggleVoucher(v.voucherId)}
                           disabled={!meetsMin}
                           className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors
                             ${isSelected ? 'bg-emerald-50 dark:bg-emerald-500/10' : meetsMin ? 'hover:bg-gray-50 dark:hover:bg-slate-700' : 'opacity-50 cursor-not-allowed bg-white dark:bg-slate-800'}
                           `}
                         >
                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                             ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-slate-600'}`}
                           >
                             {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-xs font-bold font-mono text-gray-800 dark:text-slate-200 truncate">{v.voucherCode}</p>
                             <p className="text-[11px] text-gray-500 dark:text-slate-500 truncate">
                               {v.isPercent ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString()}đ`}
                               {' · '}Tối thiểu {v.minOrderValue.toLocaleString()}đ
                             </p>
                           </div>
                           {meetsMin && (
                             <span className="text-xs font-bold text-emerald-600 shrink-0">
                               −{Math.round(discount).toLocaleString()}đ
                             </span>
                           )}
                           {!meetsMin && (
                             <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">Chưa đủ ĐK</span>
                           )}
                         </button>
                       );
                     })}
                   </div>
                 )}
               </div>
             )}

             {/* Tóm tắt giá tiền */}
             <div className="pt-5 space-y-3 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Tạm tính</span>
                  <span className="font-bold text-gray-900 dark:text-white">{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Phí vận chuyển</span>
                  <span className={`font-bold ${shippingFee === 0 ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                    {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()} đ`}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Giảm giá</span>
                      <span className="font-bold text-emerald-600">−{Math.round(totalDiscount).toLocaleString()} đ</span>
                    </div>
                    {selectedVouchers.map(v => (
                      <div key={v.voucherId} className="flex justify-between text-xs pl-2">
                        <span className="text-emerald-600 font-mono">{v.voucherCode}</span>
                        <span className="text-emerald-600">−{Math.round(calcDiscount(v, subtotal)).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </>
                )}
             </div>

             {/* Tổng tiền */}
             <div className="flex justify-between items-center pt-5 border-t border-dashed border-gray-200 dark:border-slate-700 mt-4">
                <span className="font-black text-lg dark:text-white">Tổng cộng</span>
                <span className="text-2xl font-black text-orange-default">{Math.round(finalTotal).toLocaleString()} đ</span>
             </div>
          </div>
        </div>

        {/* NÚT ACTION CUỐI CÙNG LỚN (Giải quyết sự kiện bấm) */}
        <div className="mt-10 flex justify-center pb-20">
          <div className='flex flex-col'>
            {orderError && (
            <p className="text-center text-red-500 text-sm mb-3">{orderError}</p>
          )}

          <button 
            onClick={handleNextAction}
            disabled={isLoading}
            className="w-full max-w-xl py-4 px-8 bg-orange-default text-white text-lg font-black rounded-2xl 
                      hover:bg-orange-dark hover:shadow-orange-200 transition-all shadow-lg shadow-orange-100 
                      flex items-center justify-center gap-2 tracking-wide
                      disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                {step === 1 ? 'Tiếp tục tới thanh toán' : 'Xác nhận đặt hàng'}
                <ChevronRightIcon className="w-6 h-6" />
              </>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Modal cảnh báo voucher không tương thích */}
      {showPaymentWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl dark:border dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-default rounded-full">
                <TagIcon className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-gray-900 dark:text-white">Voucher không tương thích</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
              {incompatibleVouchers.length === 1 ? 'Voucher' : 'Các voucher'}{' '}
              <span className="font-bold text-orange-default font-mono">
                {incompatibleVouchers.map(v => v.voucherCode).join(', ')}
              </span>
              {' '}không thể sử dụng với{' '}
              <span className="font-bold">{PAYMENT_METHOD_NAMES[pendingPaymentMethod]}</span>.
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-500 mb-5">
              Để tiếp tục dùng voucher này, hãy giữ lại{' '}
              <span className="font-semibold">{PAYMENT_METHOD_NAMES[paymentMethod]}</span>.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={cancelSwitchPayment}
                className="w-full py-3 rounded-2xl border-2 border-orange-default text-orange-default font-bold text-sm hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
              >
                Giữ nguyên "{PAYMENT_METHOD_NAMES[paymentMethod]}"
              </button>
              <button
                onClick={confirmSwitchPayment}
                className="w-full py-3 rounded-2xl bg-orange-default text-white font-bold text-sm hover:bg-orange-dark transition-colors"
              >
                Chuyển sang "{PAYMENT_METHOD_NAMES[pendingPaymentMethod]}"
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- CÁC COMPONENT PHỤ --- */

// Component Input tái sử dụng
const InputField = ({ label, name, value, onChange, icon: Icon, required, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute top-1/2 -translate-y-1/2 left-4" />}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 border border-gray-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800 placeholder:text-gray-300 dark:placeholder:text-slate-600 text-sm focus:ring-2 focus:ring-orange-default/20 focus:border-orange-default outline-none transition-all text-gray-800 dark:text-white font-medium`}
        {...props}
      />
    </div>
  </div>
);

// Component Lựa chọn thanh toán
const PaymentOption = ({title, desc, icon, selected, onSelect }) => (
  <div 
    onClick={onSelect}
    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
      selected ? 'border-orange-default bg-orange-50/30 dark:bg-orange-500/10 shadow-sm shadow-orange-100' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-600'
    }`}
  >
    <div className={`p-3 rounded-xl ${selected ? 'bg-white dark:bg-slate-700 text-orange-default shadow-sm' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className={`text-sm font-black ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-slate-300'}`}>{title}</p>
      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{desc}</p>
    </div>
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-orange-default' : 'border-gray-200 dark:border-slate-600'}`}>
      {selected && <div className="w-3 h-3 rounded-full bg-orange-default" />}
    </div>
  </div>
);

export default CartPage;