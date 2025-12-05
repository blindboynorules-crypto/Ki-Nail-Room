import React from 'react';
import { Scissors, Palette, Layers, CheckCircle2, Zap, GraduationCap } from 'lucide-react';

const Training: React.FC = () => {
  const courses = [
    {
      title: "Chuyên Đề Da",
      icon: <Scissors className="w-8 h-8 text-chestnut-600" />,
      items: [
        "Thực hành cắt chanh (rèn luyện lực tay).",
        "Hướng dẫn sử dụng máy mài – phân biệt đầu mài.",
        "Kỹ thuật cắt da bằng kìm và máy mài.",
        "Kỹ thuật dũa móng – tạo form móng chuẩn.",
        "Kỹ thuật phá gel – tháo móng úp an toàn.",
        "Kỹ thuật sơn gel bền đẹp."
      ]
    },
    {
      title: "Chuyên Đề Design",
      icon: <Palette className="w-8 h-8 text-chestnut-600" />,
      items: [
        "Kỹ thuật ombre: ngang – dọc – lòng đào.",
        "Kỹ thuật đi cọ nét cơ bản.",
        "Kỹ thuật sơn french đầu móng.",
        "Kỹ thuật tráng gương.",
        "Kỹ thuật ẩn nhũ, xà cừ, hoa khô.",
        "Kỹ thuật tạo hiệu ứng mắt mèo.",
        "Kỹ thuật đính charm.",
        "Kỹ thuật nặn thú bằng gel định hình (thỏ, gấu...)."
      ]
    },
    {
      title: "Chuyên Đề Móng Nối",
      icon: <Layers className="w-8 h-8 text-chestnut-600" />,
      items: [
        "Kỹ thuật nối móng úp keo.",
        "Kỹ thuật nối móng úp base.",
        "Kỹ thuật nối móng đắp gel.",
        "Kỹ thuật bột nhúng.",
        "Kỹ thuật fill gel – fill móng úp.",
      ]
    }
  ];

  const benefits = [
    "Không nhận quá nhiều học viên → Hướng dẫn kỹ, cầm tay chỉ việc 1:1.",
    "Giáo trình rõ ràng, hệ thống từ căn bản đến nâng cao.",
    "Học xong tự tin thành thạo kỹ năng, có thể đi làm ngay.",
    "Liên tục cập nhật kiến thức & xu hướng mới nhất trong quá trình học.",
    "Toàn bộ thiết bị, dụng cụ đều được hỗ trợ trong suốt quá trình học."
  ];

  return (
    <section id="training" className="py-16 md:py-24 bg-chestnut-900 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-chestnut-600 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-vanilla-600 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header - Light Text for Dark Background */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-chestnut-800 border border-chestnut-700 rounded-full shadow-lg mb-6">
            <GraduationCap className="h-8 w-8 text-vanilla-300" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-vanilla-100 mb-4 tracking-tight drop-shadow-md">
            Khóa Học Nghề Nail
          </h2>
          <p className="text-xl text-vanilla-300 font-script font-bold">
            🌟 Đào tạo kỹ năng từ cơ bản đến nâng cao
          </p>
        </div>

        {/* Course Grid - Light Cards floating on Dark Background */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {courses.map((course, idx) => (
            <div key={idx} className="bg-vanilla-50 rounded-3xl p-8 shadow-2xl shadow-black/30 hover:-translate-y-2 transition-all duration-300 border border-vanilla-200 group relative overflow-hidden">
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-chestnut-400 to-chestnut-600"></div>
              
              <div className="flex items-center gap-4 mb-6 pt-2">
                <div className="bg-chestnut-100 p-3.5 rounded-2xl group-hover:bg-chestnut-200 transition-colors shadow-inner">
                  {course.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-chestnut-800 group-hover:text-chestnut-600 transition-colors">
                  {course.title}
                </h3>
              </div>

              <ul className="space-y-3.5">
                {course.items.map((item, i) => (
                  <li key={i} className="flex items-start text-gray-700 font-menu text-sm md:text-base leading-relaxed">
                    <span className="mr-3 mt-1.5 w-1.5 h-1.5 bg-chestnut-400 rounded-full flex-shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              {/* Bonus tag */}
              {idx === 2 && (
                <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
                  <div className="flex items-center text-chestnut-600 text-sm font-bold animate-pulse-slow">
                    <Zap className="w-4 h-4 mr-2" />
                    CẬP NHẬT XU HƯỚNG MỚI
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* USP Section - Darker Elegant Box */}
        <div className="relative bg-chestnut-800/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-chestnut-700 overflow-hidden shadow-xl">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <h3 className="text-2xl md:text-4xl font-serif font-bold text-vanilla-100 mb-6 leading-tight">
                Vì sao nên chọn học nghề tại <br/>
                <span className="text-vanilla-300">Ki Nail Room?</span>
              </h3>
              <p className="text-vanilla-100/80 font-menu mb-8 text-lg leading-relaxed">
                Chúng tôi không chỉ dạy nghề, chúng tôi truyền cảm hứng và kinh nghiệm thực chiến để bạn tự tin khởi nghiệp.
              </p>
              <a 
                href="https://m.me/kinailroom" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center px-8 py-3.5 bg-vanilla-300 text-chestnut-900 rounded-full font-bold font-vn hover:bg-white transition-all shadow-lg shadow-chestnut-900/50 hover:shadow-vanilla-200/50 transform active:scale-95"
              >
                Đăng Ký Tư Vấn Ngay
              </a>
            </div>

            <div className="bg-chestnut-900/50 rounded-2xl p-6 md:p-8 border border-chestnut-700/50">
              <ul className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="w-6 h-6 text-vanilla-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-vanilla-100/90 font-menu font-medium text-base">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Training;