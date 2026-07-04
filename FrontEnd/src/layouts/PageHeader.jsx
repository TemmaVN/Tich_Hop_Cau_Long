import React, { useEffect, useState, useRef } from 'react'
import { ArrowLeft, LogOut, MenuIcon, Moon, Search, ShoppingCart, Sun, Tag, User2 } from 'lucide-react'
import Button from '../components/Button'
import {useMediaQuery} from '../mystate/useMediaQuery'
import MenuHeader from './MenuHeader'
import { Link } from 'react-router-dom'
import {useAuth} from  "../contexts/AuthContext"
import {useNavigate} from "react-router-dom"
import CartDrawer from './CartDrawer'
import { useCart } from '../contexts/CartContext'
import { productApi } from '../api'
import { useTheme } from '../contexts/ThemeContext'
import Logo from '../Logo/Logo.jpg'

const formatPrice = (price) => {
  if (!price || price <= 0) return null;
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};

const PageHeader = () => {
  const [isFocus, setIsFocus] = useState(false);
  const [showFullWidthSearch, setShowFullWidthSearch] = useState(false);
  const [showMenuBar, setShowMenuBar] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const isHideMainHeader = useMediaQuery("(min-width: 1250px)");
  const isPageMedium = useMediaQuery("(min-width: 768px)");
  const isShowFullWidthSearch = !isPageMedium && showFullWidthSearch;

  const {isAuthenticated, logout} = useAuth();
  const navigate = useNavigate();

  const { totalItems } = useCart();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await productApi.search({
          keyword: searchQuery.trim(),
          pageSize: 6,
        });
        const items = res.data?.items ?? [];
        setSearchResults(items);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setShowDropdown(false);
    navigate(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleResultClick = (slug) => {
    setShowDropdown(false);
    setSearchQuery("");
    navigate(`/p/${slug}`);
  };

  const handleLogout = async (e) => {
    e.preventDefault();

    const result = await logout();

    if (result.success) {
      alert("Đăng xuất thành công");
      navigate("/");
    } else {
      alert(result.message);
    }
  };

  return (
    <div className='flex flex-col relative'>
      <div className='flex gap-10 justify-center lg:gap-20 pt-4 pb-6 px-4 z-120 bg-white dark:bg-slate-950'>
        {!isHideMainHeader && (
          <Button size='icon' onClick={() => setShowMenuBar(!showMenuBar)}>
            {showMenuBar ? "Close" : <MenuIcon/>}
          </Button>
        )}
        {!isShowFullWidthSearch && (
          <div>
            <Link to="/">
              <img src={Logo} alt="" className='w-12 h-12'/>
            </Link>
          </div>
        )}
        {isShowFullWidthSearch && (
          <Button size='icon' onClick={() => setShowFullWidthSearch(false)}>
            <ArrowLeft/>
          </Button>
        )}
        <div
          ref={searchRef}
          className={`relative grow max-w-225 ${isShowFullWidthSearch ? "flex" : "md:flex hidden"}`}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className={`bg-gray-bg dark:bg-slate-800 rounded-[10px] w-full flex items-center ${isFocus ? 'border border-orange-default shadow-inner' : ''}`}
          >
            <Button variant="ghost" size="icon" type="button">
              <Search />
            </Button>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocus(true);
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              onBlur={() => setIsFocus(false)}
              className='py-1 px-4 text-lg outline-none text-gray-text dark:text-slate-300 dark:placeholder:text-slate-500 flex-1 bg-transparent'
            />
            <Button variant="find" size="find" type="submit">
              {!isShowFullWidthSearch ? "Tìm kiếm" : <Search />}
            </Button>
          </form>

          {showDropdown && (
            <div className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-200 overflow-hidden'>
              {isSearching ? (
                <div className='px-4 py-3 text-sm text-gray-500 dark:text-slate-400'>Đang tìm kiếm...</div>
              ) : searchResults.length === 0 ? (
                <div className='px-4 py-3 text-sm text-gray-500 dark:text-slate-400'>Không tìm thấy sản phẩm</div>
              ) : (
                <>
                  {searchResults.map((product, idx) => {
                    const price = product.sellingPrice > 0 ? product.sellingPrice : product.basePrice;
                    const formattedPrice = formatPrice(price);
                    return (
                      <div
                        key={product.id ?? idx}
                        onMouseDown={() => handleResultClick(product.slug)}
                        className='flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-b-0'
                      >
                        <div className='w-14 h-14 shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-slate-700'>
                          {product.mainImageUrl ? (
                            <img
                              src={product.mainImageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                        <div className='flex flex-col min-w-0'>
                          <span className='text-sm font-medium text-gray-800 dark:text-slate-200 line-clamp-2 leading-snug'>
                            {product.productName}
                          </span>
                          <span className="text-sm font-semibold text-red-500 mt-0.5">
                            {formattedPrice ?? "Liên hệ"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    onMouseDown={handleSearch}
                    className='px-4 py-2.5 text-center text-sm text-orange-500 font-semibold hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer border-t border-gray-100 dark:border-slate-700'
                  >
                    Xem tất cả kết quả cho "{searchQuery}"
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {!isShowFullWidthSearch && (
          <div className='flex gap-2'>
            <Button size='icon' className='md:hidden' onClick={() => setShowFullWidthSearch(true)}>
              <Search/>
            </Button>
            <Button
              size='icon'
              onClick={toggleTheme}
              title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            >
              {isDark ? <Sun size={20}/> : <Moon size={20}/>}
            </Button>
            <Link to="/khuyen-mai" title="Khuyến mãi & Voucher">
              <Button size='icon'>
                <Tag size={20} />
              </Button>
            </Link>
            <Link to={isAuthenticated ? "/user-info" : "/login"}>
              <Button size='icon'>
                {isAuthenticated
                  ? <img src="https://static.fbshop.vn/template/assets/images/im-des.png" className='rounded-full'/>
                  : <User2/>}
              </Button>
            </Link>
            {isAuthenticated && (
              <Button
                size='icon'
                onClick={() => setShowCartDrawer(true)}
                className="relative"
              >
                <ShoppingCart />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Button>
            )}
            {isAuthenticated && (
              <Button size='icon'>
                <Link to="/login" onClick={handleLogout}>
                  <LogOut/>
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
      {!isHideMainHeader && showMenuBar && (
        <div className='absolute top-full left-0 z-100 bg-white dark:bg-slate-900 dark:border-slate-700 w-max-200 shadow-lg border'>
          <MenuHeader isOpen={showMenuBar} setIsOpen={setShowMenuBar}/>
        </div>
      )}
      {showCartDrawer && (
        <div className='absolute top-0 left-0 z-150 bg-white dark:bg-slate-900 dark:border-slate-700 w-max-200 shadow-lg border'>
          <CartDrawer isOpen={showCartDrawer} setIsOpen={setShowCartDrawer}/>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
