import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, ShoppingCart, Users,
  Wallet, Award, Layers, Download, Tag, CreditCard, Crown,
} from 'lucide-react';
import { useStatistic } from "../../contexts/StatisticContext";
import { useTheme } from "../../contexts/ThemeContext";
import { productApi, statisticApi } from '../../api';

const MONTH_LABELS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
const PALETTE = ["#fb923c","#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899"];

const fmtRevenue = (v) => {
  if (v == null) return '—';
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} tỷ đ`;
  if (v >= 1_000_000)    return `${Math.round(v / 1_000_000)} triệu đ`;
  return `${Math.round(v).toLocaleString('vi-VN')} đ`;
};

const makeTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? "rgba(30,41,59,0.97)" : "rgba(255,255,255,0.97)",
  border: "none",
  borderRadius: "12px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
});
const axisProps = { stroke: "#94a3b8", fontSize: 11, tickLine: false, axisLine: false };

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
}

// ─── Revenue Tab ──────────────────────────────────────────────────────
function RevenueTab({ period }) {
  const { revenueByMonth } = useStatistic();
  const { isDark } = useTheme();
  const [monthly2024, setMonthly2024] = useState([]);

  useEffect(() => {
    statisticApi.getRevenueByMonth({ year: 2024 })
      .then(r => setMonthly2024(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  const data = useMemo(() => {
    const src = period === '2025' ? (revenueByMonth ?? []) : monthly2024;
    return MONTH_LABELS.map((label, idx) => {
      const found = src.find(r => r.month === idx + 1);
      return {
        thang:    label,
        doanhThu: found ? +(found.totalRevenue / 1_000_000).toFixed(2) : 0,
        donHang:  found ? found.totalOrders : 0,
      };
    });
  }, [period, revenueByMonth, monthly2024]);

  const compareData = useMemo(() => {
    const src25 = revenueByMonth ?? [];
    return MONTH_LABELS.map((label, idx) => {
      const r25 = src25.find(r => r.month === idx + 1);
      const r24 = monthly2024.find(r => r.month === idx + 1);
      return {
        thang:      label,
        'Năm 2025': r25 ? +(r25.totalRevenue / 1_000_000).toFixed(2) : 0,
        'Năm 2024': r24 ? +(r24.totalRevenue / 1_000_000).toFixed(2) : 0,
      };
    });
  }, [revenueByMonth, monthly2024]);

  const totalDT = data.reduce((s, d) => s + d.doanhThu, 0);
  const totalDH = data.reduce((s, d) => s + d.donHang, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Area chart */}
        <Card className="p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Doanh thu theo tháng</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Năm {period} · đơn vị: triệu đồng</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fb923c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} vertical={false} />
                <XAxis dataKey="thang" {...axisProps} />
                <YAxis tickFormatter={v => `${v}M`} {...axisProps} />
                <Tooltip
                  contentStyle={makeTooltipStyle(isDark)}
                  formatter={(v, n) => [
                    n === 'doanhThu' ? `${v} triệu đ` : `${v} đơn`,
                    n === 'doanhThu' ? 'Doanh thu' : 'Đơn hàng',
                  ]}
                />
                <Legend formatter={(v) => v === 'doanhThu' ? 'Doanh thu (triệu đ)' : 'Đơn hàng'} />
                <Area type="monotone" dataKey="doanhThu" stroke="#fb923c" strokeWidth={2.5} fill="url(#gDT)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar comparison 2024 vs 2025 */}
        <Card className="p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">So sánh năm 2024 – 2025</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Doanh thu theo tháng · triệu đồng</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} vertical={false} />
                <XAxis dataKey="thang" {...axisProps} />
                <YAxis tickFormatter={v => `${v}M`} {...axisProps} />
                <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v, n) => [`${v} triệu đ`, n]} />
                <Legend />
                <Bar dataKey="Năm 2024" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Năm 2025" fill="#fb923c" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Monthly summary table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h4 className="text-base font-bold text-slate-800 dark:text-white">Tổng hợp doanh thu theo tháng</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                {["Tháng", "Doanh thu", "Đơn hàng", "TB/đơn"].map((h) => (
                  <th key={h} className={`p-4 font-semibold text-slate-600 dark:text-slate-400 ${h === "Tháng" ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">Tháng {i + 1}</td>
                  <td className="p-4 text-right font-semibold text-orange-500">
                    {(d.doanhThu * 1_000_000).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-4 text-right text-slate-700 dark:text-slate-300">{d.donHang.toLocaleString()}</td>
                  <td className="p-4 text-right text-slate-500 dark:text-slate-400">
                    {d.donHang > 0
                      ? Math.round((d.doanhThu * 1_000_000) / d.donHang).toLocaleString('vi-VN') + ' đ'
                      : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-orange-50/50 dark:bg-orange-900/10 font-bold border-t-2 border-orange-100 dark:border-orange-900/30">
                <td className="p-4 text-slate-800 dark:text-white">Tổng cộng</td>
                <td className="p-4 text-right text-orange-500">{(totalDT * 1_000_000).toLocaleString('vi-VN')} đ</td>
                <td className="p-4 text-right text-slate-800 dark:text-white">{totalDH.toLocaleString()}</td>
                <td className="p-4 text-right text-slate-500 dark:text-slate-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Category Tab ─────────────────────────────────────────────────────
function CategoryTab({ period }) {
  const { isDark } = useTheme();
  const [catList, setCatList] = useState([]);
  const [catMonthList, setCatMonthList] = useState([]);

  useEffect(() => {
    const year = Number(period);
    statisticApi.getRevenueByCategoy({ year })
      .then(r => setCatList(r.data?.data ?? r.data ?? []))
      .catch(() => {});
    statisticApi.getRevenueCategoryByMonth({ year })
      .then(r => setCatMonthList(r.data?.data ?? r.data ?? []))
      .catch(() => {});
  }, [period]);

  const catData = useMemo(() => catList.map((c, i) => ({
    name:      c.categoryName,
    value:     +(c.revenueShare ?? 0).toFixed(1),
    doanhThu:  c.totalRevenue,
    daBan:     c.totalItems,
    donHang:   c.totalOrders,
    color:     PALETTE[i % PALETTE.length],
  })), [catList]);

  const catKeys   = catData.map(c => c.name);
  const catColors = catData.map(c => c.color);

  // Pivot flat rows into { thang, [catName]: millionVND }
  const stackedData = useMemo(() => {
    const months = {};
    catMonthList.forEach(r => {
      const key = r.month;
      if (!months[key]) months[key] = { thang: MONTH_LABELS[r.month - 1] };
      months[key][r.categoryName] = +(r.totalRevenue / 1_000_000).toFixed(2);
    });
    return MONTH_LABELS.map((_, idx) => months[idx + 1] ?? { thang: MONTH_LABELS[idx] });
  }, [catMonthList]);

  if (!catList.length) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-400">Không có dữ liệu danh mục</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Stacked bar */}
        <Card className="xl:col-span-2 p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Doanh thu theo danh mục & tháng</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">triệu đồng</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} vertical={false} />
                <XAxis dataKey="thang" {...axisProps} />
                <YAxis tickFormatter={v => `${v}M`} {...axisProps} />
                <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v, n) => [`${v} triệu đ`, n]} />
                <Legend />
                {catKeys.map((k, i) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={catColors[i]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut */}
        <Card className="p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Phân bổ danh mục</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Theo doanh thu</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                  {catData.map((_, i) => <Cell key={i} fill={catColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v, n) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {catData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColors[i] }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{Math.round(item.doanhThu / 1_000_000)}M</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white w-10 text-right">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Category table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h4 className="text-base font-bold text-slate-800 dark:text-white">Chi tiết theo danh mục</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400">Danh mục</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Doanh thu</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Đơn hàng</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Sản phẩm bán</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Tỷ lệ</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Phân bổ</th>
              </tr>
            </thead>
            <tbody>
              {catData.map((cat, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColors[i] }} />
                      <span className="font-medium text-slate-800 dark:text-white">{cat.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold text-orange-500">
                    {cat.doanhThu.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-4 text-right text-slate-600 dark:text-slate-400">{cat.donHang.toLocaleString()}</td>
                  <td className="p-4 text-right text-slate-600 dark:text-slate-400">{cat.daBan.toLocaleString()} sp</td>
                  <td className="p-4 text-right font-bold text-slate-800 dark:text-white">{cat.value}%</td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.value}%`, backgroundColor: catColors[i] }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Brand Tab ────────────────────────────────────────────────────────
function BrandTab({ period }) {
  const { isDark } = useTheme();
  const [brandList, setBrandList] = useState([]);

  useEffect(() => {
    statisticApi.getRevenueByBrand({ year: Number(period) })
      .then(r => setBrandList(r.data?.data ?? r.data ?? []))
      .catch(() => {});
  }, [period]);

  const brandData = useMemo(() => brandList.map((b, i) => ({
    ten:      b.brandName,
    doanhThu: +(b.totalRevenue / 1_000_000).toFixed(2),
    donHang:  b.totalOrders,
    color:    PALETTE[i % PALETTE.length],
  })), [brandList]);

  const maxDT = brandData.length ? Math.max(...brandData.map(b => b.doanhThu)) : 1;

  if (!brandData.length) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-400">Không có dữ liệu thương hiệu</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Doanh thu theo thương hiệu</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">triệu đồng</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v}M`} {...axisProps} />
              <YAxis type="category" dataKey="ten" {...axisProps} width={72} />
              <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v) => [`${v} triệu đ`, 'Doanh thu']} />
              <Bar dataKey="doanhThu" radius={[0, 4, 4, 0]} maxBarSize={32}>
                {brandData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h4 className="text-base font-bold text-slate-800 dark:text-white">Chi tiết theo thương hiệu</h4>
        </div>
        <div className="p-6 space-y-4">
          {brandData.map((brand, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              >
                {brand.ten[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{brand.ten}</span>
                  <span className="text-xs text-slate-400">{brand.donHang.toLocaleString()} đơn</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${maxDT > 0 ? (brand.doanhThu / maxDT) * 100 : 0}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white shrink-0 w-14 text-right">
                {brand.doanhThu}M
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────
const topProductsFallback = [];

function ProductsTab() {
  const [filterCat,       setFilterCat]       = useState('all');
  const [filterTrend,     setFilterTrend]     = useState('all');
  const [products,        setProducts]        = useState(topProductsFallback);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    productApi.getTopProducts({ top: 20 })
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data.map((p, i) => ({
            rank:       p.rank         ?? i + 1,
            ten:        p.productName  ?? p.ten        ?? '—',
            danhMuc:    p.categoryName ?? p.danhMuc    ?? '—',
            thuongHieu: p.brandName    ?? p.thuongHieu ?? '—',
            daBan:      p.totalSold    ?? p.soldQuantity ?? p.daBan ?? 0,
            doanhThu:   (p.totalRevenue ?? p.revenue) != null
              ? (p.totalRevenue ?? p.revenue).toLocaleString('vi-VN')
              : (p.doanhThu ?? '—'),
            trend:  p.trend  ?? 'up',
            change: p.change ?? '',
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const cats = ['all', ...new Set(products.map((p) => p.danhMuc))];
  const filtered = products
    .filter((p) => filterCat   === 'all' || p.danhMuc === filterCat)
    .filter((p) => filterTrend === 'all' || p.trend   === filterTrend);

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">Sản phẩm bán chạy</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {loadingProducts ? 'Đang tải...' : `Top ${filtered.length} sản phẩm`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="all">Tất cả danh mục</option>
              {cats.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterTrend}
              onChange={(e) => setFilterTrend(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="all">Tất cả xu hướng</option>
              <option value="up">Đang tăng</option>
              <option value="down">Đang giảm</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="text-center p-4 font-semibold text-slate-600 dark:text-slate-400 w-12">#</th>
              <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400">Sản phẩm</th>
              <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Danh mục</th>
              <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Thương hiệu</th>
              <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Đã bán</th>
              <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Doanh thu</th>
              <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Xu hướng</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-600">
                  {loadingProducts ? 'Đang tải...' : 'Không có dữ liệu phù hợp'}
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${p.rank <= 3 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                      {p.rank}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-white">{p.ten}</td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{p.danhMuc}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-slate-500 dark:text-slate-400">{p.thuongHieu}</td>
                  <td className="p-4 text-right text-slate-700 dark:text-slate-300">{p.daBan.toLocaleString()}</td>
                  <td className="p-4 text-right font-semibold text-orange-500">{p.doanhThu} đ</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.trend === 'up'
                        ? <TrendingUp   className="w-3.5 h-3.5 text-emerald-500" />
                        : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                      <span className={`text-xs font-semibold ${p.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {p.change}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────
const STATUS_GROUPS = [
  { label: "Hoàn tất",   ids: [6, 7],        color: "#10b981" },
  { label: "Đang xử lý", ids: [1, 2, 3],     color: "#3b82f6" },
  { label: "Đang giao",  ids: [5],            color: "#8b5cf6" },
  { label: "Đã hủy",     ids: [8],            color: "#ef4444" },
  { label: "Khác",       ids: [4, 9, 10, 11], color: "#94a3b8" },
];

function OrdersTab() {
  const { isDark } = useTheme();
  const [orderStatus, setOrderStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statisticApi.getOrderStatus()
      .then(r => setOrderStatus(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orderStatus.reduce((s, r) => s + r.totalOrders, 0);

  const completedOrders = orderStatus
    .filter(r => [6, 7].includes(r.statusId))
    .reduce((s, r) => s + r.totalOrders, 0);

  const cancelledOrders = orderStatus.find(r => r.statusId === 8)?.totalOrders ?? 0;
  const shippingOrders  = orderStatus.find(r => r.statusId === 5)?.totalOrders ?? 0;

  const completedRate = totalOrders > 0 ? Math.round(completedOrders / totalOrders * 100) : 0;
  const cancelledRate = totalOrders > 0 ? Math.round(cancelledOrders / totalOrders * 100) : 0;

  const donutData = STATUS_GROUPS.map(g => ({
    name:  g.label,
    value: orderStatus.filter(r => g.ids.includes(r.statusId)).reduce((s, r) => s + r.totalOrders, 0),
    color: g.color,
  })).filter(d => d.value > 0);

  const barData = orderStatus
    .filter(r => r.totalOrders > 0)
    .map(r => ({ name: r.statusName, orders: r.totalOrders }));

  if (loading) {
    return <Card className="p-12 text-center"><p className="text-slate-400">Đang tải...</p></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Horizontal bar - status breakdown */}
        <Card className="xl:col-span-2 p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Số lượng đơn hàng theo trạng thái</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Tổng {totalOrders.toLocaleString()} đơn</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="name" {...axisProps} width={140} />
                <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v) => [`${v} đơn`, 'Số lượng']} />
                <Bar dataKey="orders" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {barData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut */}
        <Card className="p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Phân bổ trạng thái</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Tổng {totalOrders.toLocaleString()} đơn</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v, n) => [`${v} đơn`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {donutData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {item.value}
                  <span className="text-slate-400 font-normal ml-1">
                    ({totalOrders > 0 ? Math.round(item.value / totalOrders * 100) : 0}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng đơn hàng",  value: totalOrders.toLocaleString(),  sub: "Tất cả trạng thái",          color: "text-blue-500" },
          { label: "Tỉ lệ hoàn tất", value: `${completedRate}%`,           sub: `${completedOrders} đơn hoàn tất`, color: "text-emerald-500" },
          { label: "Tỉ lệ hủy đơn",  value: `${cancelledRate}%`,           sub: `${cancelledOrders} đơn đã hủy`,  color: "text-rose-500" },
          { label: "Đơn đang giao",   value: shippingOrders.toLocaleString(), sub: "Trạng thái đang giao hàng", color: "text-purple-500" },
        ].map((kpi, i) => (
          <Card key={i} className="p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Payment Method Tab ───────────────────────────────────────────────
function PaymentTab() {
  const { isDark } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statisticApi.getRevenueByPaymentMethod()
      .then(r => setData(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = data.reduce((s, d) => s + (d.totalRevenue ?? 0), 0);

  const chartData = data.map((d, i) => ({
    name:   d.paymentMethod ?? d.paymentMethodName ?? 'N/A',
    value:  d.totalRevenue ?? 0,
    orders: d.totalOrders ?? 0,
    color:  PALETTE[i % PALETTE.length],
    pct:    total > 0 ? +((( d.totalRevenue ?? 0) / total) * 100).toFixed(1) : 0,
  }));

  if (loading) return <Card className="p-12 text-center"><p className="text-slate-400">Đang tải...</p></Card>;
  if (!data.length) return <Card className="p-12 text-center"><p className="text-slate-400">Không có dữ liệu</p></Card>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Doanh thu theo phương thức thanh toán</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">đồng</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis tickFormatter={v => `${Math.round(v / 1_000_000)}M`} {...axisProps} />
                <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v) => [v.toLocaleString('vi-VN') + ' đ', 'Doanh thu']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Phân bổ</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Theo doanh thu</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                  {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={makeTooltipStyle(isDark)} formatter={(v) => [v.toLocaleString('vi-VN') + ' đ', 'Doanh thu']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">{item.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h4 className="text-base font-bold text-slate-800 dark:text-white">Chi tiết</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400">Phương thức</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Doanh thu</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Đơn hàng</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Tỷ lệ</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Phân bổ</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="font-medium text-slate-800 dark:text-white">{row.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold text-orange-500">{row.value.toLocaleString('vi-VN')} đ</td>
                  <td className="p-4 text-right text-slate-600 dark:text-slate-400">{row.orders.toLocaleString()}</td>
                  <td className="p-4 text-right font-bold text-slate-800 dark:text-white">{row.pct}%</td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Voucher Effectiveness Tab ────────────────────────────────────────
function VouchersTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statisticApi.getVoucherEffectiveness()
      .then(r => setData(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card className="p-12 text-center"><p className="text-slate-400">Đang tải...</p></Card>;
  if (!data.length) return <Card className="p-12 text-center"><p className="text-slate-400">Không có dữ liệu</p></Card>;

  const totalDiscount = data.reduce((s, d) => s + (d.totalDiscount ?? d.totalDiscountAmount ?? 0), 0);
  const totalUsed     = data.reduce((s, d) => s + (d.timesUsed ?? d.totalUsed ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Tổng voucher',   value: data.length,                    color: 'text-blue-500'    },
          { label: 'Tổng lượt dùng', value: totalUsed.toLocaleString(),     color: 'text-emerald-500' },
          { label: 'Tổng giảm giá',  value: fmtRevenue(totalDiscount),      color: 'text-orange-500'  },
        ].map((kpi, i) => (
          <Card key={i} className="p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h4 className="text-base font-bold text-slate-800 dark:text-white">Hiệu quả voucher</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400">Mã voucher</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Lượt dùng</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Tổng giảm</th>
                <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">TB/lượt</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const used     = row.timesUsed ?? row.totalUsed ?? 0;
                const discount = row.totalDiscount ?? row.totalDiscountAmount ?? 0;
                return (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-mono font-bold">
                          {row.voucherCode ?? row.code ?? '—'}
                        </span>
                        {row.voucherName && (
                          <span className="text-slate-500 dark:text-slate-400 text-xs truncate">{row.voucherName}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right text-slate-700 dark:text-slate-300">{used.toLocaleString()}</td>
                    <td className="p-4 text-right font-semibold text-orange-500">{discount.toLocaleString('vi-VN')} đ</td>
                    <td className="p-4 text-right text-slate-500 dark:text-slate-400">
                      {used > 0 ? Math.round(discount / used).toLocaleString('vi-VN') + ' đ' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Top Customers Tab ────────────────────────────────────────────────
function CustomersTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statisticApi.getTopCustomers({ top: 20 })
      .then(r => setData(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card className="p-12 text-center"><p className="text-slate-400">Đang tải...</p></Card>;
  if (!data.length) return <Card className="p-12 text-center"><p className="text-slate-400">Không có dữ liệu</p></Card>;

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <h4 className="text-base font-bold text-slate-800 dark:text-white">Khách hàng tiêu dùng nhiều nhất</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">Top {data.length} khách hàng</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="text-center p-4 font-semibold text-slate-600 dark:text-slate-400 w-12">#</th>
              <th className="text-left p-4 font-semibold text-slate-600 dark:text-slate-400">Khách hàng</th>
              <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Số đơn</th>
              <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">Tổng chi tiêu</th>
              <th className="text-right p-4 font-semibold text-slate-600 dark:text-slate-400">TB/đơn</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const spent  = row.totalSpent ?? row.totalRevenue ?? 0;
              const orders = row.totalOrders ?? row.orderCount ?? 0;
              const name   = row.fullName ?? row.customerName ?? '—';
              const email  = row.email ?? '';
              return (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      i < 3 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-800 dark:text-white">{name}</p>
                    {email && <p className="text-xs text-slate-400">{email}</p>}
                  </td>
                  <td className="p-4 text-right text-slate-700 dark:text-slate-300">{orders.toLocaleString()}</td>
                  <td className="p-4 text-right font-semibold text-orange-500">{spent.toLocaleString('vi-VN')} đ</td>
                  <td className="p-4 text-right text-slate-500 dark:text-slate-400">
                    {orders > 0 ? Math.round(spent / orders).toLocaleString('vi-VN') + ' đ' : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
const TABS = [
  { id: 'revenue',  label: 'Doanh thu',    icon: Wallet },
  { id: 'category', label: 'Danh mục',     icon: Layers },
  { id: 'brand',    label: 'Thương hiệu',  icon: Award },
  { id: 'products', label: 'Sản phẩm',     icon: Package },
  { id: 'orders',   label: 'Đơn hàng',     icon: ShoppingCart },
  { id: 'payment',  label: 'Thanh toán',   icon: CreditCard },
  { id: 'vouchers', label: 'Voucher',       icon: Tag },
  { id: 'customers',label: 'Khách hàng',   icon: Crown },
];

export default function Statistics() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [period,    setPeriod]    = useState('2024');
  const { overview } = useStatistic();

  const ovData = overview?.data;

  const summaryCards = useMemo(() => [
    {
      title: "Tổng doanh thu",
      value: ovData ? fmtRevenue(ovData.totalRevenue) : '—',
      color: "text-orange-500",
      bg:    "bg-orange-50 dark:bg-orange-900/20",
      icon:  Wallet,
    },
    {
      title: "Tổng đơn hàng",
      value: ovData ? ovData.totalOrders.toLocaleString() : '—',
      color: "text-blue-500",
      bg:    "bg-blue-50 dark:bg-blue-900/20",
      icon:  ShoppingCart,
    },
    {
      title: "Khách hàng",
      value: ovData ? ovData.totalCustomers.toLocaleString() : '—',
      color: "text-emerald-500",
      bg:    "bg-emerald-50 dark:bg-emerald-900/20",
      icon:  Users,
    },
    {
      title: "TB giá trị/đơn",
      value: ovData ? fmtRevenue(ovData.averageOrderValue) : '—',
      color: "text-purple-500",
      bg:    "bg-purple-50 dark:bg-purple-900/20",
      icon:  Tag,
    },
  ], [ovData]);

  const renderTab = () => {
    switch (activeTab) {
      case 'revenue':   return <RevenueTab period={period} />;
      case 'category':  return <CategoryTab period={period} />;
      case 'brand':     return <BrandTab period={period} />;
      case 'products':  return <ProductsTab />;
      case 'orders':    return <OrdersTab />;
      case 'payment':   return <PaymentTab />;
      case 'vouchers':  return <VouchersTab />;
      case 'customers': return <CustomersTab />;
      default:          return null;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Thống kê & Báo cáo</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Dữ liệu thực · Năm {period}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="2025">Năm 2025</option>
            <option value="2024">Năm 2024</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.title}</p>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white leading-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? 'bg-orange-default text-white shadow-lg shadow-orange-default/25'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {renderTab()}
    </div>
  );
}
