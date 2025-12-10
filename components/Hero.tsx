
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

  // Component Kim Cương Lấp Lánh (Diamond Sparkle Icon)
  // Hình ngôi sao 4 cánh thon dài, sang trọng
  const DiamondSparkle = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
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
                  
                  {/* Tên thương hiệu: HIỆU ỨNG SOFT GLOSSY GEL (INTERACTIVE ONLY) */}
                  {/* Bình thường: Chữ đỏ lì, không hạt lấp lánh */}
                  {/* Hover/Touch: Chữ bóng, có ánh sáng chạy, hạt kim cương hiện ra */}
                  <div className="relative group cursor-pointer w-fit mx-auto md:mx-0 select-none py-2 px-2 transition-all duration-500">
                    
                    {/* --- CÁC HẠT KIM CƯƠNG (HIDDEN BY DEFAULT) --- */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
                        {/* D1: Góc trên trái */}
                        <div className="absolute -top-6 -left-8 w-10 h-10 text-chestnut-200 animate-twinkle">
                           <DiamondSparkle className="w-full h-full drop-shadow-[0_0_8px_rgba(237,207,202,0.8)]" />
                        </div>

                        {/* D2: Góc dưới phải */}
                        <div className="absolute -bottom-4 -right-6 w-8 h-8 text-chestnut-100 animate-twinkle" style={{ animationDelay: '1.5s' }}>
                           <DiamondSparkle className="w-full h-full drop-shadow-[0_0_5px_rgba(247,235,233,0.8)]" />
                        </div>

                        {/* D3: Góc trên phải */}
                        <div className="absolute -top-4 right-10 w-5 h-5 text-chestnut-300 animate-twinkle" style={{ animationDelay: '0.5s' }}>
                           <DiamondSparkle className="w-full h-full" />
                        </div>

                        {/* D4: Góc dưới trái */}
                        <div className="absolute bottom-2 -left-4 w-4 h-4 text-chestnut-200 animate-twinkle" style={{ animationDelay: '2.5s' }}>
                           <DiamondSparkle className="w-full h-full" />
                        </div>
                    </div>

                    {/* --- CHỮ CHÍNH --- */}
                    <span className="block text-6xl sm:text-7xl lg:text-8xl font-logo leading-none tracking-tight -ml-1
                        text-chestnut-800
                        transition-all duration-700
                        group-hover:text-transparent 
                        group-hover:bg-clip-text
                        group-hover:bg-gradient-to-r group-hover:from-chestnut-700 group-hover:via-chestnut-300 group-hover:to-chestnut-700
                        group-hover:bg-[length:200%_auto]
                        group-hover:animate-shimmer
                        drop-shadow-lg"
                        style={{
                            filter: 'drop-shadow(2px 4px 6px rgba(111, 50, 35, 0.25))'
                        }}
                    >
                      KI NAIL ROOM
                    </span>
                    
                    {/* Lớp phủ bóng (Gloss Overlay) - Chỉ hiện khi Hover */}
                    <span className="absolute inset-0 text-6xl sm:text-7xl lg:text-8xl font-logo leading-none tracking-tight -ml-1 text-white opacity-0 group-hover:opacity-10 pointer-events-none mix-blend-overlay transition-opacity duration-700" aria-hidden="true">
                      KI NAIL ROOM
                    </span>
                  </div>
                  
                  <span className="block text-lg md:text-2xl text-chestnut-500/90 italic font-medium font-vn mt-4">
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
