import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

// Intersection Observer hook (migrated to useInView under the hood for clean integration)
export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: options.once !== false, 
    amount: options.threshold || 0.1 
  });
  return [ref, isInView];
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

// Fade + Slide (Framer Motion spring-based component)
export const ScrollReveal = ({ children, className = '', delay = 0, direction = 'up', duration = 800, scale = false }) => {
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {}
  };

  const initialVal = {
    opacity: 0,
    ...directions[direction],
    ...(scale ? { scale: 0.95 } : {})
  };

  return (
    <motion.div
      className={className}
      initial={initialVal}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: duration / 1000,
        delay: delay / 1000,
        type: 'spring',
        stiffness: 60,
        damping: 15
      }}
    >
      {children}
    </motion.div>
  );
};

// Animated Number Counter with Framer Motion animate and transform
export const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());
  const [displayValue, setDisplayValue] = useState("0");
  
  useEffect(() => {
    if (isInView) {
      const controls = animate(count, end, {
        duration: duration / 1000,
        ease: "easeOut"
      });
      return controls.stop;
    }
  }, [isInView, end, duration]);
  
  useEffect(() => {
    return rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [rounded]);

  return <span ref={ref}>{prefix}{displayValue}{suffix}</span>;
};

export const TypewriterText = ({ texts, className = '' }) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(80);

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    const currentWord = texts[index % texts.length];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing: add next character
        const nextText = currentWord.substring(0, text.length + 1);
        setText(nextText);

        if (nextText === currentWord) {
          // Finished typing: pause at the end of the word
          setSpeed(1500);
          setIsDeleting(true);
        } else {
          // Keep typing characters
          setSpeed(80);
        }
      } else {
        // Deleting: remove character
        const nextText = currentWord.substring(0, text.length - 1);
        setText(nextText);

        if (nextText === '') {
          // Finished deleting: pause before starting the next word
          setIsDeleting(false);
          setIndex((prev) => prev + 1);
          setSpeed(300);
        } else {
          // Keep deleting characters
          setSpeed(40);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, speed, texts]);

  return (
    <span className="inline-flex flex-wrap items-baseline justify-center whitespace-normal">
      <span className={`${className} whitespace-normal break-words`}>{text}</span>
      <motion.span 
        className="ml-0.5 shrink-0" 
        style={{ borderRight: '3px solid var(--brand-primary, #D4AF37)', height: '0.85em', display: 'inline-block' }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      />
    </span>
  );
};
