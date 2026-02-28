import React, { useState, useEffect, useRef } from 'react';

// Intersection Observer hook for scroll-triggered animations
export const useScrollReveal = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.once !== false) observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    const currentElement = elementRef.current;
    if (currentElement) observer.observe(currentElement);

    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, [options]);

  return [elementRef, isVisible];
};

// Parallax hook
export const useParallax = (speed = 0.3) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
};

// Fade + Slide (configurable direction)
export const ScrollReveal = ({ children, className = '', delay = 0, direction = 'up', duration = 800, scale = false }) => {
  const [ref, isVisible] = useScrollReveal();
  
  const directions = {
    up: 'translate-y-12',
    down: '-translate-y-12',
    left: 'translate-x-12',
    right: '-translate-x-12',
    none: ''
  };

  return (
    <div
      ref={ref}
      className={`transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? 'translate(0, 0) scale(1)' 
          : `${directions[direction]} ${scale ? 'scale(0.95)' : ''}`,
      }}
    >
      {children}
    </div>
  );
};

// Animated Number Counter
export const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal();
  
  useEffect(() => {
    if (!isVisible) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

export const TypewriterText = ({ texts, className = '' }) => {
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    let timer;
    
    const handleType = () => {
      const i = loopNum % texts.length;
      const fullText = texts[i];

      if (isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        setTypingSpeed(40);
      } else {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        setTypingSpeed(80);
      }

      if (!isDeleting && currentText === fullText) {
        setTypingSpeed(1500); // Pause at end
        setIsDeleting(true);
      } else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(300); // Pause before next word
      }
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, loopNum, texts, typingSpeed]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse border-r-2 border-accent ml-1" />
    </span>
  );
};
