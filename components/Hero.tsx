
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

  return (
    <section id="home" className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden bg-vanilla-50">
      {/* Background Decor - Abstract Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vanilla-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-chestnut-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Text Content */}
          <div className="text-center md:text-left order-2 md:order-1 flex flex-col items-center md:items-start">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-chestnut-100 shadow-sm mb-6 hover:shadow-md transition-shadow cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-chestnut-500 animate-pulse"></span>
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-chestnut-600 uppercase">
                Est. 2020 — Korean & Japanese Style
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif leading-tight mb-5 w-full">
              <span className="block text-lg md:text-xl text-gray-500 font-light mb-2 font-vn tracking-wide">
                Đến chơi và làm móng xinh với
              </span>
              <span className="block text-4xl md:text-6xl font-black text-chestnut-700 tracking-tight leading-none mb-3 drop-shadow-sm">
                KI NAIL ROOM
              </span>
              <span className="block text-xl md:text-2xl text-chestnut-500 italic font-medium">
                theo phong cách Hàn - Nhật nàng nhé 
                <span className="not-italic ml-2 inline-block animate-bounce-slow cursor-default hover:scale-125 transition-transform">💅🌸✨</span>
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base text-gray-600 mb-8 max-w-md leading-relaxed font-vn font-light">
              Nơi mang lại vẻ đẹp nhẹ nhàng, tinh tế và trendy nhất cho đôi bàn tay của bạn.
            </p>

            {/* Buttons - Always Row - Fixed for Mobile */}
            <div className="flex flex-row items-center gap-3 w-full max-w-md md:max-w-none">
              <a 
                href={MESSENGER_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center px-2 py-3.5 md:px-8 bg-chestnut-600 text-white rounded-full font-bold font-vn hover:bg-chestnut-700 transition-all shadow-lg shadow-chestnut-200 active:scale-95 text-[13px] md:text-base hover:-translate-y-1 whitespace-nowrap overflow-hidden"
              >
                Đặt Lịch Ngay
                <ArrowRight className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
              </a>
              
              <a 
                href="tel:0919979763"
                className="flex-1 flex items-center justify-center px-2 py-3.5 md:px-8 bg-white text-chestnut-600 border-2 border-chestnut-100 rounded-full font-bold font-vn hover:border-chestnut-600 hover:text-chestnut-700 transition-all shadow-sm active:scale-95 text-[13px] md:text-base active:bg-green-600 active:text-white active:border-green-600 active:shadow-inner whitespace-nowrap overflow-hidden"
              >
                <Phone className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:animate-wiggle group-active:text-white" />
                Gọi Hotline
              </a>
            </div>
          </div>
          
          {/* Image Side - Composition Layering */}
          <div className="relative order-1 md:order-2 flex justify-center md:justify-end py-8">
             {/* INCREASED WIDTH HERE: w-80 md:w-[28rem] lg:w-[32rem] */}
             <div className="relative w-80 md:w-[28rem] lg:w-[32rem] group transition-all duration-500">
                
                {/* Decorative border ring */}
                <div className="absolute inset-0 border-[1px] border-chestnut-300 rounded-t-full rounded-b-[100px] rotate-3 scale-105 opacity-60 transition-transform group-hover:rotate-6"></div>
                
                {/* Main Image Container */}
                <div className="relative rounded-t-full rounded-b-[100px] overflow-hidden shadow-2xl border-[4px] border-white z-10 aspect-[3/4] bg-chestnut-100">
                  <img 
                    src="https://drive.google.com/thumbnail?id=1XSy0IKZ_D_bUcfHrmADzfctEuIkeCWIM&sz=w1000" 
                    alt="Ki Nail Room Style" 
                    className="w-full h-full object-cover transition duration-700 ease-in-out group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1632515904036-7c0871239c0f?q=80&w=1000&auto=format&fit=crop";
                    }}
                  />
                  
                  {/* SNOW EFFECT OVERLAY (Hiệu ứng Tuyết) */}
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
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-chestnut-900/40 to-transparent pointer-events-none"></div>
                </div>

                {/* SNOWMAN IMAGE (Góc dưới trái) - MÀU GỐC (TRẮNG XANH) */}
                <div className="absolute -bottom-2 -left-6 z-30 animate-bounce-slow hover:scale-110 transition-transform cursor-pointer">
                  <img 
                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Snowman.png" 
                    alt="Cute Snowman" 
                    className="w-24 h-24 drop-shadow-lg transition-all"
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
