import React, { useEffect, useState } from "react";
import Button from "./Button";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";


const Advertisement = ({linkAdvertisement}) => {
  const [countAd,setCountAd] = useState(0);
  const length = linkAdvertisement.length;
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCountAd((prev) => (prev + 1) % length);
    }, 3000);

    return () => clearInterval(slideTimer);
  }, [length]);
  return (
    <div className="w-full overflow-hidden relative group">
      <div
        className={`flex ${countAd == 0 ? "" : "transition-transform duration-700"} ease-in-out`}
        style={{ transform: `translateX(-${countAd * 100}%)` }}
      >
        {linkAdvertisement.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`ad ${index}`}
            className="w-full shrink-0 object-cover "
          />
        ))}
      </div>
      <div className="absolute inset-0 flex justify-between items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          className="text-orange-dark hover:bg-orange-400"
          onClick={() => setCountAd((countAd - 1 + length) % length)}
        >
          <ArrowBigLeft />
        </Button>
        <Button
          size="icon"
          className="text-orange-dark hover:bg-orange-400"
          onClick={() => setCountAd((countAd + 1) % length)}
        >
          <ArrowBigRight />
        </Button>
      </div>
      <div className="absolute bottom-4 left-0 w-full flex justify-center gap-3 z-20">
        {linkAdvertisement.map((items, index) => (
          <div
            key={index}
            className={`w-3 h-3 ${index == countAd % length ? "bg-blue-400" : "bg-white"} rounded-full`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Advertisement;
