
import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const MESSENGER_LINK = "https://m.me/kinailroom";

  // Tạo mảng bông tuyết với vị trí ngẫu nhiên
  const snowflakes = Array.from({ length: 20 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${2 + Math.random() * 3}s`,
    size: `${4 + Math.random() * 6}px`,
  }));

  // Component Pháo hoa đơn giản (Simple Firework Icon)
  const SimpleFirework = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* 8 tia lớn */}
      <path d="M12 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 18V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M22 12H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 12H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M19.07 4.93L16.24 7.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7.76 16.24L4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M19.07 19.07L16.24 16.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Tâm tròn nhỏ (Tùy chọn) */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" className="opacity-50"/>
    </svg>
  );

  return (
    <section id="home" className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-vanilla-50 min-h-[90vh] flex items-center">
      {/* Background Decor - Abstract Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vanilla-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-chestnut-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          
          {/* Text Content */}
          <div className="text-center md:text-left order-2 md:order-1 flex flex-col items-center md:items-start gap-8 md:gap-10">
            
            {/* Group 1: Tag & Headline & Desc */}
            <div className="flex flex-col items-center md:items-start gap-6">
                {/* Tagline */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-chestnut-200/50 shadow-sm hover:shadow-md transition-shadow cursor-default ring-1 ring-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-chestnut-500 animate-pulse"></span>
                  <span className="text-[11px] md:text-xs font-bold tracking-[0.2em] text-chestnut-600 uppercase font-sans">
                    Est. 2020 — Korean & Japanese Style
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="flex flex-col w-full">
                  <span className="block text-sm md:text-base text-gray-500 font-medium font-vn tracking-[0.15em] uppercase mb-2">
                    Đến chơi và làm móng xinh với
                  </span>
                  
                  {/* Tên thương hiệu: HIỆU ỨNG SIMPLE FIREWORK (STARBURST) + SHIMMER TEXT */}
                  <div className="relative group cursor-pointer w-fit mx-auto md:mx-0 select-none py-4 px-4">
                    
                    {/* --- CỤM PHÁO HOA TRANG TRÍ --- */}
                    
                    {/* X1: Pháo hoa MỚI - Góc trên trái (Ngoài cùng) - Vàng Gold */}
                    <div className="absolute -top-8 -left-10 w-12 h-12 text-yellow-500/80 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out transform group-hover:-rotate-12 group-hover:scale-110">
                       <SimpleFirework className="w-full h-full animate-[spin_8s_linear_infinite]" />
                    </div>

                    {/* X2: Pháo hoa MỚI - Góc dưới phải (Ngoài cùng) - Hồng Phấn */}
                    <div className="absolute -bottom-6 -right-8 w-10 h-10 text-chestnut-300 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out delay-100 transform group-hover:rotate-12 group-hover:scale-110">
                       <SimpleFirework className="w-full h-full animate-[spin_10s_linear_infinite_reverse]" />
                    </div>

                    {/* Pháo hoa cũ 1: Góc trên trái (Sát chữ) - Vàng */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75 transform group-hover:rotate-45">
                       <SimpleFirework className="w-full h-full animate-[spin_10s_linear_infinite]" />
                    </div>

                    {/* Pháo hoa cũ 2: Góc dưới phải (Sát chữ) - Hồng */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 text-chestnut-400 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-150 transform group-hover:-rotate-45">
                       <SimpleFirework className="w-full h-full animate-[spin_12s_linear_infinite_reverse]" />
                    </div>

                    {/* Pháo hoa 3: Góc trên phải (Xa hơn) - Cam nhạt */}
                    <div className="absolute -top-6 right-4 w-5 h-5 text-orange-200/80 opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 transform group-hover:rotate-90">
                       <SimpleFirework className="w-full h-full animate-pulse" />
                    </div>

                    {/* Pháo hoa 4: Góc dưới trái (Nhỏ) - Vàng chanh */}
                    <div className="absolute -bottom-2 -left-4 w-5 h-5 text-yellow-200 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                       <SimpleFirework className="w-full h-full animate-spin-slow" />
                    </div>

                    {/* --- CHỮ CHÍNH --- */}
                    {/* Hiệu ứng: Màu gốc Nâu Đỏ -> Hover: Ánh sáng MỀM MẠI (Soft Gold) chạy qua */}
                    <span className="block text-6xl sm:text-7xl lg:text-8xl font-logo leading-none drop-shadow-sm uppercase tracking-tight -ml-1
                        text-transparent bg-clip-text 
                        bg-gradient-to-r from-chestnut-700 via-chestnut-700 to-chestnut-700
                        group-hover:from-chestnut-700 group-hover:via-[#E8DCC4] group-hover:to-chestnut-700
                        bg-[length:300%_auto]
                        group-hover:animate-shimmer
                        transition-all duration-700">
                      KI NAIL ROOM
                    </span>
                  </div>
                  
                  <span className="block text-lg md:text-2xl text-chestnut-500/90 italic font-medium font-vn mt-2">
                    theo phong cách Hàn - Nhật nàng nhé 
                    <span className="not-italic ml-2 inline-block animate-bounce-slow cursor-default hover:scale-125 transition-transform align-middle">💅🌸✨</span>
                  </span>
                </h1>

                {/* Description */}
                <p className="text-base md:text-lg text-gray-600 max-w-lg leading-relaxed font-vn font-light">
                  Nơi mang lại vẻ đẹp nhẹ nhàng, tinh tế và trendy nhất cho đôi bàn tay của bạn. Hãy để Ki chăm sóc móng xinh cho nàng nha!
                </p>
            </div>

            {/* Group 2: Buttons - Action Area */}
            <div className="flex flex-row items-center gap-4 w-full max-w-md md:max-w-none pt-2">
              <a 
                href={MESSENGER_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex-1 md:flex-none md:w-48 flex items-center justify-center px-6 py-4 rounded-full font-bold font-vn text-sm md:text-base whitespace-nowrap overflow-hidden transition-all duration-300 shadow-xl active:scale-95
                           bg-chestnut-600/90 backdrop-blur-md border border-white/20 shadow-chestnut-500/30 ring-1 ring-white/20 ring-inset text-white
                           hover:bg-chestnut-500/90 hover:-translate-y-1 hover:shadow-chestnut-500/50"
              >
                <span className="relative z-10 flex items-center">
                    Đặt Lịch Ngay
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
              </a>
              
              <a 
                href="tel:0919979763"
                className="relative flex-1 md:flex-none md:w-48 flex items-center justify-center px-6 py-4 rounded-full font-bold font-vn text-sm md:text-base whitespace-nowrap overflow-hidden transition-all duration-300 shadow-lg active:scale-95
                           bg-white/60 backdrop-blur-md border border-white/60 shadow-gray-200/50 ring-1 ring-white/40 ring-inset text-chestnut-700
                           hover:bg-white/90 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center">
                    <Phone className="mr-2 h-4 w-4 group-hover:animate-wiggle" />
                    Gọi Hotline
                </span>
                 <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent opacity-60 pointer-events-none"></div>
              </a>
            </div>
          </div>
          
          {/* Image Side - Composition Layering */}
          <div className="relative order-1 md:order-2 flex justify-center md:justify-end py-8 md:py-0">
             <div className="relative w-[85%] md:w-[90%] lg:w-[32rem] group transition-all duration-500">
                
                {/* Decorative border ring */}
                <div className="absolute inset-0 border-[1.5px] border-chestnut-300 rounded-t-full rounded-b-[100px] rotate-3 scale-105 opacity-60 transition-transform group-hover:rotate-6"></div>
                
                {/* Main Image Container */}
                <div className="relative rounded-t-full rounded-b-[100px] overflow-hidden shadow-2xl border-[6px] border-white z-10 aspect-[3/4] bg-chestnut-100 transform md:translate-x-4">
                  <img 
                    src="https://res.cloudinary.com/dgiqdfycy/image/upload/v1765187884/z2443874988342_ee70257e4b87e0fec6616a9d04274cf1_twruo3.jpg" 
                    alt="Ki Nail Room Style" 
                    className="w-full h-full object-cover transition duration-700 ease-in-out group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1632515904036-7c0871239c0f?q=80&w=1000&auto=format&fit=crop";
                    }}
                  />
                  
                  {/* SNOW EFFECT OVERLAY */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {snowflakes.map((flake, idx) => (
                      <div
                        key={idx}
                        className="absolute bg-white rounded-full opacity-80 animate-snow"
                        style={{
                          left: flake.left,
                          width: flake.size,
                          height: flake.size,
                          animationDelay: flake.animationDelay,
                          animationDuration: flake.animationDuration,
                          top: '-10px'
                        }}
                      />
                    ))}
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-chestnut-900/30 to-transparent pointer-events-none"></div>
                </div>

                {/* SNOWMAN IMAGE */}
                <div className="absolute -bottom-4 -left-4 md:-left-2 z-30 animate-bounce-slow hover:scale-110 transition-transform cursor-pointer">
                  <img 
                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Snowman.png" 
                    alt="Cute Snowman" 
                    className="w-24 h-24 md:w-32 md:h-32 drop-shadow-xl transition-all"
                  />
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
