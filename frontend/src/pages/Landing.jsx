import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui'; // Import Logo component

// Modular Components
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import LeadMagnet from './landing/LeadMagnet';
import Features from './landing/Features';
import Pricing from './landing/Pricing';
import Footer from './landing/Footer';

const Landing = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll logic
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking for Spotlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const onCtaClick = () => navigate('/register');

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-sans overflow-x-hidden relative"
    >
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 h-0.5 bg-gradient-to-r from-accent via-accent-light to-accent z-[100] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {/* Main Sections */}
      <Navbar>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <Logo className="w-full h-full drop-shadow-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-accent to-[#F3E5AB] bg-clip-text text-transparent">
                JusCore AI v1.7
              </span>
            </Link>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors duration-200">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors duration-200">Pricing</a>
            </div>
            {/* CTA Button */}
            <div className="hidden md:block">
              <button
                onClick={onCtaClick}
                className="px-6 py-2 bg-accent text-white font-semibold rounded-full shadow-lg hover:bg-accent-dark transition-all duration-300 transform hover:-translate-y-1"
              >
                Get Started
              </button>
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-950 shadow-lg py-4">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Features</a>
              <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Pricing</a>
              <button
                onClick={onCtaClick}
                className="w-full mt-4 px-4 py-2 bg-accent text-white font-semibold rounded-full shadow-lg hover:bg-accent-dark transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </Navbar>
      <Hero onCtaClick={onCtaClick} />
      <LeadMagnet />
      <Features />
      <Pricing onCtaClick={onCtaClick} />
      <Footer onCtaClick={onCtaClick} />

      {/* Gold Spotlight Overlay - Moved to bottom to ensure it overlays sections, but below Navbar */}
      <div 
        className="pointer-events-none fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.15), transparent 45%)`
        }}
      />
    </div>
  );
};

export default Landing;
