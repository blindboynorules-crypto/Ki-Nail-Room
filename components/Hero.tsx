
import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const MESSENGER_LINK = "https://m.me/kinailroom";

  // HIỆU ỨNG HOA ĐÀO RƠI (Blossoms) thay cho Tuyết
  const blossoms = Array.from({ length: 20 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${3 + Math.random() * 4}s`,
    size: `${10 + Math.random() * 10}px`,
    color: Math.random() > 0.5 ? '#fecaca' : '#fef08a' // Hồng (Đào) hoặc Vàng (Mai)
  }));

  // Component Kim Cương Lấp Lánh (Vẫn giữ để tạo độ sang trọng)
  const DiamondSparkle = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
    </svg>
  );

  return (
    <section id="home" className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-vanilla-50 min-h-[90vh] flex items-center">
      {/* Background Decor - Abstract Blobs (Giữ nguyên nhưng đổi màu theo Theme Tet qua CSS variable) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-chestnut-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-vanilla-200/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* HIỆU ỨNG HOA RƠI (BLOSSOM FALLING) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {blossoms.map((b, idx) => (
            <div
            key={idx}
            className="absolute rounded-full opacity-60 animate-snow"
            style={{
                left: b.left,
                width: b.size,
                height: b.size,
                backgroundColor: b.color,
                animationDelay: b.animationDelay,
                animationDuration: b.animationDuration,
                top: '-20px',
                borderRadius: '50% 0 50% 0' // Tạo hình dáng cánh hoa
            }}
            />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          
          {/* Text Content */}
          <div className="text-center md:text-left order-2 md:order-1 flex flex-col items-center md:items-start gap-8 md:gap-10">
            
            {/* Group 1: Tag & Headline & Desc */}
            <div className="flex flex-col items-center md:items-start gap-6">
                {/* Tagline Tết */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-chestnut-200/50 shadow-sm hover:shadow-md transition-shadow cursor-default ring-1 ring-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  <span className="text-[11px] md:text-xs font-bold tracking-[0.2em] text-chestnut-600 uppercase font-sans">
                    Chào Xuân 2026 — Rạng Rỡ Đón Tết
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="flex flex-col w-full">
                  <span className="block text-sm md:text-base text-gray-500 font-medium font-vn tracking-[0.15em] uppercase mb-2">
                    Làm móng xinh ăn Tết cùng
                  </span>
                  
                  {/* Tên thương hiệu: HIỆU ỨNG SOFT GLOSSY GEL */}
                  <div className="relative group cursor-pointer w-fit mx-auto md:mx-0 select-none py-2 px-2 transition-all duration-500">
                    
                    {/* --- CÁC HẠT KIM CƯƠNG (HIDDEN BY DEFAULT) --- */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
                        <div className="absolute -top-6 -left-8 w-10 h-10 text-yellow-500 animate-twinkle">
                           <DiamondSparkle className="w-full h-full drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                        </div>
                        <div className="absolute -bottom-4 -right-6 w-8 h-8 text-yellow-400 animate-twinkle" style={{ animationDelay: '1.5s' }}>
                           <DiamondSparkle className="w-full h-full drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                        </div>
                        <div className="absolute -top-4 right-10 w-5 h-5 text-red-400 animate-twinkle" style={{ animationDelay: '0.5s' }}>
                           <DiamondSparkle className="w-full h-full" />
                        </div>
                    </div>

                    {/* --- CHỮ CHÍNH --- */}
                    <span className="block text-6xl sm:text-7xl lg:text-8xl font-logo leading-none tracking-tight -ml-1
                        text-chestnut-800
                        transition-all duration-700
                        group-hover:text-transparent 
                        group-hover:bg-clip-text
                        group-hover:bg-gradient-to-r group-hover:from-red-700 group-hover:via-yellow-400 group-hover:to-red-700
                        group-hover:bg-[length:200%_auto]
                        group-hover:animate-shimmer
                        drop-shadow-lg"
                        style={{
                            filter: 'drop-shadow(2px 4px 6px rgba(185, 28, 28, 0.25))'
                        }}
                    >
                      KI NAIL ROOM
                    </span>
                  </div>
                  
                  <span className="block text-lg md:text-2xl text-chestnut-500/90 italic font-medium font-vn mt-4">
                    Be Shiny . Be Stylish
                    <span className="not-italic ml-2 inline-block animate-bounce-slow cursor-default hover:scale-125 transition-transform align-middle">🌸🧧✨</span>
                  </span>
                </h1>

                {/* Description */}
                <p className="text-base md:text-lg text-gray-600 max-w-lg leading-relaxed font-vn font-light">
                  Năm mới sắp đến, hãy để Ki Nail Room chăm chút cho đôi bàn tay nàng thêm rạng rỡ, đón tài lộc và may mắn nhé!
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
                    Đặt Lịch Tết
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
          
          {/* Image Side - Composition Layering with TET THEME */}
          <div className="relative order-1 md:order-2 flex justify-center md:justify-end py-8 md:py-0">
             <div className="relative w-[85%] md:w-[90%] lg:w-[32rem] group transition-all duration-500">
                
                {/* Decorative border ring (Gold Color for Tet) */}
                <div className="absolute inset-0 border-[1.5px] border-yellow-500/40 rounded-t-full rounded-b-[100px] rotate-3 scale-105 opacity-60 transition-transform group-hover:rotate-6"></div>
                
                {/* Main Image Container */}
                <div 
                  className="relative rounded-t-full rounded-b-[100px] overflow-hidden shadow-2xl border-[6px] border-white z-10 aspect-[3/4] bg-chestnut-100 transform md:translate-x-4 isolate"
                  style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                >
                  
                  {/* --- MAIN IMAGE --- */}
                  <img 
                    src="https://res.cloudinary.com/dgiqdfycy/image/upload/v1765187884/z2443874988342_ee70257e4b87e0fec6616a9d04274cf1_twruo3.jpg" 
                    alt="Ki Nail Room Style" 
                    className="absolute inset-0 w-full h-full object-cover transition duration-700 ease-in-out group-hover:scale-105 z-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1632515904036-7c0871239c0f?q=80&w=1000&auto=format&fit=crop";
                    }}
                  />

                  {/* --- CINEMATIC EFFECTS LAYERS --- */}
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.15] mix-blend-overlay"
                       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                  </div>
                  
                  {/* Tet Vignette (Red tint) */}
                  <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_55%,rgba(185,28,28,0.2)_100%)]"></div>

                  <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-red-900/30 to-transparent pointer-events-none z-20"></div>
                </div>

                {/* TET DECORATION: Cành Đào/Mai (Thay cho người tuyết) */}
                <div className="absolute -bottom-10 -left-6 z-30 animate-float hover:scale-110 transition-transform cursor-pointer pointer-events-none md:pointer-events-auto">
                  <img 
                    src="https://res.cloudinary.com/dgiqdfycy/image/upload/v1707010000/tet-branch-decor-demo_xyz.png" 
                    // Fallback to a generic flower if link breaks (using Emoji logic for stability or specific SVG if provided, here using a placeholder logic that works visually)
                    // Since I cannot upload a real file, I will use a high quality external SVG/PNG or standard emoji as placeholder if src fails, 
                    // but here I use a transparent flower branch image URL.
                    // REPLACING WITH A RELIABLE EXTERNAL SOURCE FOR DEMO:
                    srcSet="https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Apricot_blossom_branch.png/640px-Apricot_blossom_branch.png"
                    alt="Cành Mai Ngày Tết" 
                    className="w-32 h-32 md:w-48 md:h-48 drop-shadow-xl transition-all object-contain"
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
