
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import AiPricing from './components/AiPricing';
import Training from './components/Training';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import Privacy from './components/Privacy';
import { applyTheme } from './theme';

type ViewState = 'home' | 'ai-pricing' | 'admin-dashboard' | 'privacy';

const App: React.FC = () => {
  // KHỞI TẠO THEME
  useEffect(() => {
    // Gọi hàm này để áp dụng theme được cài đặt trong file theme.ts
    applyTheme();
  }, []);

  // CẢI TIẾN: Kiểm tra URL ngay lúc khởi tạo để hiển thị đúng trang lập tức
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    if (typeof window !== 'undefined') {
      // Loại bỏ dấu gạch chéo cuối nếu có để so sánh chính xác (vd: /privacy/ -> /privacy)
      const path = window.location.pathname.replace(/\/$/, '');
      if (path === '/privacy') return 'privacy';
      if (path === '/admin') return 'admin-dashboard';
    }
    return 'home';
  });

  // Lắng nghe sự kiện Back/Forward của trình duyệt để chuyển trang đúng
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/$/, '');
      if (path === '/privacy') {
        setCurrentView('privacy');
      } else if (path === '/admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigation = (id: string) => {
    if (id === 'ai-pricing') {
      setCurrentView('ai-pricing');
      window.scrollTo(0, 0);
      window.history.pushState(null, '', '/');
    } else if (id === 'admin-dashboard') {
      setCurrentView('admin-dashboard');
      window.scrollTo(0, 0);
      window.history.pushState(null, '', '/admin');
    } else if (id === 'privacy') {
      setCurrentView('privacy');
      window.scrollTo(0, 0);
      window.history.pushState(null, '', '/privacy');
    } else {
      // Logic điều hướng trong trang chủ (Scroll to section)
      if (currentView !== 'home') {
        setCurrentView('home');
        window.history.pushState(null, '', '/');
        // Đợi render xong trang home rồi mới cuộn
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo(0, 0);
          }
        }, 100);
      } else {
        // Đang ở trang chủ rồi thì cuộn luôn
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  };

  // Smooth scroll behavior global
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  if (currentView === 'admin-dashboard') {
    return <AdminDashboard onBack={() => handleNavigation('home')} />;
  }

  return (
    <div className="min-h-screen bg-vanilla-50 flex flex-col transition-colors duration-700">
      <Navbar onNavigate={handleNavigation} />
      
      <main className="flex-grow">
        {currentView === 'home' ? (
          <>
            <Hero 
                onCtaClick={() => handleNavigation('contact')} 
                onAiPricingClick={() => handleNavigation('ai-pricing')}
            />
            <Services />
            <Training />
            <Gallery />
          </>
        ) : currentView === 'ai-pricing' ? (
          <AiPricing />
        ) : currentView === 'privacy' ? (
          <Privacy onBack={() => handleNavigation('home')} />
        ) : null}
      </main>

      <Footer onPrivacyClick={() => handleNavigation('privacy')} />
    </div>
  );
};

export default App;
