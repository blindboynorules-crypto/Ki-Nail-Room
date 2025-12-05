import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Trang Chủ', id: 'home' },
    { name: 'Dịch Vụ', id: 'services' },
    { name: 'Báo Giá AI', id: 'ai-pricing' }, // New Link
    { name: 'Đào Tạo', id: 'training' },
    { name: 'Thư Viện', id: 'gallery' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  const MESSENGER_LINK = "https://m.me/kinailroom";
  const LOGO_URL = "https://drive.google.com/thumbnail?id=1Bc9vIFq3TEVqwYvjX8iQ2qHgaEpZhzT1&sz=w500";

  return (
    <nav className="fixed w-full z-[100] bg-vanilla-50/95 backdrop-blur-md shadow-sm border-b border-chestnut-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo Section */}
          <div 
            className="flex flex-col items-center justify-center cursor-pointer group py-1" 
            onClick={() => handleNavClick('home')}
          >
            <img 
              src={LOGO_URL} 
              alt="Ki Nail Room" 
              className="h-12 md:h-16 w-auto object-contain hover:scale-105 transition-transform duration-300" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const textNode = document.createElement('div');
                  textNode.className = "flex flex-col items-center select-none";
                  textNode.innerHTML = `
                    <span class="text-[8px] md:text-[10px] font-serif tracking-[0.2em] text-chestnut-600 mb-0.5 opacity-80">EST. 2020</span>
                    <h1 class="font-serif text-lg md:text-2xl font-black text-chestnut-500 tracking-wide leading-none uppercase">KI NAIL ROOM</h1>
                  `;
                  parent.appendChild(textNode);
                }
              }}
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.id)}
                className="text-gray-600 hover:text-chestnut-500 font-medium font-vn transition-colors duration-200 text-sm tracking-wide"
              >
                {link.name.toUpperCase()}
              </button>
            ))}
            <a 
              href={MESSENGER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-chestnut-500 text-white px-5 py-1.5 rounded-full font-medium font-vn hover:bg-chestnut-600 transition shadow-md shadow-chestnut-200 text-sm inline-block"
            >
              Đặt Lịch
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-chestnut-600 hover:bg-chestnut-50 rounded-lg transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-vanilla-50 border-b border-chestnut-100 animate-fade-in shadow-xl absolute w-full left-0 top-16">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.id)}
                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium font-vn text-gray-700 hover:text-chestnut-600 hover:bg-vanilla-100 active:bg-vanilla-200 transition-colors"
              >
                {link.name}
              </button>
            ))}
             <a 
              href={MESSENGER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-3 text-chestnut-600 font-bold text-base bg-chestnut-50 rounded-xl mt-4 border border-chestnut-200 font-vn"
            >
              Đặt Lịch Ngay
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;