import React, { useState, useEffect } from 'react';
import FlashButton from '../components/FlashButton';
import Button from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import { reviewApi } from '../api';

const getVariantLabel = (productName = "") => {
  const name = productName.toLowerCase().trim();

  if (name.includes("cước")) {
    return { type: "none", label:""};
  }

  // Vợt -> Cỡ cán
  if (name.includes("vợt")) {
    return { type: "grip", label: "Cỡ cán :" };
  }

  // Giày, áo, quần -> Size
  if (
    name.includes("giày") ||
    name.includes("áo") ||
    name.includes("quần")
  ) {
    return { type: "size", label: "Size" };
  }

  // Mặc định
  return { type: "none", label: "" };
};


const ProductDetail = (
) => {
  const { productSlug } = useParams();
  const [variantName, setVariantName] = useState('Cỡ cán: ')
const [loading, setLoading] = useState(true);
const {addToCart, fetchCart } = useCart();
const { getProductDetaildBySlug } = useProduct();
const [activeTab, setActiveTab] = useState('description');
const [quantity, setQuantity] = useState(1);
const [product, setProduct] = useState(null);
const [selectedImageOrder, setSelectedImageOrder] = useState(1);
const navigate = useNavigate();

const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
const [reviewPage, setReviewPage] = useState(1);
const [reviewTotalPages, setReviewTotalPages] = useState(1);
const [avgRating, setAvgRating] = useState(0);
const [reviewTotal, setReviewTotal] = useState(0);
const REVIEW_PAGE_SIZE = 5;

const tabs = [
  { id: 'description', label: 'Mô tả sản phẩm' },
  { id: 'specs', label: 'Thông số kỹ thuật' },
  { id: 'reviews', label: `Đánh giá${reviewTotal > 0 ? ` (${reviewTotal}) ${avgRating.toFixed(1)}⭐` : ''}` },
];



// Thêm state cho variant
const [selectedWeight, setSelectedWeight] = useState(null);
const [selectedGrip, setSelectedGrip] = useState(null);

useEffect(() => {
  const loadProduct = async () => {
    setLoading(true); // ✅ Thêm loading khi bắt đầu fetch
    try {
      const result = await getProductDetaildBySlug(productSlug);
      if (result) {
        setProduct(result);
        setVariantName(getVariantLabel(result.productName).label)        
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false); // ✅ Set loading false sau khi fetch xong
    }
  };
  loadProduct();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [productSlug]);

useEffect(() => {
  if (!product?.productId || activeTab !== 'reviews') return;
  setReviewsLoading(true);
  reviewApi.getByProduct(product.productId, reviewPage, REVIEW_PAGE_SIZE)
    .then(r => {
      const d = r.data;
      setReviews(d.items ?? []);
      setAvgRating(d.averageRating ?? 0);
      setReviewTotal(d.totalCount ?? 0);
      setReviewTotalPages(d.totalPages ?? 1);
    })
    .catch(() => {})
    .finally(() => setReviewsLoading(false));
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [product?.productId, activeTab, reviewPage]);

// ✅ Khởi tạo variant mặc định khi product load xong
useEffect(() => {
  if (product?.variants?.length > 0) {
    // Chỉ set nếu chưa có variant được chọn
    if (!selectedWeight || !selectedGrip) {
      setSelectedWeight(product.variants[0].weightClass);
      setSelectedGrip(product.variants[0].gripSize);
    }
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [product]);

// Helper functions với kiểm tra null an toàn
const weightOptions = [...new Set(product?.variants?.map(v => v.weightClass) ?? [])];
const gripOptions = [...new Set(product?.variants?.map(v => v.gripSize) ?? [])];

const isWeightAvailable = (w) => {
  if (!product?.variants) return false;
  return product.variants.some(v => v.weightClass === w && v.gripSize === selectedGrip);
};

const isGripAvailable = (g) => {
  if (!product?.variants) return false;
  return product.variants.some(v => v.gripSize === g && v.weightClass === selectedWeight);
};

// ✅ selectedVariant với fallback an toàn
const selectedVariant = product?.variants?.find(
  v => v.weightClass === selectedWeight && v.gripSize === selectedGrip
) || product?.variants?.[0]; // Fallback về variant đầu tiên nếu không tìm thấy


const handleSelectWeight = (w) => {
  if (!isWeightAvailable(w)) return;
  setSelectedWeight(w);
  // Fallback grip nếu combo không tồn tại
  if (!product.variants.find(v => v.weightClass === w && v.gripSize === selectedGrip)) {
    const fallback = product.variants.find(v => v.weightClass === w);
    if (fallback) setSelectedGrip(fallback.gripSize);
  }
};

const handleSelectGrip = (g) => {
  if (!isGripAvailable(g)) return;
  setSelectedGrip(g);
};

// ✅ Xử lý add to cart an toàn
const handleAddToCart = async () => {
  // Kiểm tra variant tồn tại
  if (!selectedVariant?.detailId) {
    alert('Vui lòng chọn phân loại sản phẩm!');
    return;
  }
  
  try {
    const result = await addToCart(selectedVariant.detailId, quantity);
    if (result) {
      fetchCart();
      setQuantity(1);
      alert('Đã thêm vào giỏ hàng!');
    }
  } catch (err) {
    console.error('Failed to add to cart:', err);
    alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại!');
  }
};

// ✅ Xử lý order an toàn
const handleOrder = () => {
  // Kiểm tra variant tồn tại
  if (!selectedVariant?.detailId) {
    alert('Vui lòng chọn phân loại sản phẩm!');
    return;
  }

  navigate("/cart", {
    state: {
      productItem: {
        detailId: selectedVariant.detailId,
        imageUrl: product.image,
        productName: product.productName,
        variantInfo: `${selectedVariant.weightClass} / ${selectedVariant.gripSize}`,
        quantity: quantity,
        unitPrice:selectedVariant.price,
        subTotal:selectedVariant.price * quantity,
      }
    }
  });
};
  if (loading) return <div className="text-center py-20 bg-white dark:bg-slate-950 dark:text-white min-h-screen">Đang tải sản phẩm...</div>;
  if (!product) return <div className="text-center py-20 bg-white dark:bg-slate-950 dark:text-white min-h-screen">Không tìm thấy sản phẩm</div>;
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen font-sans text-gray-800 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* BREADCRUMB */}

        {/* TOP SECTION: PRODUCT INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {/* Left: Images */}
          <div className='flex flex-col h-200'>
            <div className='flex-1 min-h-0 flex items-center justify-center p-4'>
              {product.imgaes
                .filter(img => img.displayOrder === selectedImageOrder)
                .map(img => {
                return (
                  <div key={img.imageID} className="border border-gray-100 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full h-full object-contain p-4 flex justify-center mb-4">
                    <img src={img.imageUrl} alt="Yonex BG80 Power" className="h-full w-full object-contain" />
                  </div>
                )
              })} 
            </div>         
            <div className='flex justify-center gap-3'>
              {product.imgaes.map(img => {
              return (
                  <div className="flex gap-3 overflow-x-auto" onMouseEnter={() => setSelectedImageOrder(img.displayOrder)}>
                    <img src={img.imageUrl} className="w-20 h-20 border dark:border-slate-600 rounded-lg p-1 shrink-0 cursor-pointer hover:border-orange-500 dark:bg-slate-800" />
                  </div>
              )
            })}
            </div>
          </div>

          {/* Right: Summary & Order */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 leading-snug">
              {product.productName}
            </h1>            
            <div className="flex gap-6 text-sm mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
              <p>Xuất xứ: <span className="font-bold text-gray-900 dark:text-white">Nhật Bản</span></p>
              <p>Tình trạng: {
                !selectedVariant.inStock ? <span className="bg-red-50 dark:bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs border border-red-100 dark:border-red-500/30">Hết hàng</span> : <span className="bg-green-50 dark:bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs border border-green-100 dark:border-green-500/30">Còn hàng</span>
                  }</p>
            </div>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-orange-500">{selectedVariant.price}</span>
            </div>

            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/30 rounded-xl p-4 text-orange-800 dark:text-orange-300 mb-8">
              Liên hệ hotline <span className="font-bold">038.2350.127</span> để được tư vấn và đặt hàng nhanh nhất!
            </div>
            {/* Variant Selector */}
        <div className="mb-6 space-y-5">
          {/* Weight Class */}
          {weightOptions[0] && <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Trọng lượng: <span className="text-gray-900 dark:text-white">{selectedWeight}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {weightOptions.map(w => {
                const avail = isWeightAvailable(w);
                return (
                  <button
                    key={w}
                    onClick={() => handleSelectWeight(w)}
                    disabled={!avail}
                    className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all
                      ${selectedWeight === w
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                        : avail
                          ? 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-400'
                          : 'border-gray-100 dark:border-slate-700 text-gray-300 dark:text-slate-600 line-through cursor-not-allowed'
                      }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>}

      {/* Grip Size */}
      {variantName !=="" && <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          {variantName}<span className="text-gray-900 dark:text-white pl-2">{selectedGrip}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {gripOptions.map(g => {
            const avail = isGripAvailable(g);
            return (
              <button
                key={g}
                onClick={() => handleSelectGrip(g)}
                disabled={!avail}
                className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all
                  ${selectedGrip === g
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                    : avail
                      ? 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-400'
                      : 'border-gray-100 dark:border-slate-700 text-gray-300 dark:text-slate-600 line-through cursor-not-allowed'
                  }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>}


      {/* Thông tin variant được chọn */}
      {selectedVariant && (
        <div className="flex flex-wrap gap-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
          {selectedVariant.balancePoint && <span>Cân bằng: <strong className="text-gray-800 dark:text-white">{selectedVariant.balancePoint}</strong></span>}
          {selectedVariant.stiffness && <span>Độ cứng: <strong className="text-gray-800 dark:text-white">{selectedVariant.stiffness}</strong></span>}
          {selectedVariant.maxTension && <span>Căng max: <strong className="text-gray-800 dark:text-white">{selectedVariant.maxTension} lbs</strong></span>}
          {selectedVariant.stockQuantity && <span>Tồn kho: <strong className="text-gray-800 dark:text-white">{selectedVariant.stockQuantity} cái</strong></span>}
        </div>
      )}
    </div>

            <div className="flex items-center gap-6 mb-8">
              <span className="font-medium">Số lượng:</span>
              <div className="flex items-center border dark:border-slate-600 rounded-full px-4 py-2 w-32 justify-between dark:text-white">
                <button onClick={() => setQuantity(Math.max(1, quantity-1))}>-</button>
                <span className="font-bold">{quantity < 10 ? `0${quantity}` : quantity}</span>
                <button onClick={() => setQuantity(Math.min(quantity+1, selectedVariant.stockQuantity))}>+</button>
              </div>
            </div>
            {selectedVariant.inStock?
                <div className='flex gap-4'>
                <Button 
                onClick={() => {
                  handleAddToCart();
                }}
                className={`w-50 rounded-2xl text-white bg-orange-default hover:bg-orange-dark`}>
                  Thêm vào giỏ
                </Button>
                <Button 
                onClick={() => handleOrder()}
                className={`w-50 rounded-2xl text-white bg-orange-default hover:bg-orange-dark`} >
                  Mua ngay
                </Button>
              </div>
              : <Button className={`w-50 rounded-2xl bg-gray-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:cursor-not-allowed`} disabled={true}>
                  Đang hết hàng
              </Button>
            }
          </div>
        </div>

        {/* BOTTOM SECTION: TABS & CONTENT */}
        <div className="mt-12 bg-[#FFF7F2] dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-orange-50 dark:border-slate-700">
          {/* Tab Headers */}
          <div className="flex flex-wrap gap-4 mb-8 border-b border-orange-100 dark:border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-4 font-bold text-lg transition-all relative ${
                  activeTab === tab.id
                  ? 'text-orange-600 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-orange-500'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="text-gray-700 dark:text-slate-300 leading-relaxed text-lg">
            {activeTab === 'description' && (
              <div className="space-y-6 animate-fadeIn">
                <p>
                  <span className="font-bold text-red-600">Cước đan vợt cầu lông Yonex BG80 Power JP</span> từ lâu đã khẳng định được vị thế của mình...
                </p>
                <p>Với độ cứng đặc trưng và âm thanh nổ đanh thép, sợi cước này không chỉ mang lại cảm giác cầu chân thực...</p>
                
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">1. Giới thiệu cước đan vợt cầu lông Yonex BG80 Power JP</h2>
                <p>Cước đan vợt cầu lông Yonex BG80 Power JP là phiên bản nâng cấp hoàn hảo của dòng BG80 huyền thoại...</p>
                
                <div className="my-8 rounded-2xl overflow-hidden shadow-sm">
                  <img src="https://fbshop.vn/wp-content/uploads/2023/04/bg-80-power-jp-1.jpg" alt="Mô tả" className="w-full" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">3. Công nghệ tích hợp</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Công nghệ Multi Filament:</strong> Giúp sợi dây có độ đàn hồi cực cao...</li>
                  <li><strong>Pha sợi Vectran:</strong> Tăng cường độ cứng cho dây, giữ sức căng ổn định...</li>
                </ul>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="animate-fadeIn space-y-4 max-w-2xl">
                <div className="flex justify-between border-b dark:border-slate-700 py-3">
                  <span className="font-medium text-gray-500 dark:text-slate-400">Mã sản phẩm</span>
                  <span className="font-bold dark:text-white">BG 80 POWER (Mã JP)</span>
                </div>
                <div className="flex justify-between border-b dark:border-slate-700 py-3">
                  <span className="font-medium text-gray-500 dark:text-slate-400">Đường kính dây</span>
                  <span className="font-bold dark:text-white">0.68 mm</span>
                </div>
                <div className="flex justify-between border-b dark:border-slate-700 py-3">
                  <span className="font-medium text-gray-500 dark:text-slate-400">Chiều dài</span>
                  <span className="font-bold dark:text-white">10 mét</span>
                </div>
                <div className="flex justify-between border-b dark:border-slate-700 py-3">
                  <span className="font-medium text-gray-500 dark:text-slate-400">Cảm giác đánh</span>
                  <span className="font-bold text-red-600">Cứng (Hard Feeling)</span>
                </div>
                <div className="flex justify-between border-b dark:border-slate-700 py-3">
                  <span className="font-medium text-gray-500 dark:text-slate-400">Nguồn gốc</span>
                  <span className="font-bold dark:text-white">Nhật Bản</span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-fadeIn space-y-4">
                {reviewsLoading ? (
                  <div className="py-20 text-center text-gray-400 dark:text-slate-500">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 dark:text-slate-500">Chưa có đánh giá nào cho sản phẩm này.</div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 pb-3 border-b dark:border-slate-700">
                      <span className="text-3xl font-black text-slate-800 dark:text-white">{avgRating.toFixed(1)}</span>
                      <div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`text-lg ${s <= Math.round(avgRating) ? 'text-amber-400' : 'text-gray-300 dark:text-slate-600'}`}>★</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{reviewTotal} đánh giá</p>
                      </div>
                    </div>
                    {reviews.map(rv => (
                      <div key={rv.reviewId} className="border-b dark:border-slate-700 py-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-800 dark:text-white">{rv.userName}</span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {new Date(rv.reviewDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`text-sm ${s <= rv.rating ? 'text-amber-400' : 'text-gray-300 dark:text-slate-600'}`}>★</span>
                          ))}
                        </div>
                        {rv.comment && <p className="text-sm text-slate-700 dark:text-slate-300">{rv.comment}</p>}
                        {rv.images?.length > 0 && (
                          <div className="flex gap-2 flex-wrap pt-1">
                            {rv.images.map((img, i) => (
                              <img key={i} src={img} alt="" className="h-16 w-16 object-cover rounded-lg border dark:border-slate-700" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {reviewTotalPages > 1 && (
                      <div className="flex gap-2 justify-center pt-2">
                        <button disabled={reviewPage === 1} onClick={() => setReviewPage(p => p - 1)}
                          className="px-3 py-1 text-sm rounded-lg border dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
                          ‹
                        </button>
                        <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">{reviewPage} / {reviewTotalPages}</span>
                        <button disabled={reviewPage === reviewTotalPages} onClick={() => setReviewPage(p => p + 1)}
                          className="px-3 py-1 text-sm rounded-lg border dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
                          ›
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab(activeTab === 'description' ? '' : 'description')}
            className="mt-10 mx-auto block text-orange-500 font-bold border-b border-orange-500 hover:text-orange-700 transition-colors">
            {activeTab ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;