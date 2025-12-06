import React, { useRef, useState, useEffect } from 'react';
import { SERVICE_MENU, SERVICE_SHOWCASE_IMAGES as FALLBACK_IMAGES } from '../constants';
import { Sparkles, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';

const Services: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'cloudinary' | 'fallback'>('fallback');

  // Fetch ảnh từ API folder 'showcase'
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/get-images?folder=showcase');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setImages(data.slice(0, 20)); // Giới hạn 20 ảnh
            setSource('cloudinary');
            setIsLoading(false);
            return;
          }
        }
        throw new Error(`API: ${response.status}`);
      } catch (error: any) {
        console.warn("Showcase: Using fallback images.", error);
        setImages(FALLBACK_IMAGES.slice(0, 20)); // Giới hạn 20 ảnh
        setSource('fallback');
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const getThumbnail = (url: string) => {
    if (url.includes('drive.google.com')) {
      try {
        const match = url.match(/\/d\/(.+?)(\/|$)/);
        if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`;
      } catch (e) { return url; }
    }
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', '/upload/w_600,q_auto,f_auto/');
    }
    return url;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      const scrollAmount = 300; // Khoảng cách mỗi lần cuộn

      if (direction === 'left') {
        if (scrollLeft <= 0) {
           // Nếu đang ở đầu -> Loop về cuối
           sliderRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
        } else {
           sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      } else {
        // Nếu đang ở cuối (cộng trừ sai số nhỏ) -> Loop về đầu
        if (scrollLeft + clientWidth >= scrollWidth - 5) {
           sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
           sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section id="services" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-script text-chestnut-700 mb-4 drop-shadow-sm hover:scale-105 transition-transform duration-500 cursor-default">Bảng Giá Dịch Vụ</h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-menu">
            Ki Nail Room cam kết sử dụng các sản phẩm chất lượng cao để bảo vệ móng của bạn.
          </p>
        </div>

        {/* Service Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {SERVICE_MENU.map((category) => (
            <div key={category.id} className="bg-vanilla-50 rounded-2xl p-6 border border-vanilla-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 flex flex-col h-full group">
              <h3 className="text-2xl md:text-3xl font-script font-bold text-chestnut-600 mb-6 border-b-2 border-chestnut-200 pb-3 inline-block text-center group-hover:text-chestnut-700 transition-colors">
                {category.title}
              </h3>
              <ul className="space-y-4 flex-grow">
                {category.items.map((item) => (
                  <li key={item.id} className="flex justify-between items-baseline group/item border-b border-dashed border-gray-200 pb-2 last:border-0 last:pb-0 font-menu">
                    <div className="pr-2 flex items-center">
                      <Sparkles className="h-3 w-3 text-chestnut-300 mr-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0 group-hover/item:animate-spin-slow" />
                      <span className="font-semibold text-gray-700 group-hover/item:text-chestnut-600 transition-colors text-sm md:text-base">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-chestnut-600 text-sm md:text-base whitespace-nowrap ml-2">
                      {item.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Horizontal Image Carousel */}
        <div className="mt-8 border-t border-gray-100 pt-12 relative">
            <div className="mb-8 px-2 text-center md:text-left flex flex-col md:flex-row items-center gap-3">
                 <h3 className="text-2xl font-serif font-bold text-chestnut-700">Tác Phẩm Của Ki Nail Room</h3>
            </div>
            
            <div className="mb-6 -mt-4 text-center md:text-left">
                 <p className="font-menu text-sm font-medium mt-1 flex items-center justify-center md:justify-start gap-2 text-gray-600">
                    <Sparkles className="w-4 h-4 text-chestnut-400 animate-pulse" />
                    Đội ngũ kỹ thuật viên có tay nghề vững, đáp ứng nhiều phong cách mẫu theo yêu cầu khách hàng.
                 </p>
            </div>
            
            <div className="relative group min-h-[300px]">
                {/* Loading State */}
                {isLoading && (
                     <div className="absolute inset-0 flex items-center justify-center bg-vanilla-50/80 z-20 backdrop-blur-sm rounded-xl">
                         <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-chestnut-500 animate-spin mb-2" />
                            <span className="text-xs text-chestnut-400 font-menu">Đang tải tác phẩm...</span>
                         </div>
                     </div>
                )}

                {/* Left Arrow Button */}
                <button 
                  onClick={() => scroll('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white text-chestnut-600 rounded-full shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 md:opacity-100 backdrop-blur-sm hover:scale-110 active:scale-90"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                {/* Right Arrow Button */}
                <button 
                  onClick={() => scroll('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white text-chestnut-600 rounded-full shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 md:opacity-100 backdrop-blur-sm hover:scale-110 active:scale-90"
                   aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <div 
                    ref={sliderRef}
                    className={`flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide px-2 ${isDown ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{ scrollBehavior: isDown ? 'auto' : 'smooth' }}
                >
                    {images.map((url, idx) => (
                        <div 
                            key={idx} 
                            className="flex-shrink-0 w-60 h-80 md:w-72 md:h-96 snap-center relative group/img"
                        >
                            <div className="w-full h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-vanilla-200 bg-white select-none">
                                <img 
                                    src={getThumbnail(url)} 
                                    alt={`Ki Nail Room Showcase ${idx}`}
                                    className="w-full h-full object-cover pointer-events-none group-hover/img:scale-105 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    draggable="false"
                                />
                                <div className="absolute inset-0 bg-chestnut-900/0 hover:bg-chestnut-900/10 transition-colors duration-300"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             <div className="flex items-center justify-center mt-6 text-sm text-chestnut-400 font-menu animate-pulse">
                <ChevronLeft className="w-4 h-4 mr-1 animate-bounce-horizontal" />
                Lướt xem thêm 
                <ChevronRight className="w-4 h-4 ml-1 animate-bounce-horizontal" />
             </div>
        </div>

      </div>
    </section>
  );
};

export default Services;