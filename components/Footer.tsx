import React from 'react';
import { Phone, MapPin, Clock, Facebook, Instagram, ArrowRight } from 'lucide-react';

// Custom TikTok Icon component since it's not in Lucide
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
  </svg>
);

interface FooterProps {
  onPrivacyClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onPrivacyClick }) => {
  const FACEBOOK_LINK = "https://www.facebook.com/kinailroom/";
  const INSTAGRAM_LINK = "https://www.instagram.com/kinailroom/";
  const TIKTOK_LINK = "https://www.tiktok.com/@kinailroom/";
  const MESSENGER_LINK = "https://m.me/kinailroom";
  const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/7nYhRa38d49p3L158";

  return (
    <footer id="contact" className="bg-vanilla-50 text-gray-800 pt-16 pb-12 border-t border-chestnut-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          {/* Brand Column (Span 5) */}
          <div className="md:col-span-5 flex flex-col items-start">
            <div className="mb-8">
               <h3 className="text-4xl md:text-5xl font-serif font-black text-chestnut-600 tracking-tight leading-none uppercase drop-shadow-sm hover:scale-105 transition-transform duration-500 origin-left cursor-default">
                 KI NAIL ROOM
               </h3>
               <p className="text-sm font-bold text-chestnut-400 tracking-[0.35em] mt-3 uppercase pl-1">
                 Be Shiny . Be Stylish
               </p>
            </div>
            <p className="text-gray-600 leading-loose mb-8 pr-4 font-menu text-lg">
              Góc nhỏ làm đẹp với phong cách Hàn - Nhật nhẹ nhàng. Nơi nâng niu đôi bàn tay và giúp nàng thêm tự tin, rạng rỡ mỗi ngày. 🌿💅
            </p>
            
            {/* Social Icons */}
            <div className="flex space-x-4">
              <a 
                href={FACEBOOK_LINK} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook"
                className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-chestnut-600 hover:bg-chestnut-600 hover:text-white hover:border-chestnut-600 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 hover:rotate-12"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href={INSTAGRAM_LINK}
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-chestnut-600 hover:bg-chestnut-600 hover:text-white hover:border-chestnut-600 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 hover:-rotate-12"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href={TIKTOK_LINK}
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-chestnut-600 hover:bg-chestnut-600 hover:text-white hover:border-chestnut-600 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-110"
              >
                <TikTokIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Contact Info (Span 3) */}
          <div className="md:col-span-3">
            <h4 className="text-xl md:text-2xl font-serif font-bold text-chestnut-700 mb-8 flex items-center">
              <span className="w-8 h-[3px] bg-chestnut-400 mr-3 rounded-full"></span>
              Liên Hệ
            </h4>
            <ul className="space-y-6 text-gray-600 font-menu text-base md:text-lg">
              <li className="flex items-start group cursor-pointer">
                <MapPin className="h-6 w-6 mr-3 text-chestnut-500 shrink-0 mt-1 group-hover:animate-bounce" />
                <a 
                  href={GOOGLE_MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group-hover:text-chestnut-700 transition-colors hover:underline leading-relaxed"
                >
                  231 Đ. số 8, Bình Hưng Hoà A, Bình Tân, TP. Hồ Chí Minh
                </a>
              </li>
              <li className="flex items-center group cursor-pointer">
                <Phone className="h-6 w-6 mr-3 text-chestnut-500 shrink-0 group-hover:animate-wiggle" />
                <a href="tel:0919979763" className="font-bold group-hover:text-chestnut-700 transition-colors tracking-wide text-xl">
                  0919 979 763
                </a>
              </li>
            </ul>
          </div>

          {/* Hours & CTA (Span 4) */}
          <div className="md:col-span-4">
            <h4 className="text-xl md:text-2xl font-serif font-bold text-chestnut-700 mb-8 flex items-center">
              <span className="w-8 h-[3px] bg-chestnut-400 mr-3 rounded-full"></span>
              Giờ Mở Cửa
            </h4>
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-chestnut-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <ul className="space-y-4 text-gray-600 font-menu text-base md:text-lg mb-8">
                <li className="flex justify-between items-center border-b border-dashed border-gray-100 pb-3 last:border-0">
                  <span className="text-gray-500 font-medium">Thứ 2 - Chủ Nhật:</span>
                  <span className="font-bold text-chestnut-600 text-xl font-sans">9:30 - 20:00</span>
                </li>
              </ul>
              
              <a 
                href={MESSENGER_LINK} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block w-full group relative overflow-hidden bg-chestnut-600 text-white p-4 rounded-2xl text-center transition-all hover:bg-chestnut-700 active:scale-95 shadow-lg shadow-chestnut-200"
              >
                <div className="relative z-10 flex items-center justify-center font-bold text-base uppercase tracking-widest">
                  Đặt lịch ngay
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
              <p className="text-center text-sm text-gray-400 mt-4 italic font-menu">
                Vui lòng đặt lịch trước qua điện thoại hoặc Messenger.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 font-menu">
          <p className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Ki Nail Room. All rights reserved.</span>
            {onPrivacyClick && (
              <button onClick={onPrivacyClick} className="hover:text-chestnut-500 hover:underline">Privacy Policy</button>
            )}
          </p>
          <p className="mt-2 md:mt-0 font-script text-xl text-chestnut-400 animate-pulse-slow">Thank you for choosing us!</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;