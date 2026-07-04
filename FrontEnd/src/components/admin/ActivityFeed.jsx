import React from 'react';
import { Clock } from 'lucide-react'; 

const activities = [
  {
    title: "Đơn hàng mới",
    description: "Đơn #3852 – Nguyễn Văn An đặt Vợt Yonex Astrox 88D",
    time: "2 phút trước",
    color: "bg-blue-500",
  },
  {
    title: "Yêu cầu bảo hành",
    description: "Trần Thị Bình gửi yêu cầu BH cho Vợt Victor Thruster K",
    time: "35 phút trước",
    color: "bg-amber-500",
  },
  {
    title: "Khách hàng mới",
    description: "Lê Minh Quân đăng ký tài khoản",
    time: "1 giờ trước",
    color: "bg-emerald-500",
  },
  {
    title: "Sản phẩm sắp hết hàng",
    description: "Cầu RSL Gold còn 8 hộp – cần nhập thêm",
    time: "2 giờ trước",
    color: "bg-rose-500",
  },
  {
    title: "Đơn hàng hoàn tất",
    description: "Đơn #3847 đã giao thành công đến Phạm Hồng Sơn",
    time: "3 giờ trước",
    color: "bg-purple-500",
  },
];

function ActivityFeed() {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      {/* Tiêu đề */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Hoạt động gần đây
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hoạt động hệ thống mới nhất
            </p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Xem tất cả
          </button>
        </div>
      </div>

      {/* Danh sách nội dung */}
      <div className="p-6 space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={index} 
            className="flex items-start space-x-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {/* Chấm trạng thái */}
            <div className={`p-2 rounded-lg shrink-0 ${activity.color} bg-opacity-10`}>
              <div className={`w-2 h-2 rounded-full ${activity.color}`}></div>
            </div>

            {/* Chi tiết hoạt động */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                {activity.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                {activity.description}
              </p>
              
              {/* Thời gian */}
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activity.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;