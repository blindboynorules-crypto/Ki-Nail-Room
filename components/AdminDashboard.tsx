
import React from 'react';
import { ArrowLeft, Trash2, ShieldCheck, Database, MessageSquare } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const handleCleanup = () => {
     window.location.href = '/api/cleanup-images';
  };

  // Link đến Airtable của người dùng (Bạn có thể thay bằng link thực tế của bảng BotConfig)
  const AIRTABLE_LINK = "https://airtable.com"; 

  return (
    <div className="min-h-screen bg-vanilla-50 p-4 font-sans text-gray-700 pt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-chestnut-50 flex flex-col min-h-[50vh]">
          
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

          {/* Content Area */}
          <div className="flex-grow p-8 bg-vanilla-50/50">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* CARD 1: DATA CHATBOT (NEW) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif">
                        Dạy Chatbot (Data)
                    </h2>
                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        Thay đổi câu trả lời, cập nhật khuyến mãi, bảng giá cho Chatbot thông qua Airtable.
                    </p>
                    <a 
                        href={AIRTABLE_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Database className="w-4 h-4" /> Mở Bảng Dữ Liệu
                    </a>
                    <p className="text-[10px] text-gray-400 mt-3 italic">
                        *Cần tạo bảng tên "BotConfig" trên Airtable với cột: Keyword, Answer, Image.
                    </p>
                </div>

                {/* CARD 2: SYSTEM CLEANUP */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                        <Trash2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif">
                        Dọn Dẹp Hệ Thống
                    </h2>
                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        Quét và xóa các ảnh "Báo Giá AI" cũ hơn 3 ngày trên Cloudinary để tiết kiệm dung lượng.
                    </p>
                    <button 
                        onClick={handleCleanup}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Quét & Dọn Dẹp
                    </button>
                </div>

             </div>
          </div>

        </div>
    </div>
  );
};

export default AdminDashboard;
