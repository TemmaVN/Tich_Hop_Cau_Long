import React from 'react';
import MyCheckBox from './MyCheckBox';
import { useState, useEffect } from 'react';

const ProductCategory = ({ mainSub, items = [],isSetUp }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  useEffect(() => {
    if (isSetUp) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedItems([]);
    }
  }, [isSetUp]);
  const handleToggle = (itemValue) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemValue)) {
        return prev.filter(i => i !== itemValue);
      }
      return [...prev, itemValue];
    });
  };
  return (
    <div className="w-full">
      <h2 className="text-[#f15a22] text-lg font-bold mb-4">{mainSub}</h2>
      
      <div className="flex flex-col max-h-62.5 overflow-y-auto pr-2 
        /* Tùy chỉnh Scrollbar qua Tailwind Arbitrary Variants */
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-gray-100
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-[#f15a22]">
        
        {items.map((item, index) => (
          <MyCheckBox 
            key={index} 
            id={`${mainSub}-${index}`} 
            data={item} 
            className="font-medium"
            isChecked={selectedItems.includes(item)}
            onCheck={() => handleToggle(item)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCategory;