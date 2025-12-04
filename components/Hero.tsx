import React from 'react';
import { ArrowRight, Sparkles, Phone } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const MESSENGER_LINK = "https://m.me/kinailroom";

  return (
    <section id="home" className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden bg-vanilla-50">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vanilla-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-chestnut-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Text Content - Optimized Typography */}
          <div className="text-center md:text-left order-2 md:order-1 flex flex-col items-center md:items-start">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-chestnut-100 shadow-sm mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-chestnut-500"></span>
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-chestnut-600 uppercase">
                Est. 2020 — Korean & Japanese Style
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif leading-tight mb-5 w-full">
              <span className="block text-lg md:text-xl text-gray-500 font-light mb-2 font-sans">
                Đến chơi và làm móng xinh với
              </span>
              <span className="block text-4xl md:text-6xl font-black text-chestnut-700 tracking-tight leading-none mb-3 drop-shadow-sm">
                KI NAIL ROOM
              </span>
              <span className="block text-xl md:text-2xl text-chestnut-500 italic font-medium">
                theo phong cách Hàn - Nhật nàng nhé 
                <span className="not-italic ml-2 inline-block animate-bounce-slow">💅🌸✨</span>
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base text-gray-600 mb-8 max-w-md leading-relaxed font-sans font-light">
              Nơi mang lại vẻ đẹp nhẹ nhàng, tinh tế và trendy nhất cho đôi bàn tay của bạn.
            </p>

            {/* Buttons */}
            <div className="flex flex-row gap-4 w-full justify-center md:justify-start">
              <a 
                href={MESSENGER_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center px-7 py-3 bg-chestnut-600 text-white rounded-full font-medium hover:bg-chestnut-700 transition-all shadow-lg shadow-chestnut-200 active:scale-95 text-sm md:text-base"
              >
                Đặt Lịch Ngay
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              
              {/* Hotline Button - Updated */}
              <a 
                href="tel:0919979763"
                className="flex items-center justify-center px-7 py-3 bg-white text-chestnut-600 border border-chestnut-200 rounded-full font-medium hover:bg-vanilla-50 transition-all shadow-sm active:scale-95 text-sm md:text-base"
              >
                <Phone className="mr-2 h-4 w-4 text-chestnut-500" />
                Hotline: 0919.979.763
              </a>
            </div>
          </div>
          
          {/* Image Side - Reduced Size */}
          <div className="relative order-1 md:order-2 flex justify-center md:justify-end py-4">
             <div className="relative w-64 md:w-80 group">
                {/* Decorative border ring */}
                <div className="absolute inset-0 border-[1px] border-chestnut-300 rounded-t-full rounded-b-[100px] rotate-3 scale-105 opacity-60"></div>
                
                {/* Main Image Container */}
                <div className="relative rounded-t-full rounded-b-[100px] overflow-hidden shadow-2xl border-[4px] border-white z-10 aspect-[3/4] bg-chestnut-100">
                  <img 
                    src="https://drive.google.com/thumbnail?id=1XSy0IKZ_D_bUcfHrmADzfctEuIkeCWIM&sz=w1000" 
                    alt="Ki Nail Room Style" 
                    className="w-full h-full object-cover transition duration-700 ease-in-out group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1632515904036-7c0871239c0f?q=80&w=1000&auto=format&fit=crop";
                    }}
                  />
                  {/* Subtle overlay gradient at bottom only */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-chestnut-900/40 to-transparent pointer-events-none"></div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-4 z-20 bg-white p-3 rounded-full shadow-lg animate-pulse-slow hidden md:block">
                  <div className="bg-vanilla-100 rounded-full p-2">
                     <Sparkles className="h-5 w-5 text-chestnut-500" />
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;