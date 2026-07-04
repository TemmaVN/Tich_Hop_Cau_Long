import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Globe, Package, Loader2, RefreshCw } from 'lucide-react';
import { brandApi } from '../../api';

const Brand = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Hàm lấy danh sách thương hiệu
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await brandApi.getAll();
      setBrands(response.data.data || []);
    } catch (err) {
      alert(err.message);
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // 2. Hàm Xóa Thương Hiệu
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) return;
    
    try {
      await brandApi.delete(id);
      setBrands(brands.filter(b => b.brandId !== id));
      alert("Xóa thành công!");
    } catch (err) {
      // Backend trả về message lỗi khi không xóa được (do có sản phẩm liên quan)
      const errorMsg = err.response?.data?.Message || "Xóa thất bại!";
      alert(errorMsg);
    }
  };

  // 3. Hàm Thêm mới (Ví dụ dùng prompt để đơn giản hóa cho demo)
  const handleAddBrand = async () => {
    const name = prompt("Nhập tên thương hiệu mới:");
    if (!name) return;

    try {
      setLoading(true);
      const response = await brandApi.create(name);
      // Backend trả về: { Message: "...", data: { brandId, brandName, ... } }
      setBrands([response.data.data, ...brands]);
      alert("Thêm thành công!");
    } catch {
      alert("Lỗi khi thêm thương hiệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e, id, currentName) => {
    e.stopPropagation();
    const newName = prompt("Nhập tên mới cho thương hiệu:", currentName);
    if (!newName || newName === currentName) return;

    try {
        const response = await brandApi.update(id, newName);
        
        if (response.status === 200) {
            alert("Cập nhật thành công!");
            fetchBrands(); // Tải lại danh sách
        }
    } catch (error) {
        // Lấy thông báo lỗi từ Backend (C# trả về object có thuộc tính Message)
        const errorMsg = error.response?.data?.Message || error.response?.data?.message || "Lỗi không xác định";
        alert("Lỗi: " + errorMsg);
    }
};

  if (loading && brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-slate-500">Đang tải dữ liệu từ server...</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header Section */}
      <div className="mx-auto rounded-2xl  overflow-hidden space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Thương hiệu</h2>
          <p className="text-sm text-slate-500">Tổng số: {brands.length} nhãn hàng</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBrands}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleAddBrand}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus size={20} /> Thêm Brand
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/20">
          {error}
        </div>
      )}

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <div 
            key={brand.brandId} 
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 transition-all group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-white font-black text-xl uppercase group-hover:bg-orange-500 group-hover:text-white transition-colors">
                {brand.brandName?.charAt(0)}
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                onClick={(e) => handleUpdate(e, brand.brandId, brand.brandName)}
                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors">
                  <Edit2 size={14}/>
                </button>
                <button
                  onClick={() => handleDelete(brand.brandId)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">
              {brand.brandName}
            </h3>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe size={12} />
                <span>slug: /{brand.slug}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Package size={12} />
                <span>Mã số: {brand.brandId}</span>
              </div>
            </div>

            {/* Indicator cho brand mới */}
            {!brand.slug && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            )}
          </div>
        ))}
      </div>

      {brands.length === 0 && !loading && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 dark:text-slate-500">Chưa có dữ liệu thương hiệu nào.</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default Brand;