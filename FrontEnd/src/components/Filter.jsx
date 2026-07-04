import React, { memo, useState } from 'react';
import PriceFilter from './PriceFilter';
import ProductCategory from './ProductCategory';
import FlashButton from './FlashButton';
import Button from '../components/Button';

const Filter = memo(({ setRangePrice, rangePrice, brandList, items,isHasList,className }) => {
  const [isSetUp, setIsSetUp] = useState(false);
  return (
    <div className={`${className} flex flex-col text-black dark:text-white bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 dark:border-slate-700 rounded-lg select-none`}>
      <h1 className='text-3xl font-bold mb-8'>Bộ lọc</h1>      
      <h2 className='text-xl font-bold text-[#f15a22] pb-4'>Chọn mức giá</h2>
      <div className="flex flex-col gap-3 mb-6">
        {[
          { label: "Giá dưới 500.000đ", value: [0, 500000] },
          { label: "500.000đ - 1 triệu", value: [500000, 1000000] },
          { label: "1 - 2 triệu", value: [1000000, 2000000] },
          { label: "2 - 3 triệu", value: [2000000, 3000000] },
          { label: "Giá trên 3 triệu", value: [3000000, 10000000] },
        ].map((item, index) => (
          <label key={index} className="flex items-center cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name="price-filter"
                onChange={() => {
                  setRangePrice(item.value);
                  setIsSetUp(false);
                }}
                className={`peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded-full ${!isSetUp ? 'checked:border-orange-default' : ''} transition-all duration-200 dark:bg-slate-800`}
              />
              <div className={`absolute w-2.5 h-2.5 bg-orange-default rounded-full scale-0 ${!isSetUp? 'peer-checked:opacity-100 peer-checked:scale-100':''} 100 transition-transform duration-200`}></div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white">
              {item.label}
            </span>
          </label>
        ))}
      </div>
      <hr className="border-gray-200 dark:border-slate-700 mb-6 border-dashed" />
      <PriceFilter rangePrice={rangePrice} setRangePrice={setRangePrice} />
      <hr className="border-gray-200 dark:border-slate-700 my-6 border-dashed" />
      {isHasList &&
        <div className="flex flex-col gap-8">
          <ProductCategory 
            mainSub="Danh mục sản phẩm" 
            items={items}
            isSetUp={isSetUp}
          />        
          <ProductCategory 
            mainSub="Thương hiệu" 
            items={brandList} 
            isSetUp={isSetUp}
          />
        </div>
      }
      <div className='flex justify-center'>
        <Button 
          variant="search" 
          size="search" 
          className="p-4 w-full dark:bg-orange-default dark:hover:bg-orange-dark"
          onClick={() =>{
              setRangePrice([0, 10000000])
              setIsSetUp(true);
          }}
        >Đặt lại</Button>
      </div>

    </div>
  );
});

export default Filter;