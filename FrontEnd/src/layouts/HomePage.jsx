import React, { useEffect, useState } from "react";
import Advertisement from "../components/Advertisement";
import { useCategory } from "../contexts/CategoryContext";
import { productApi } from "../api";
import CategoryShowcase from "../components/CategoryShowcase";
import { ChevronDown } from "lucide-react"; // Import icon để làm hiệu ứng

// SVG Quả cầu lông
const ShuttlecockSVG = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M12 16 8.5 4 5 2h14l-3.5 2L12 16Z" />
    <path d="M7 8h10" />
    <path d="M9 12h6" />
    <path d="M12 16V2" />
  </svg>
);

// SVG Vợt cầu lông
const RacketSVG = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <ellipse cx="12" cy="7" rx="4.5" ry="6" />
    <line x1="12" y1="13" x2="12" y2="19" />
    <line x1="12" y1="19" x2="12" y2="23" strokeWidth="2.5" />
    <line x1="8.5" y1="5" x2="15.5" y2="5" strokeWidth="0.5" />
    <line x1="7.5" y1="7" x2="16.5" y2="7" strokeWidth="0.5" />
    <line x1="8.5" y1="9" x2="15.5" y2="9" strokeWidth="0.5" />
    <line x1="10" y1="1.5" x2="10" y2="12.5" strokeWidth="0.5" />
    <line x1="12" y1="1" x2="12" y2="13" strokeWidth="0.5" />
    <line x1="14" y1="1.5" x2="14" y2="12.5" strokeWidth="0.5" />
  </svg>
);

// TẠO COMPONENT HIỆU ỨNG TRANG TRÍ CHUYỂN ĐỘNG 2 BÊN VIỀN
const AnimatedSideDecoration = ({ side }) => {
  // Tạo mảng 16 phần tử tương ứng với 16 lớp icon xếp chồng lên nhau
  const items = Array.from({ length: 16 });
  const isLeft = side === "left";

  return (
    <div
      // Chỉ hiện ở màn hình lớn (xl:flex), đặt absolute cố định ở 2 bên mép
      className={`absolute top-[18%] pointer-events-none hidden xl:flex ${
        isLeft ? "left-2 2xl:left-10" : "right-2 2xl:right-10"
      }`}
    >
      {/* Cột 1 */}
      <div className="flex flex-col -space-y-6">
        {items.map((_, i) => (
          <ChevronDown
            key={`c1-${i}`}
            size={48} // Kích thước to ngang
            className="animate-flowing-arrows"
            style={{
              // Làm mờ dần về phía cuối dải
              opacity: Math.max(0, 1 - i * 0.06),
              // Độ trễ chuyển động nối tiếp nhau tạo thành làn sóng mượt mà hơn
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// TẠO COMPONENT QUẢ CẦU LÔNG VÀ VỢT BAY LƠ LỬNG
const FloatingBadmintonDeco = ({ side }) => {
  const isLeft = side === "left";
  return (
    <div
      className={`absolute top-[25%] bottom-[10%] pointer-events-none hidden xl:flex flex-col justify-around ${
        isLeft ? "left-10 2xl:left-24" : "right-10 2xl:right-24"
      }`}
    >
      <div
        className="animate-float-slow opacity-[0.15] text-orange-500"
        style={{ animationDelay: "0s" }}
      >
        <ShuttlecockSVG
          className={`w-20 h-20 ${isLeft ? "rotate-15" : "-rotate-15"}`}
        />
      </div>
      <div
        className="animate-float-fast opacity-[0.12] text-orange-600"
        style={{ animationDelay: "1.5s" }}
      >
        <RacketSVG
          className={`w-24 h-24 ${isLeft ? "rotate-[-30deg]" : "rotate-30"}`}
        />
      </div>
      <div
        className="animate-float-slow opacity-20 text-orange-400"
        style={{ animationDelay: "0.8s" }}
      >
        <ShuttlecockSVG
          className={`w-16 h-16 ${isLeft ? "rotate-75" : "-rotate-75"}`}
        />
      </div>
    </div>
  );
};

const HomePage = () => {
  const linkAdvertisement = [
    "https://static.fbshop.vn/wp-content/uploads/2025/12/mua-do.png",
    "https://static.fbshop.vn/wp-content/uploads/2025/12/he-thong-cau-long.png",
    "https://static.fbshop.vn/wp-content/uploads/2024/01/Banner-website-4-min.webp",
    "https://static.fbshop.vn/wp-content/uploads/2024/01/Banner-website-6-min.webp",
    "https://static.fbshop.vn/wp-content/uploads/2026/01/anh-banner-website-4000x1425-1-1920x684.jpg",
  ];

  const { categories } = useCategory();
  const [homeProducts, setHomeProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.getHomeProducts();
        const allProducts = response.data.data || [];
        const groupedProducts = allProducts.reduce((acc, product) => {
          const { categoryName } = product;
          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }
          acc[categoryName].push(product);
          return acc;
        }, {});
        setHomeProducts(groupedProducts);
      } catch (error) {
        console.error("Failed to fetch home products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  console.log(categories)

  const categoryImages = {
    "Vợt cầu lông":
      "https://static.fbshop.vn/wp-content/uploads/2024/01/Artboard-5-copy-2@2x.webp",
    "Giày cầu lông":
      "https://static.fbshop.vn/wp-content/uploads/2024/01/Banner-website-balo.webp",
    "Balo cầu lông":
      "https://res.cloudinary.com/dfbelvtzh/image/upload/v1780300391/Artboard-5-copy-3_2x_f1xdfi.webp",
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950 text-gray-800 dark:text-white">
        Đang tải...
      </div>
    );
  }

  return (
    // Wrap toàn bộ bằng relative overflow-hidden để mỏ neo cho cái Decoration
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* CSS KEYFRAMES CHO HIỆU ỨNG SÓNG CHUYỂN ĐỘNG */}
      <style>
        {`
          @keyframes flowing-arrows {
            /* scaleY(0.4) giúp ép dẹt hình chữ V tạo thành vạch xiên giống ảnh */
            0%, 100% { transform: translateY(0) scaleY(0.4); color: #fdba74; } /* Cam nhạt */
            50% { transform: translateY(8px) scaleY(0.4); color: #ea580c; } /* Cam đậm */
          }
          .animate-flowing-arrows {
            animation: flowing-arrows 2s infinite ease-in-out;
          }

          /* Hiệu ứng bay lơ lửng cho quả cầu / vợt */
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          .animate-float-slow {
            animation: float 5s ease-in-out infinite;
          }
          .animate-float-fast {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>

      <Advertisement linkAdvertisement={linkAdvertisement} />

      <div className="relative bg-gray-50 dark:bg-slate-950 py-1">
        {/* RENDER DẢI TRANG TRÍ CHẠY DỌC 2 BÊN */}
        <AnimatedSideDecoration side="left" />
        <AnimatedSideDecoration side="right" />

        {/* RENDER HIỆU ỨNG CẦU LÔNG VÀ VỢT */}
        <FloatingBadmintonDeco side="left" />
        <FloatingBadmintonDeco side="right" />

        {/* Nội dung danh sách sản phẩm */}
        {categories.map((category) => {
          const productsForCategory = homeProducts[category.categoryName];
          if (!productsForCategory || productsForCategory.length === 0) {
            return null;
          }
          return (
            <CategoryShowcase
              key={category.categoryId}
              category={category}
              products={productsForCategory}
              categoryImage={
                categoryImages[category.categoryName] ||
                "https://images.unsplash.com/photo-1599481238640-4c12727c393a?w=500&q=80"
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
