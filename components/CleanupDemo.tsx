
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface CleanupDemoProps {
  onBack: () => void;
}

const CleanupDemo: React.FC<CleanupDemoProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-vanilla-50 flex items-center justify-center p-4 font-sans text-gray-700">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-chestnut-50 transform transition-all hover:scale-[1.01] duration-500">
          
          {/* Header */}
          <div className="bg-chestnut-500 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-vanilla-200 rounded-full blur-xl"></div>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white relative z-10 tracking-wide">
              SYSTEM CLEANUP
            </h1>
            <p className="text-chestnut-50 text-xs uppercase tracking-[0.2em] mt-2 relative z-10 font-semibold opacity-80">
              Ki Nail Room Admin
            </p>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Mock Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif text-green-600">
              Dọn Dẹp Thành Công
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Đây là bản Demo giao diện. Trên thực tế, hệ thống đã xóa vĩnh viễn <span className="text-2xl font-bold text-chestnut-600 mx-1">15</span> ảnh rác khỏi Cloudinary.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-500 font-mono break-all">
              Deleted IDs: 15 items (Demo Mode)
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <button 
              onClick={onBack} 
              className="font-bold text-sm transition-colors flex items-center justify-center gap-2 group w-full py-3 rounded-xl
                         bg-white border border-gray-200 shadow-sm text-chestnut-600 hover:bg-chestnut-50 hover:border-chestnut-200"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay về trang chủ
            </button>
          </div>
        </div>
    </div>
  );
};

export default CleanupDemo;
