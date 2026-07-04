import React, { useState } from 'react';
import Filter from '../components/Filter';
import { useMediaQuery } from '../mystate/useMediaQuery';
import FilterDrawer from '../components/DrawerFilter';
import { ChevronDown, FilterIcon, Search } from 'lucide-react';
import  Button  from '../components/Button';

const Sales = () => {
  const brandList = [
    "Yonex", "Victor", "Lining", "Lefus", "Kamito", "Mizuno", 
    "Kawasaki", "Kumpoo", "Proace", "Apacs", "Kizuna", "Aolikes",
    "Ashaway", "Zubon", "Forza", "Felet", "Fleet"
  ];
  const defaultItems = ["Vợt cầu lông", "Giày cầu lông", "Balo cầu lông", "Bao vợt cầu lông", "Quần áo cầu lông", "Phụ kiện Aolikes - Fbshop", "Quả Cầu Lông"];
  const [rangePrice, setRangePrice] = useState([0, 10000000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMediumScreen = useMediaQuery('(min-width: 1025px)');
  const isSmallScreen = useMediaQuery('(max-width: 850px)');
  return (
    <div className="min-h-screen text-[#333]">
      <FilterDrawer
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
        rangePrice={rangePrice}
        setRangePrice={setRangePrice}
      />
      <div className="container max-w-350 mx-auto px-4 py-8">
        <div className="flex gap-8">
          {isMediumScreen && <Filter 
            rangePrice={rangePrice} 
            setRangePrice={setRangePrice} 
            brandList={brandList}
            items={defaultItems}
            isHasList={true}
            className="w-100 shrink-0" 
          />}
          <div className="flex-1">
            <div className="flex flex-col justify-between mb-8 pb-4 border-b border-gray-100 gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Giảm Giá</h1>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">0 sản phẩm</span>
              </div>
              <div className={`flex items-center justify-between gap-4 ${isSmallScreen ? 'flex-col items-start' : ''}`}>
              <div className={`flex items-center flex-1 max-w-2xl ${isSmallScreen ? 'w-full' : ''}`}>
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search/>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm sản phẩm..." 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-l-lg text-sm bg-white focus:border-[#f15a22] focus:ring-1 focus:ring-[#f15a22] transition outline-none"
                  />
                </div>
                <Button variant='find' size='find' className='px-6 py-3 rounded-r-lg '>Tìm kiếm</Button>
              </div>
              {!isMediumScreen && <Button
                variant='filter'
                size='filter'
                onClick={() => setIsFilterOpen(true)} 
                className={`${isSmallScreen ? 'w-full justify-center' : 'mx-4 '}`}>
                  {<FilterIcon/>}
                  Bộ lọc
                </Button>}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-medium text-gray-600 ${isMediumScreen ? 'mx-4' : ''}`}>Sắp xếp:</span>
                <div className="relative">
                  <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2 text-sm font-medium focus:ring-1 focus:ring-[#f15a22] outline-none cursor-pointer text-gray-800">
                    <option>Mặc định</option>
                    <option>Giá thấp đến cao</option>
                    <option>Giá cao đến thấp</option>
                    <option>Mới nhất</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown/>
                  </span>
                </div>
              </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-24 pb-32 text-center 
              /* Tùy chỉnh Scrollbar qua Tailwind Arbitrary Variants trực tiếp */
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-gray-100
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              [&::-webkit-scrollbar-thumb]:rounded-full
              hover:[&::-webkit-scrollbar-thumb]:bg-[#f15a22]">
              
              <h3 className="text-xl font-bold text-gray-800">Chưa có sản phẩm nào trong danh sách giảm giá.</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;