import React from 'react'
import { Link} from 'react-router-dom'
import { useCategory } from '../contexts/CategoryContext';

const Racket = ({ productCategories }) => {
  const { setPageCatagory } = useCategory();
  return (
    <div className="top-full absolute left-0 w-full bg-white dark:bg-slate-900 shadow-xl border-t border-gray-100 dark:border-slate-700 z-50 py-8 px-10">
      <div className="container mx-auto grid grid-cols-4 gap-8">
        {productCategories.map((cat, index) => (
          <div key={index} className="space-y-3">
            {cat.brandTo ? (
              <Link
                onClick={() => {
                  setPageCatagory(cat.brand);
                }}
                to={cat.brandTo}
                className="block text-orange-600 font-bold text-[18px] border-b border-gray-200 dark:border-slate-700 pb-2 hover:text-orange-700 transition-colors"
              >
                {cat.brand}
              </Link>
            ) : (
              <h3 className="text-orange-600 font-bold text-[18px] border-b border-gray-200 dark:border-slate-700 pb-2">
                {cat.brand}
              </h3>
            )}
            <ul className="space-y-2">
              {cat.items.map((item, idx) =>
                typeof item === 'object' && item.to ? (
                  <li key={idx}>
                    <Link
                      onClick={() => {
                        setPageCatagory(item.label);
                      }}
                      to={item.to}
                      className="text-gray-600 dark:text-slate-400 text-sm hover:text-orange-500 cursor-pointer block"
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={idx} className="text-gray-600 text-sm hover:text-orange-500 cursor-pointer">
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Racket;