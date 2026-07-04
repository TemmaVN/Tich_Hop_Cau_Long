import React, { useState } from 'react';
import { Shield, Users, CheckCircle, XCircle, MinusCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLES = [
  {
    id: 'admin',
    name: 'Quản trị viên (Admin)',
    colorScheme: {
      card: 'border-orange-200 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/5',
      badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
      icon: 'text-orange-500',
      dot: 'bg-orange-500',
    },
    description: 'Toàn quyền quản lý hệ thống. Được truy cập mọi tính năng quản trị.',
    capabilities: [
      'Quản lý sản phẩm, biến thể, ảnh & nhập/xuất Excel',
      'Xem & cập nhật trạng thái tất cả đơn hàng',
      'Hủy đơn hàng với lý do',
      'Quản lý tài khoản người dùng (tạo, khóa/mở khóa)',
      'Tạo & quản lý voucher giảm giá',
      'Kiểm duyệt đánh giá (ẩn/hiện)',
      'Xử lý yêu cầu bảo hành & hoàn trả',
      'Quản lý tồn kho & serial sản phẩm',
      'Xem báo cáo doanh thu & thống kê',
      'Xem nhật ký thao tác quản trị',
    ],
  },
  {
    id: 'customer',
    name: 'Khách hàng (Customer)',
    colorScheme: {
      card: 'border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5',
      badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
      icon: 'text-blue-500',
      dot: 'bg-blue-500',
    },
    description: 'Người dùng đã đăng nhập. Chỉ thao tác trên dữ liệu của chính mình.',
    capabilities: [
      'Xem & cập nhật hồ sơ cá nhân',
      'Đổi mật khẩu',
      'Quản lý giỏ hàng',
      'Đặt hàng & xem lịch sử đơn hàng',
      'Hủy đơn hàng khi còn ở trạng thái cho phép',
      'Lưu & sử dụng voucher giảm giá',
      'Viết, chỉnh sửa & xóa đánh giá của mình',
      'Đăng ký bảo hành sản phẩm',
      'Gửi yêu cầu hoàn trả',
    ],
  },
];

const PERMISSION_MATRIX = [
  {
    module: 'Sản phẩm',
    admin: 'full',
    customer: 'none',
    note: 'Admin: CRUD + import/export Excel. Khách: chỉ xem.',
  },
  {
    module: 'Đơn hàng',
    admin: 'full',
    customer: 'limited',
    note: 'Admin: tất cả đơn, cập nhật trạng thái, hủy. Khách: chỉ đơn của mình.',
  },
  {
    module: 'Người dùng',
    admin: 'full',
    customer: 'none',
    note: 'Admin: tạo tài khoản, khóa/mở khóa, xem chi tiết.',
  },
  {
    module: 'Thống kê',
    admin: 'full',
    customer: 'none',
    note: 'Doanh thu, top sản phẩm, báo cáo theo tháng/danh mục.',
  },
  {
    module: 'Voucher',
    admin: 'full',
    customer: 'limited',
    note: 'Admin: tạo & quản lý voucher. Khách: lưu & sử dụng voucher.',
  },
  {
    module: 'Đánh giá',
    admin: 'full',
    customer: 'limited',
    note: 'Admin: ẩn/hiện đánh giá. Khách: viết, sửa, xóa của mình.',
  },
  {
    module: 'Bảo hành',
    admin: 'full',
    customer: 'limited',
    note: 'Admin: duyệt & cập nhật trạng thái. Khách: đăng ký bảo hành.',
  },
  {
    module: 'Hoàn trả',
    admin: 'full',
    customer: 'limited',
    note: 'Admin: xét duyệt & hoàn tiền. Khách: gửi yêu cầu hoàn trả.',
  },
  {
    module: 'Tồn kho',
    admin: 'full',
    customer: 'none',
    note: 'Xem hàng sắp hết, quản lý serial, đánh dấu lỗi.',
  },
  {
    module: 'Nhật ký thao tác',
    admin: 'full',
    customer: 'none',
    note: 'Xem lịch sử các thao tác quản trị theo module/action.',
  },
  {
    module: 'Hồ sơ cá nhân',
    admin: 'full',
    customer: 'full',
    note: 'Tất cả người dùng đã đăng nhập đều có thể cập nhật hồ sơ của mình.',
  },
  {
    module: 'Giỏ hàng',
    admin: 'none',
    customer: 'full',
    note: 'Chỉ khách hàng sử dụng giỏ hàng.',
  },
];

const AccessIcon = ({ level }) => {
  if (level === 'full') return <CheckCircle size={18} className="text-emerald-500 mx-auto" />;
  if (level === 'limited') return <MinusCircle size={18} className="text-amber-500 mx-auto" />;
  return <XCircle size={18} className="text-slate-300 dark:text-slate-600 mx-auto" />;
};

const AccessLabel = ({ level }) => {
  if (level === 'full') return <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Toàn quyền</span>;
  if (level === 'limited') return <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Giới hạn</span>;
  return <span className="text-xs text-slate-400">Không có</span>;
};

const PermissionsAndRoles = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield size={24} className="text-orange-500" />
            Phân quyền & Vai trò
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng quan về các vai trò trong hệ thống và quyền hạn tương ứng.
            Để gán vai trò cho người dùng, vào{' '}
            <button
              onClick={() => navigate('/admin/users-list')}
              className="text-orange-500 hover:underline font-medium"
            >
              Quản lý người dùng
            </button>.
          </p>

        </div>

        {/* Note banner */}
        <div className="mb-5 flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-sm text-blue-700 dark:text-blue-400">
          <Shield size={16} className="shrink-0 mt-0.5" />
          <span>
            Hệ thống hiện có <strong>2 vai trò</strong>: <strong>Admin</strong> và <strong>Customer</strong>.
            Phân quyền được kiểm soát ở tầng backend (ASP.NET Core Role-based Authorization).
            Giao diện này chỉ hiển thị thông tin tham khảo.
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {[
            { id: 'roles', label: 'Vai trò' },
            { id: 'matrix', label: 'Ma trận quyền' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Roles */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {ROLES.map(role => (
              <div
                key={role.id}
                className={`rounded-2xl border p-5 ${role.colorScheme.card}`}
              >
                {/* Role header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm`}>
                      {role.id === 'admin'
                        ? <Shield size={20} className={role.colorScheme.icon} />
                        : <Users size={20} className={role.colorScheme.icon} />
                      }
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base">{role.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${role.colorScheme.badge}`}>
                        {role.id === 'admin' ? 'Hệ thống' : 'Mặc định'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{role.description}</p>

                {/* Capabilities list */}
                <ul className="space-y-2">
                  {role.capabilities.map((cap, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${role.colorScheme.dot}`} />
                      {cap}
                    </li>
                  ))}
                </ul>

                {/* Link to user management */}
                <button
                  onClick={() => navigate('/admin/users-list')}
                  className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Xem người dùng theo vai trò này
                  <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Permission Matrix */}
        {activeTab === 'matrix' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-48">
                      Phân hệ
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide w-32">
                      Admin
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide w-32">
                      Customer
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {PERMISSION_MATRIX.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {row.module}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <AccessIcon level={row.admin} />
                          <AccessLabel level={row.admin} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <AccessIcon level={row.customer} />
                          <AccessLabel level={row.customer} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chú thích:</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Toàn quyền</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MinusCircle size={14} className="text-amber-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Giới hạn (chỉ dữ liệu của mình)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle size={14} className="text-slate-300 dark:text-slate-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Không có quyền truy cập</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionsAndRoles;
