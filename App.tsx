import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Training from './components/Training';
import Gallery from './components/Gallery';
import Footer from './components/Footer';

const App: React.FC = () => {
  
  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Add smooth scrolling for HTML
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-vanilla-50 flex flex-col">
      <Navbar onNavigate={handleScrollToSection} />
      
      <main className="flex-grow">
        <Hero onCtaClick={() => handleScrollToSection('contact')} />
        <Services />
        <Training />
        <Gallery />
      </main>

      <Footer />
    </div>
  );
};

export default App;