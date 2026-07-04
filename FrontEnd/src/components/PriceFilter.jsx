import { useEffect, useState } from "react";
import * as Slider from "@radix-ui/react-slider";

const PriceFilter = ({ rangePrice, setRangePrice }) => {
  const [localRange, setLocalRange] = useState(rangePrice);
  useEffect(() => {
    if (
      rangePrice &&
      (rangePrice[0] !== localRange[0] || rangePrice[1] !== localRange[1])
    ) {
      setLocalRange(rangePrice);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangePrice]);
  return (
    <div className="w-full max-w-sm p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
      <h3 className="text-[#f15a22] font-bold mb-8 text-lg">
        Hoặc chọn khoảng giá:
      </h3>

      <div className="px-2 mb-10">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={localRange}
          onValueChange={(newValue) => setLocalRange(newValue)}
          onValueCommit={(newValue) => setRangePrice(newValue)}
          max={10000000}
          step={50000}
          minStepsBetweenThumbs={10}
        >
          <Slider.Track className="bg-gray-200 dark:bg-slate-600 relative grow rounded-full h-2">
            <Slider.Range className="absolute bg-[#f15a22] rounded-full h-full" />
          </Slider.Track>

          <Slider.Thumb
            className="block w-6 h-6 bg-white dark:bg-slate-700 border-2 border-[#f15a22] shadow-lg rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing"
            aria-label="Giá thấp nhất"
          />

          <Slider.Thumb
            className="block w-6 h-6 bg-white dark:bg-slate-700 border-2 border-[#f15a22] shadow-lg rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing"
            aria-label="Giá cao nhất"
          />
        </Slider.Root>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex items-center w-full">
          <span className="absolute left-3 text-gray-400 dark:text-slate-500 text-xs">Từ</span>
          <div className="w-full pl-8 pr-6 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-right font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-700">
            {localRange[0].toLocaleString()}{" "}
            <span className="text-[10px] ml-1">đ</span>
          </div>
        </div>

        <span className="text-gray-300 dark:text-slate-600">-</span>

        <div className="relative flex items-center w-full">
          <span className="absolute left-3 text-gray-400 dark:text-slate-500 text-xs">Đến</span>
          <div className="w-full pl-8 pr-6 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-right font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-700">
            {localRange[1].toLocaleString()}{" "}
            <span className="text-[10px] ml-1">đ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceFilter;
