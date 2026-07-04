import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductFrame_Minh from "./ProductFrame_Minh";
import FlashButton from "./FlashButton";
import { useCategory } from "../contexts/CategoryContext";

const CategoryShowcase = ({ category, products, categoryImage }) => {
  const navigate = useNavigate();
  const {pageCatagory, setPageCatagory} = useCategory();
  if (!category || !products || products.length === 0) {
    return null;
  }

  const handleClickAll = () => {
    navigate(`/${category.slug}`);
    setPageCatagory(category.categoryName.toUpperCase());
    sessionStorage.setItem('pageCatagory', category.categoryName.toUpperCase());
  }

  const displayedProducts = products.slice(0, 6);

  return (
    <div className="max-w-300 mx-auto my-12 px-4">
      {/* Tiêu đề */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-orange-500 pb-2">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          {category.categoryName}
        </h2>
        <FlashButton itemName="Xem tất cả" onClick={() => handleClickAll()}>
        </FlashButton>
      </div>

      {/* Sử dụng Flexbox để kiểm soát Banner và Grid Sản phẩm */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* BANNER ẢNH LỚN: Thiết lập chiều rộng cố định (vd: 320px) để không bị bóp méo */}
        <div className="w-full lg:w-[320px] shrink-0">
          <Link
            to={`/${category.slug}`}
            className="block h-full rounded-xl overflow-hidden border-[1.6px] border-orange-500 shadow-md group"
          >
            <img
              src={categoryImage}
              alt={category.categoryName}
              // Sử dụng object-cover và h-full để lấp đầy thẻ chứa
              className="w-full h-full min-h-125 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* LƯỚI SẢN PHẨM: flex-1 sẽ tự động lấy toàn bộ khoảng trống còn lại */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
          {displayedProducts.map((product) => (
            <ProductFrame_Minh
              key={product.productId}
              image={product.mainImageUrl}
              productName={product.productName}
              basePrice={product.basePrice}
              sellingPrice={product.sellingPrice}
              isBestSeller={product.isBestSeller}
              discountPercent={product.discountPercent}
              productDetailSlug={product.slug}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryShowcase;
