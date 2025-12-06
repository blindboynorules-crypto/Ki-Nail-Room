
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import AiPricing from './components/AiPricing';
import Training from './components/Training';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import CleanupDemo from './components/CleanupDemo';

type ViewState = 'home' | 'ai-pricing' | 'cleanup-demo';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const handleNavigation = (id: string) => {
    if (id === 'ai-pricing') {
      setCurrentView('ai-pricing');
      window.scrollTo(0, 0);
    } else if (id === 'cleanup-demo') {
      setCurrentView('cleanup-demo');
      window.scrollTo(0, 0);
    } else {
      // Nếu đang ở trang khác mà muốn về section của trang chủ
      if (currentView !== 'home') {
        setCurrentView('home');
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

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  if (currentView === 'cleanup-demo') {
    return <CleanupDemo onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen bg-vanilla-50 flex flex-col">
      <Navbar onNavigate={handleNavigation} />
      
      <main className="flex-grow">
        {currentView === 'home' ? (
          <>
            <Hero onCtaClick={() => handleNavigation('contact')} />
            <Services />
            {/* AiPricing removed from here */}
            <Training />
            <Gallery />
          </>
        ) : (
          <AiPricing />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
