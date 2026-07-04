import React, { useEffect } from 'react';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ isOpen, setIsOpen }) => {
  const {cart, addToCart, fetchCart,updateCartItem, setCart ,deleteCartItem} = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeQuantity = async (cartItemId, detailId, delta, currentQuantity) => {
    const newQuantity = currentQuantity + delta;

    // Optimistic update - cập nhật UI trước
    setCart(prev => prev.map(item => 
      item.cartItemId === cartItemId 
        ? { ...item, quantity: newQuantity, subTotal: item.unitPrice * newQuantity }
        : item
    ));
    try {
      if (delta === 1) {
        // Tăng → dùng addToCart với quantity = 1
        await addToCart(detailId, 1);
      } else {
        // Giảm → dùng updateCartItem với số lượng tuyệt đối
        if (newQuantity <= 0) {
          await deleteCartItem(cartItemId);
        } else {
          await updateCartItem(cartItemId, newQuantity);
        }
      }
    } catch (err) {
      // Rollback nếu lỗi
      setCart(prev => prev.map(item =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: currentQuantity, subTotal: item.unitPrice * currentQuantity }
          : item
      ));
      alert(err.message); // hoặc toast
    }
    fetchCart();
  };

  return (
    <>
      {/* 1. Overlay: Làm mờ toàn bộ màn hình, nằm trên cả Header */}
      <div 
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ease-in-out z-999 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 2. Drawer Panel: Trượt từ phải sang */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-112.5 bg-white dark:bg-slate-900 shadow-2xl z-1000 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Nút đóng (X) */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 dark:text-slate-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="pt-12 pb-6 text-center">
            <h2 className="text-4xl font-bold text-[#001e3c] dark:text-white">Giỏ hàng</h2>
          </div>

          {/* Danh sách sản phẩm (Phần thân có thể cuộn) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-200
            dark:[&::-webkit-scrollbar-thumb]:bg-slate-700
            [&::-webkit-scrollbar-thumb]:rounded-full">
            
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 relative">
                {/* Ảnh sản phẩm */}
                <div className="w-20 h-20 shrink-0">
                  <img 
                    src={item.imageUrl} 
                    alt={item.productName} 
                    className="w-full h-full object-contain border border-gray-100 dark:border-slate-700 rounded-sm"
                  />
                </div>

                {/* Chi tiết sản phẩm */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-medium leading-tight text-gray-800 dark:text-white line-clamp-2 mb-3">
                    {item.productName}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">{item.variantInfo}</p>
                  <div className="flex items-center justify-between">
                    {/* Bộ tăng giảm số lượng */}
                    <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded">
                      <button 
                      onClick={() => changeQuantity(item.cartItemId, item.detailId, -1, item.quantity)}
                      className="px-2 py-1 text-gray-500 dark:text-slate-400 hover:text-orange-500 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold border-x border-gray-200 dark:border-slate-600 dark:text-white">
                        {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
                      </span>
                      <button 
                      onClick={() => changeQuantity(item.cartItemId, item.detailId, 1, item.quantity)}
                      className="px-2 py-1 text-gray-500 dark:text-slate-400 hover:text-orange-500 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Giá tiền */}
                    <span className="text-orange-600 font-bold text-base">
                      {(item.unitPrice).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer (Cố định ở đáy) */}
          <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Tổng cộng</span>
              <span className="text-xl font-bold text-red-600">
                {cart.reduce((sum, item) => sum + item.subTotal, 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="flex justify-center">
              <button
              onClick={() => navigate("/cart")} 
              className="py-3.5 px-20 bg-orange-500 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100">
                <ShoppingCart size={18} />
                Đặt mua
              </button>
            </div>
          </div>
        </div>

        {/* Hình trang trí cầu lông (giống ảnh image_f1eaf5.png) */}
        <div className="absolute bottom-24 right-4 opacity-20 pointer-events-none select-none">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/2855/2855584.png" 
            alt="decoration" 
            className="w-24 h-24 grayscale brightness-150"
          />
        </div>
      </div>
    </>
  );
};

export default CartDrawer;