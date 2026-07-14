import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
}

// Official OnePlug Logo image with transparent background
export function OnePlugLogo({ className = "w-[240px] h-auto" }: { className?: string }) {
  return (
    <img 
      src="oneplug_logo.png" 
      alt="OnePlug Logo" 
      className={className}
      style={{ display: 'block' }}
    />
  );
}

export default function ContactForm({ isOpen, onClose }: ContactFormProps) {
  // Listen for Escape key to close the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible click catcher that covers the viewport to detect outside clicks, keeping the rest of the site fully visible and interactive-looking */}
          <div 
            className="fixed inset-0 z-35 bg-transparent cursor-default"
            onClick={onClose}
          />

          {/* Morphic Dialog Card anchored to the bottom-right corner */}
          <motion.div
            layoutId="contact-card-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ y: -4, boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }}
            transition={{ type: 'spring', damping: 26, stiffness: 170 }}
            className="fixed bottom-[84px] right-[32px] z-40 w-[calc(100vw-64px)] sm:w-[360px] bg-[#111111] border border-[#2A2A2A] rounded-[24px] md:rounded-[28px] p-6 md:p-8 shadow-2xl flex flex-col gap-6 pointer-events-auto"
          >
            {/* Logo container - perfectly centered */}
            <div className="flex justify-center items-center py-4 select-none">
              <OnePlugLogo className="w-[220px] sm:w-[250px] h-auto text-white" />
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-white/[0.06] w-full" />

            {/* Interactive Cards for Contact Details */}
            <div className="flex flex-col gap-4">
              {/* Email Card */}
              <a
                href="mailto:oneplug.charge@gmail.com"
                className="group/item flex flex-col gap-1.5 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
              >
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8E8E93] font-medium font-sans">
                  Email
                </span>
                <span className="text-sm font-sans font-normal text-[#F5F5F7] group-hover/item:text-white transition-colors duration-200">
                  oneplug.charge@gmail.com
                </span>
              </a>

              {/* Instagram Card */}
              <a
                href="https://instagram.com/onepluge.charge"
                target="_blank"
                rel="noopener noreferrer"
                className="group/item flex flex-col gap-1.5 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
              >
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8E8E93] font-medium font-sans">
                  Instagram
                </span>
                <span className="text-sm font-sans font-normal text-[#F5F5F7] group-hover/item:text-white transition-colors duration-200">
                  @onepluge.charge
                </span>
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
