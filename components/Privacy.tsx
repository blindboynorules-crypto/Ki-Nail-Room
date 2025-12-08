import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface PrivacyProps {
  onBack: () => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onBack }) => {
  return (
    <section className="py-20 bg-white min-h-screen animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-chestnut-600 font-bold mb-8 hover:underline group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Quay lại trang chủ
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-chestnut-50 rounded-full mb-4">
            <ShieldCheck className="w-10 h-10 text-chestnut-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            Chính Sách Quyền Riêng Tư
          </h1>
          <p className="text-gray-500 font-menu">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div className="prose prose-chestnut max-w-none text-gray-600 font-menu space-y-6 bg-vanilla-50 p-8 rounded-3xl border border-chestnut-100">
          <p>
            Chào mừng bạn đến với <strong>Ki Nail Room</strong>. Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ thông tin cá nhân của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin khi bạn sử dụng ứng dụng Chatbot và Website của chúng tôi.
          </p>

          <h3 className="text-xl font-bold text-gray-800 border-b border-chestnut-200 pb-2">1. Thông tin chúng tôi thu thập</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Thông tin công khai trên Facebook:</strong> Khi bạn tương tác với Fanpage hoặc Chatbot của chúng tôi, chúng tôi có thể nhận được tên, ảnh đại diện và ID người dùng (PSID) do Facebook cung cấp.</li>
            <li><strong>Hình ảnh bạn tải lên:</strong> Khi sử dụng tính năng "Báo Giá AI", bạn tải hình ảnh móng tay lên hệ thống. Hình ảnh này được sử dụng để phân tích và đưa ra báo giá, sau đó có thể được lưu trữ tạm thời để gửi lại cho bạn qua Messenger.</li>
            <li><strong>Nội dung tin nhắn:</strong> Các tin nhắn bạn gửi cho Bot để yêu cầu hỗ trợ hoặc đặt lịch.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-800 border-b border-chestnut-200 pb-2">2. Cách chúng tôi sử dụng thông tin</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Cung cấp dịch vụ báo giá tự động và tư vấn kiểu dáng Nail.</li>
            <li>Hỗ trợ đặt lịch hẹn làm móng.</li>
            <li>Cải thiện chất lượng dịch vụ và trải nghiệm khách hàng.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-800 border-b border-chestnut-200 pb-2">3. Chia sẻ thông tin</h3>
          <p>
            Chúng tôi <strong>không</strong> bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại. Dữ liệu chỉ được sử dụng trong nội bộ Ki Nail Room và các nền tảng kỹ thuật hỗ trợ vận hành (như Facebook, Cloudinary, Gemini AI) để cung cấp dịch vụ cho chính bạn.
          </p>

          <h3 className="text-xl font-bold text-gray-800 border-b border-chestnut-200 pb-2">4. Bảo mật dữ liệu</h3>
          <p>
            Chúng tôi thực hiện các biện pháp bảo mật phù hợp để bảo vệ dữ liệu của bạn khỏi bị truy cập trái phép. Tuy nhiên, xin lưu ý rằng không có phương thức truyền tải nào qua Internet là an toàn tuyệt đối.
          </p>

          <h3 className="text-xl font-bold text-gray-800 border-b border-chestnut-200 pb-2">5. Liên hệ</h3>
          <p>
            Nếu bạn có bất kỳ câu hỏi nào về chính sách này, vui lòng liên hệ với chúng tôi qua Fanpage Ki Nail Room hoặc Hotline: 0919 979 763.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Privacy;