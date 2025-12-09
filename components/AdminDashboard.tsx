import React from 'react';
import { ArrowLeft, Trash2, ShieldCheck } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const handleCleanup = () => {
     window.location.href = '/api/cleanup-images';
  };

  return (
    <div className="min-h-screen bg-vanilla-50 p-4 font-sans text-gray-700 pt-24">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-chestnut-50 flex flex-col min-h-[50vh]">
          
          {/* Header */}
          <div className="bg-chestnut-600 p-6 flex items-center justify-between shrink-0 z-10 shadow-md">
            <div>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-8 h-8" /> QUẢN TRỊ KI NAIL
                </h1>
                <p className="text-chestnut-200 text-xs uppercase tracking-[0.2em] mt-1 font-semibold">
                Admin Dashboard
                </p>
            </div>
            <button 
                onClick={onBack} 
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Content Area - SINGLE FEATURE (CLEANUP) */}
          <div className="flex-grow flex items-center justify-center p-8 bg-vanilla-50/50">
            <div className="text-center w-full max-w-md">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center animate-pulse mx-auto mb-6">
                    <Trash2 className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif">
                    Dọn Dẹp Ảnh Thừa
                </h2>
                <p className="text-gray-600 mb-8 mx-auto leading-relaxed">
                    Hệ thống sẽ quét và xóa các ảnh "Báo Giá AI" cũ hơn 3 ngày trên Cloudinary để tiết kiệm dung lượng lưu trữ.
                </p>
                <button 
                    onClick={handleCleanup}
                    className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center"
                >
                    <Trash2 className="w-5 h-5 mr-2" /> Bắt Đầu Quét & Dọn Dẹp
                </button>
                <p className="text-xs text-gray-400 mt-4 italic">
                    *Chức năng này an toàn và không ảnh hưởng đến ảnh Gallery.
                </p>
            </div>
          </div>

        </div>
    </div>
  );
};

export default AdminDashboard;