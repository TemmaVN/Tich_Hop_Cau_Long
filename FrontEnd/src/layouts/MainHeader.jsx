import React, { useState, useEffect } from 'react';
import Racket from '../components/Racket';
import { Link } from 'react-router-dom';
import { brandApi } from '../api';
import { useCategory } from '../contexts/CategoryContext';

const slugify = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ACCESSORY_SLUG = 'phu-kien';

const ACCESSORY_MENU = {
  label: 'PHỤ KIỆN',
  slug: ACCESSORY_SLUG,
  productCategories: [
    {
      brand: 'QUẤN CÁN VỢT',
      items: ['Quấn cán Yonex AC102EX', 'Quấn cán vải mỏng', 'Quấn cán lỗ thoáng khí', 'Quấn cán Lining/Victor', 'Quấn cán overgrip'],
    },
    {
      brand: 'CƯỚC CẦU LÔNG',
      items: ['Cước Yonex BG65/65Ti', 'Cước Yonex BG80/80P', 'Cước Lining No.1/No.7', 'Cước Victor VBS-66N', 'Cước Aerobite Boost'],
    },
    {
      brand: 'PHỤ KIỆN KHÁC',
      items: ['Băng chặn mồ hôi', 'Tất (vớ) chuyên dụng', 'Bột quấn cán', 'Móc khóa cầu lông', 'Cầu lông lông vũ/nhựa'],
    },
  ],
};

const MainHeader = () => {
  const [isProductHovered, setIsProductHovered] = useState(false);
  const [currentProduct, setCurrentProduct] = useState([]);
  const [page, setPage] = useState('home');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { categories, refreshCategories, setPageCatagory } = useCategory();
  const [brandList, setBrandList] = useState([]);

  const fetchBrands = async () => {
    try {
      const response = await brandApi.getAll();
      setBrandList(response.data.data || []);
    } catch (err) {
      console.error('Không thể tải thương hiệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    refreshCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!categories.length) return;

    const filtered = categories.filter(cat => cat.slug !== ACCESSORY_SLUG);
    const mainCats = filtered.slice(0, 3);
    const extraCats = filtered.slice(3);

    const buildBrandColumns = (cat) => {
      const catName = cat.categoryName ?? '';
      const shortCat = catName.split(' ')[0];
      return brandList.map(brand => {
        const bSlug = brand.slug ?? slugify(brand.brandName ?? '');
        return {
          brand: `${catName.toUpperCase()} ${(brand.brandName ?? '').toUpperCase()}`,
          brandTo: `/${cat.slug}/${bSlug}`,
          items: [
            { label: `Dòng ${shortCat.toLowerCase()} ${brand.brandName}`, to: `/${cat.slug}/${bSlug}` },
            { label: `${shortCat} ${brand.brandName} bán chạy`, to: `/${cat.slug}/${bSlug}?isBestSeller=true` },
            { label: `${shortCat} ${brand.brandName} khuyến mãi`, to: `/${cat.slug}/${bSlug}?voucher=true` },
          ],
        };
      });
    };

    const built = mainCats.map(cat => ({
      label: (cat.categoryName ?? '').toUpperCase(),
      slug: cat.slug,
      productCategories: buildBrandColumns(cat),
    }));

    // Extra categories (4+) go into PHỤ KIỆN dropdown alongside static accessories
    const extraColumns = extraCats.map(cat => ({
      brand: (cat.categoryName ?? '').toUpperCase(),
      brandTo: `/${cat.slug}`,
      items: brandList.map(brand => ({
        label: `${cat.categoryName} ${brand.brandName}`,
        to: `/${cat.slug}/${brand.slug ?? slugify(brand.brandName ?? '')}`,
      })),
    }));

    built.push({
      ...ACCESSORY_MENU,
      productCategories: [...extraColumns, ...ACCESSORY_MENU.productCategories],
    });

    setMenuItems(built);
  }, [categories, brandList]);

  return (
    <nav
      className="relative bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 font-sans flex justify-center"
      onMouseLeave={() => setIsProductHovered(false)}
    >
      <div className="container shadow-md border border-gray-200 dark:border-slate-700 flex grow max-w-325 items-center justify-center">
        <div className="flex space-x-15 uppercase text-sm font-bold py-4">
          <Link
            onClick={() => setPage('home')}
            to="/"
            className={`pb-3 border-orange-500 hover:text-orange-500 hover:border-b-2 ${
              page === 'home' ? 'text-orange-500 border-b-2' : ''
            }`}
          >
            Trang chủ
          </Link>

          {!loading &&
            menuItems.map(({ label, slug, productCategories }) => (
              <Link
                to={`/${slug}`}
                key={slug}
                onClick={() => {
                  setPageCatagory(label);
                  setPage(label);
                }}
                className={`pb-3 border-orange-500 hover:text-orange-500 hover:border-b-2 ${page === label ? 'text-orange-500 border-b-2' : ''}`}
                onMouseEnter={() => {
                  setCurrentProduct(productCategories);
                  setIsProductHovered(true);
                }}
              >
                {label} <span className="text-[10px]">▼</span>
              </Link>
            ))}

          <Link
            to="/sales"
            onClick={() => setPage('sale')}
            className={`hover:text-orange-500 pb-3 hover:border-b-2 border-orange-500 ${
              page === 'sale' ? 'text-orange-500 border-b-2' : ''
            }`}
          >
            GIẢM GIÁ
          </Link>
          <Link
            to="/contract"
            onClick={() => setPage('contract')}
            className={`hover:text-orange-500 pb-3 hover:border-b-2 border-orange-500 ${
              page === 'contract' ? 'text-orange-500 border-b-2' : ''
            }`}
          >
            Liên hệ
          </Link>

        </div>
      </div>
      {isProductHovered && <Racket productCategories={currentProduct} />}
    </nav>
  );
};

export default MainHeader;
