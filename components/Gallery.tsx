import React, { useState, useRef, useEffect } from 'react';
import { GALLERY_IMAGES as FALLBACK_IMAGES } from '../constants';
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';

const Gallery: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0); // MẶC ĐỊNH LÀ 0 (ẢNH MỚI NHẤT)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const touchEndRef = useRef(0);
  const [source, setSource] = useState<'cloudinary' | 'fallback'>('fallback');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/get-images?folder=gallery');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Giới hạn tối đa 20 ảnh ngay tại frontend để chắc chắn
            setImages(data.slice(0, 20));
            setSource('cloudinary');
            setActiveIndex(0);
            setIsLoading(false);
            return;
          }
        }
        // Nếu API lỗi hoặc không có dữ liệu, không throw Error nữa để tránh rác console
        // Tự động chuyển sang fallback
        setImages(FALLBACK_IMAGES.slice(0, 20));
        setSource('fallback');
        setActiveIndex(0);
        setIsLoading(false);
      } catch (error) {
        // Lỗi mạng hoặc lỗi khác -> Fallback âm thầm
        setImages(FALLBACK_IMAGES.slice(0, 20));
        setSource('fallback');
        setActiveIndex(0);
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const getThumbnail = (url: string) => {
    if (url.includes('drive.google.com')) {
        try {
            const match = url.match(/\/d\/(.+?)(\/|$)/);
            if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        } catch (e) { return url; }
    }
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
    }
    return url;
  };

  const handleNext = () => {
    // Loop Logic: Nếu là ảnh cuối cùng -> Quay về 0
    setActiveIndex((prev) => (prev + 1) < images.length ? prev + 1 : 0);
  };

  const handlePrev = () => {
    // Loop Logic: Nếu là ảnh đầu tiên -> Quay về cuối
    setActiveIndex((prev) => (prev - 1) >= 0 ? prev - 1 : images.length - 1);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setStartX(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchEndRef.current = clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const distance = startX - touchEndRef.current;
    const minSwipeDistance = 50;

    if (touchEndRef.current !== 0) {
        if (distance > minSwipeDistance) handleNext();
        else if (distance < -minSwipeDistance) handlePrev();
    }
    touchEndRef.current = 0;
  };

  const getCardStyle = (index: number) => {
    const total = images.length;
    if (total === 0) return {};

    // --- LOGIC VÒNG LẶP VÔ TẬN (INFINITE LOOP) ---
    // Tính khoảng cách cơ bản
    let distance = index - activeIndex;

    // Điều chỉnh khoảng cách để tạo vòng tròn
    // Ví dụ: Có 20 ảnh. Đang ở ảnh 0. Ảnh 19 (cách 19 đơn vị) sẽ được coi là -1 (ngay bên trái)
    if (distance > total / 2) {
        distance -= total;
    } else if (distance < -total / 2) {
        distance += total;
    }

    const isActive = distance === 0;
    
    let xTranslate = '0%';
    let scale = 1;
    let opacity = 1;
    let zIndex = 10;
    let rotateY = '0deg';

    if (isActive) {
        xTranslate = '0%';
        scale = 1;
        opacity = 1;
        zIndex = 30;
        rotateY = '0deg';
    } else if (distance === 1) {
        xTranslate = '60%';
        scale = 0.85;
        opacity = 0.7;
        zIndex = 20;
        rotateY = '-15deg';
    } else if (distance === -1) {
        xTranslate = '-60%';
        scale = 0.85;
        opacity = 0.7;
        zIndex = 20;
        rotateY = '15deg';
    } else if (distance === 2) {
        xTranslate = '110%';
        scale = 0.7;
        opacity = 0.4;
        zIndex = 10;
        rotateY = '-25deg';
    } else if (distance === -2) {
        xTranslate = '-110%';
        scale = 0.7;
        opacity = 0.4;
        zIndex = 10;
        rotateY = '25deg';
    } else {
        // Các ảnh ở xa ẩn đi nhưng vẫn giữ logic 3D để animation mượt
        opacity = 0;
        scale = 0.5;
        zIndex = 0;
        // Nếu distance > 0 thì đẩy hẳn sang phải, < 0 đẩy sang trái
        xTranslate = distance > 0 ? '200%' : '-200%';
    }

    return {
        transform: `perspective(1000px) translateX(${xTranslate}) scale(${scale}) rotateY(${rotateY})`,
        WebkitTransform: `perspective(1000px) translateX(${xTranslate}) scale(${scale}) rotateY(${rotateY})`,
        opacity,
        zIndex,
        transition: 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
        WebkitBackfaceVisibility: 'hidden' as 'hidden',
        backfaceVisibility: 'hidden' as 'hidden',
    };
  };

  return (
    <section id="gallery" className="py-16 md:py-24 bg-vanilla-50 border-t border-chestnut-100 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
           <div className="inline-flex items-center justify-center p-3 mb-5 bg-white rounded-[1.5rem] shadow-xl shadow-chestnut-200/50 border-2 border-vanilla-200 relative group">
             <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-400 fill-vanilla-100 animate-pulse" style={{ animationDuration: '2s' }} />
             <Sparkles className="absolute -bottom-1 -left-2 w-3 h-3 text-chestnut-300 animate-bounce" style={{ animationDuration: '3s' }} />
             <div className="absolute top-0 left-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping opacity-75"></div>

             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-chestnut-600 relative z-10 transform group-hover:rotate-6 transition-transform duration-500">
                <rect x="2" y="6" width="20" height="15" rx="4" stroke="currentColor" strokeWidth="1.8" className="fill-vanilla-50" />
                <path d="M7 6L8.5 3H15.5L17 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="fill-white"/>
                <circle cx="12" cy="13.5" r="5.5" stroke="currentColor" strokeWidth="1.8" className="fill-white"/>
                <path d="M12 12C12 12 10.5 11 10.5 12.5C10.5 13.2 11.2 13.8 12 14.5C12.8 13.8 13.5 13.2 13.5 12.5C13.5 11 12 12 12 12Z" fill="currentColor" className="text-chestnut-400"/>
                <circle cx="18" cy="9.5" r="1" fill="currentColor" className="text-chestnut-300" />
             </svg>
           </div>

          <h2 className="text-3xl md:text-5xl font-serif font-bold text-chestnut-700 mb-4 drop-shadow-sm flex items-center justify-center gap-2">
            Thư Viện Ảnh
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-menu text-lg">
            Mẫu do học viên thực hiện dưới sự hướng dẫn của giảng viên.
          </p>
        </div>

        <div className="relative h-[450px] md:h-[600px] flex items-center justify-center select-none"
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
             onMouseDown={handleTouchStart}
             onMouseMove={handleTouchMove}
             onMouseUp={handleTouchEnd}
             onMouseLeave={handleTouchEnd}
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center text-chestnut-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-2" />
                    <p className="font-menu text-sm">Đang tải ảnh...</p>
                </div>
            ) : (
                <>
                    <button onClick={handlePrev} className="absolute left-4 md:left-20 z-50 p-3 rounded-full bg-white/80 hover:bg-white text-chestnut-700 shadow-lg backdrop-blur-sm transition-all hidden md:block group">
                        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <button onClick={handleNext} className="absolute right-4 md:right-20 z-50 p-3 rounded-full bg-white/80 hover:bg-white text-chestnut-700 shadow-lg backdrop-blur-sm transition-all hidden md:block group">
                        <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="relative w-full max-w-[300px] md:max-w-[400px] h-[400px] md:h-[550px] flex items-center justify-center">
                        {images.map((url, idx) => {
                            const style = getCardStyle(idx);
                            const distance = idx - activeIndex; // Chỉ dùng để so sánh index
                            let normalizedDistance = distance;
                            if (distance > images.length / 2) normalizedDistance -= images.length;
                            if (distance < -images.length / 2) normalizedDistance += images.length;

                            const isActive = normalizedDistance === 0;
                            
                            return (
                                <div 
                                    key={idx}
                                    className="absolute top-0 left-0 w-full h-full cursor-pointer"
                                    style={style}
                                    onClick={() => setActiveIndex(idx)}
                                >
                                    <div className={`relative w-full h-full rounded-3xl overflow-hidden bg-chestnut-100 ${isActive ? 'shadow-[0_20px_50px_-12px_rgba(77,35,30,0.6)]' : 'shadow-lg'}`}>
                                        <img 
                                            src={getThumbnail(url)} 
                                            alt={`Ki Nail Room Art ${idx + 1}`}
                                            className="w-full h-full object-cover pointer-events-none"
                                            referrerPolicy="no-referrer"
                                        />
                                        
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-chestnut-900/90 via-chestnut-900/40 to-transparent flex items-end justify-center">
                                                <h3 className="text-2xl font-serif font-bold text-white tracking-wide">Ki Nail Room</h3>
                                            </div>
                                        )}
                                        
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-chestnut-900/20 pointer-events-none transition-colors"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
        
        {!isLoading && (
            <div className="text-center mt-4 md:hidden animate-pulse">
                <span className="text-chestnut-400 text-sm font-menu flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Lướt để xem thêm <ChevronRight className="w-4 h-4" />
                </span>
            </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;