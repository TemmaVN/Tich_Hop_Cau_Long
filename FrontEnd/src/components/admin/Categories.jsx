import React from 'react';
import { useCategory } from '../../contexts/CategoryContext'; // Đảm bảo đúng đường dẫn
import { Loader2, Box, ChevronRight, Plus , Edit2, Trash2 } from 'lucide-react';

const Categories = () => {
  const { categories, productCounts, loading, addCategory, updateCategory, deleteCategory } = useCategory();
  const handleAddCategory = async () => {
    const name = prompt("Nhập tên danh mục mới:");
    if (!name || name.trim() === "") return;

    const result = await addCategory(name);
    if (result.success) {
      alert("Thêm danh mục thành công!");
    } else {
      alert("Lỗi: " + result.message);
    }
  };
  const getCategoryDisplay = (name) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('vợt') || lowerName.includes('racket')) 
    return { icon: '🏸', color: 'bg-orange-100 text-orange-600' };
    
  if (lowerName.includes('giày') || lowerName.includes('shoe')) 
    return { icon: '👟', color: 'bg-blue-100 text-blue-600' };
    
  if (lowerName.includes('áo') || lowerName.includes('quần') || lowerName.includes('apparel')) 
    return { icon: '👕', color: 'bg-purple-100 text-purple-600' };
    
  if (lowerName.includes('phụ kiện') || lowerName.includes('accessory')) 
    return { icon: '🎒', color: 'bg-amber-100 text-amber-600' };

  if (lowerName.includes('cước') || lowerName.includes('string')) 
    return { icon: '🧵', color: 'bg-rose-100 text-rose-600' };

  if (lowerName.includes('quả') || lowerName.includes('shuttle')) 
    return { icon: '🏸', color: 'bg-emerald-100 text-emerald-600' };

  return { icon: '📦', color: 'bg-slate-100 text-slate-600' };
};

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-slate-500 font-medium">Đang tải danh mục...</p>
      </div>
    );
  }
  const handleDelete = async (e, id, name) => {
    e.stopPropagation(); // Ngăn sự kiện click thẻ (chuyển hướng)
    if (window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
      const result = await deleteCategory(id);
      if (result.success) {
        alert("Xóa thành công!");
      }
    }
  };

  const handleEdit = async (e, id, currentName) => {
    e.stopPropagation(); // Ngăn sự kiện click thẻ
    const newName = prompt("Nhập tên mới cho danh mục:", currentName);
    if (!newName || newName === currentName) return;

    // Giả sử bạn đã thêm hàm updateCategory vào Context (xem mục 2 bên dưới)
    const result = await updateCategory(id, newName);
    if (result.success) {
      alert("Cập nhật thành công!");
    } else {
      alert("Lỗi: " + result.message);
    }
  };
  return (
    <div className="p-6 min-h-screen">
      {/* Header Section */}
      <div className="mx-auto rounded-2xl  overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý danh mục</h3>
              <p className="text-slate-500 text-sm mt-1">Quản lý các nhóm sản phẩm trong cửa hàng</p>
            </div>
            
            <button
              onClick={handleAddCategory}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-200 dark:shadow-orange-500/10"
            >
              <Plus size={20} /> Thêm danh mục
            </button>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {categories && categories.length > 0 ? (
          categories.map((cat) => {
            const display = getCategoryDisplay(cat.categoryName);
            
            return (
              <div 
                key={cat.categoryId} 
                className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden"
              >
                {/* Trang trí nền khi hover */}
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />

                <div className="relative z-10">
                  <div className={`w-14 h-14 ${display.color} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                    {display.icon}
                  </div>
                  
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-orange-500 transition-colors">
                    {cat.categoryName}
                  </h4>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                        /{cat.slug}
                      </span>
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-md">
                        {productCounts[cat.categoryId] ?? 0} sản phẩm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleEdit(e, cat.categoryId, cat.categoryName)}
                          className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"
                          title="Sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, cat.categoryId, cat.categoryName)}
                          className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all text-slate-600 dark:text-slate-300">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center p-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Box className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={48} />
            <p className="text-slate-500 dark:text-slate-400">Không có danh mục nào để hiển thị.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Categories;