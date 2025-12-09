import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // --- ADMIN EASTER EGG STATES ---
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const clickTimeoutRef = useRef<any>(null);

  const navLinks = [
    { name: 'Trang Chủ', id: 'home' },
    { name: 'Dịch Vụ', id: 'services' },
    { name: 'Báo Giá AI', id: 'ai-pricing' },
    { name: 'Đào Tạo', id: 'training' },
    { name: 'Thư Viện', id: 'gallery' },
  ];

  const handleNavClick = (id: string) => {
    setIsOpen(false); // Đóng menu ngay lập tức
    onNavigate(id);
  };

  // --- LOGO CLICK LOGIC ---
  const handleLogoClick = (e: React.MouseEvent) => {
    setIsOpen(false); // Đóng menu nếu đang mở
    onNavigate('home');

    setLogoClickCount(prev => {
        const newCount = prev + 1;
        if (newCount === 5) {
            setIsAdminModalOpen(true);
            return 0; // Reset sau khi mở
        }
        return newCount;
    });

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
        setLogoClickCount(0);
    }, 2000);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setAdminError('');

    setTimeout(() => {
        if (adminPassword === '220314') {
            // CẬP NHẬT: Cho phép đăng nhập Admin trên cả domain .com
            const hostname = window.location.hostname;
            const isProduction = hostname.includes('kinailroom.vercel.app') || hostname.includes('kinailroom.com');

            if (isProduction) {
                window.location.href = '/api/cleanup-images';
            } else {
                setIsAdminModalOpen(false);
                setAdminPassword('');
                setIsChecking(false);
                onNavigate('cleanup-demo'); 
            }
        } else {
            setAdminError('Mật khẩu không chính xác');
            setIsChecking(false);
        }
    }, 800);
  };

  const MESSENGER_LINK = "https://m.me/kinailroom";
  const LOGO_URL = "https://drive.google.com/thumbnail?id=1Bc9vIFq3TEVqwYvjX8iQ2qHgaEpZhzT1&sz=w500";

  return (
    <>
    {/* Thêm top-0 left-0 để ghim sát lề, loại bỏ khoảng trắng */}
    <nav className="fixed top-0 left-0 w-full z-[100] bg-vanilla-50/80 backdrop-blur-md shadow-sm border-b border-white/20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo Section */}
          <div 
            className="flex flex-col items-center justify-center cursor-pointer group py-1 select-none" 
            onClick={handleLogoClick}
          >
            <img 
              src={LOGO_URL} 
              alt="Ki Nail Room" 
              className={`h-12 md:h-16 w-auto object-contain transition-transform duration-200 ease-out ${logoClickCount > 0 ? 'scale-90 opacity-80' : 'hover:scale-105'}`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.id)}
                className="text-gray-600 hover:text-chestnut-500 font-medium font-vn transition-all duration-300 text-sm tracking-wide hover:-translate-y-0.5"
              >
                {link.name.toUpperCase()}
              </button>
            ))}
            <a 
              href={MESSENGER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 rounded-full font-bold font-vn text-sm transition-all duration-300 
                         bg-chestnut-600/90 text-white backdrop-blur-sm 
                         border border-white/20 shadow-[0_4px_14px_0_rgba(150,75,52,0.39)] 
                         ring-1 ring-white/20 ring-inset
                         hover:bg-chestnut-500/90 hover:shadow-[0_6px_20px_rgba(150,75,52,0.23)] hover:-translate-y-0.5 active:scale-95"
            >
              Đặt Lịch
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-chestnut-600 hover:bg-chestnut-50/50 rounded-xl transition-transform duration-200 active:scale-90 backdrop-blur-sm border border-transparent hover:border-chestnut-100"
              aria-label="Menu"
            >
              {isOpen ? <X className="h-6 w-6 animate-spin-once" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-vanilla-50/95 backdrop-blur-xl border-b border-chestnut-100 animate-fade-in shadow-xl absolute w-full left-0 top-16">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.id)}
                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium font-vn text-gray-700 hover:text-chestnut-600 hover:bg-white/50 active:bg-white/80 transition-colors"
              >
                {link.name}
              </button>
            ))}
             <a 
              href={MESSENGER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-4 py-3 font-bold text-base rounded-xl mt-4 font-vn active:scale-95 transition-transform
                         bg-chestnut-600/90 text-white backdrop-blur-sm border border-white/20 shadow-lg ring-1 ring-white/20 ring-inset"
            >
              Đặt Lịch Ngay
            </a>
          </div>
        </div>
      )}
    </nav>

    {/* --- ADMIN LOGIN POPUP --- */}
    {isAdminModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-chestnut-900/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/50 animate-float transform transition-all">
                
                {/* Header */}
                <div className="bg-chestnut-600/90 p-6 text-center relative backdrop-blur-sm">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/30 shadow-inner">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white tracking-wide drop-shadow-sm">
                        Quản Trị Viên
                    </h3>
                    <p className="text-chestnut-100 text-xs font-sans mt-1 opacity-80">
                        Hệ thống dành riêng cho Admin Ki Nail
                    </p>
                    <button 
                        onClick={() => setIsAdminModalOpen(false)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 rounded-full p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAdminLogin} className="p-6 md:p-8">
                    <div className="mb-6 relative">
                        <label className="block text-xs font-bold text-chestnut-600 uppercase tracking-wider mb-2 ml-1">
                            Mật khẩu truy cập
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                type="password" 
                                value={adminPassword}
                                onChange={(e) => {
                                    setAdminPassword(e.target.value);
                                    if(adminError) setAdminError('');
                                }}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200/60 rounded-xl leading-5 bg-white/60 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-chestnut-500/50 focus:border-chestnut-500 sm:text-sm font-sans transition-shadow shadow-inner"
                                placeholder="Nhập mã PIN..."
                                autoFocus
                            />
                        </div>
                        {adminError && (
                            <p className="text-red-500 text-xs mt-2 ml-1 flex items-center animate-wiggle">
                                <span className="mr-1">●</span> {adminError}
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit"
                        disabled={isChecking || !adminPassword}
                        className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white font-vn uppercase tracking-wide transition-all border border-white/20 ring-1 ring-white/10 ring-inset backdrop-blur-sm ${
                            isChecking 
                            ? 'bg-chestnut-400 cursor-wait' 
                            : 'bg-chestnut-600/90 hover:bg-chestnut-500/90 hover:shadow-chestnut-500/30 active:scale-95'
                        }`}
                    >
                        {isChecking ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <>
                                Truy Cập Hệ Thống <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )}
    </>
  );
};

export default Navbar;