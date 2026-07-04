import React, { useState, useRef, useEffect } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SearchDropdown = ({ isFullWidth = false, onClose }) => {
  const [keyword, setKeyword] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [voucher, setVoucher] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const [isFocus, setIsFocus] = useState(false)

  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (voucher) params.set('voucher', 'true')
    if (isBestSeller) params.set('isBestSeller', 'true')
    if (sortBy) params.set('sortBy', sortBy)
    params.set('page', '1')
    params.set('pageSize', '12')
    navigate(`/search?${params.toString()}`)
    setShowFilters(false)
    onClose?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const hasActiveFilters = minPrice || maxPrice || voucher || isBestSeller || sortBy

  const sortOptions = [
    { value: '', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá thấp → cao' },
    { value: 'price_desc', label: 'Giá cao → thấp' },
    { value: 'name_asc', label: 'Tên A → Z' },
    { value: 'name_desc', label: 'Tên Z → A' },
    { value: 'oldest', label: 'Cũ nhất' },
  ]

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Search Bar */}
      <div
        className={`flex items-center bg-gray-100 rounded-[10px] transition-all duration-200 ${
          isFocus ? 'border border-orange-500 shadow-sm' : 'border border-transparent'
        }`}
      >
        <button
          type="button"
          onClick={handleSearch}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
        >
          <Search size={20} />
        </button>

        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          placeholder="Tìm kiếm sản phẩm..."
          className="py-2 px-2 text-base outline-none bg-transparent text-gray-700 flex-1 min-w-0"
        />

        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="p-1.5 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}

        {/* Filter Toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-3 py-2 rounded-r-[10px] text-sm font-medium transition-colors border-l border-gray-200 ${
            showFilters || hasActiveFilters
              ? 'bg-orange-500 text-white'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Lọc</span>
          {hasActiveFilters && (
            <span className="bg-white text-orange-500 rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">
              !
            </span>
          )}
        </button>
      </div>

      {/* Filter Dropdown Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-200 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800 text-sm">Bộ lọc tìm kiếm</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setMinPrice('')
                  setMaxPrice('')
                  setVoucher(false)
                  setIsBestSeller(false)
                  setSortBy('')
                }}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Khoảng giá
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Từ"
                  min={0}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 w-0"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Đến"
                  min={0}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 w-0"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Sắp xếp theo
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 appearance-none bg-white pr-8"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setVoucher(!voucher)}
                  className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${
                    voucher ? 'bg-orange-500 border-orange-500' : 'border-gray-300 group-hover:border-orange-400'
                  }`}
                  style={{ width: 18, height: 18 }}
                >
                  {voucher && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={voucher}
                  onChange={(e) => setVoucher(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm text-gray-700 select-none">Có voucher</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setIsBestSeller(!isBestSeller)}
                  className={`rounded border-2 flex items-center justify-center transition-all ${
                    isBestSeller ? 'bg-orange-500 border-orange-500' : 'border-gray-300 group-hover:border-orange-400'
                  }`}
                  style={{ width: 18, height: 18 }}
                >
                  {isBestSeller && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm text-gray-700 select-none">Bán chạy (≥10 lượt)</span>
              </label>
            </div>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchDropdown