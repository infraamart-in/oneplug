import React from 'react';
import { SectionContent } from '../types';

interface StorySectionProps {
  section: SectionContent;
  index: number;
  opacity: number;
  isMobile?: boolean;
  key?: string | number | React.Key;
}

export default function StorySection({ section, index, opacity, isMobile = false }: StorySectionProps) {
  const isLeftAligned = section.position === 'left' || isMobile;

  return (
    <div
      style={{
        opacity,
        pointerEvents: opacity > 0.5 ? 'auto' : 'none',
        transition: 'opacity 800ms ease-in-out',
      }}
      className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
    >
      {isMobile ? (
        /* Mobile Portrait Layout: structured vertical flow with top title, middle animation spacer, and bottom subtext */
        <div className="w-full h-full flex flex-col justify-between px-6 pt-[10vh] pb-[8vh] text-left select-none box-border">
          {/* Hero Title */}
          <div className="w-full">
            <h2 className="font-display text-[36px] xs:text-[40px] sm:text-[44px] font-bold text-white tracking-[-0.025em] leading-[1.1] max-w-[500px]">
              {section.heading}
            </h2>
          </div>
          
          {/* Middle Spacer for Horizontally/Vertically Centered Scroll Animation (Canvas) */}
          <div className="flex-1 min-h-[200px] max-h-[35vh] w-full" />
          
          {/* Subtitle / Supporting text */}
          <div className="w-full mt-auto">
            <div className="font-sans text-base sm:text-lg text-[#A1A1AA] font-normal leading-[1.6] max-w-[500px]">
              {Array.isArray(section.body) ? (
                section.body.map((paragraph, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-2" : ""}>{paragraph}</p>
                ))
              ) : (
                <p>{section.body}</p>
              )}
            </div>
          </div>
        </div>
      ) : isLeftAligned ? (
        /* Left-aligned Desktop/Tablet Layout */
        <div className="w-full h-full relative">
          <div className="absolute top-[14vh] sm:top-[16vh] left-[8%] sm:left-[10%] pr-6 sm:pr-0 max-w-[850px] text-left">
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-medium text-[#F5F5F7] tracking-[-0.025em] leading-[1.02]">
              {section.heading}
            </h2>
          </div>
          <div className="absolute bottom-6 md:bottom-10 left-[8%] sm:left-[10%] w-full max-w-[500px] text-left px-6 sm:px-0 flex flex-col items-start">
            <div className="font-sans text-lg sm:text-xl text-[#A1A1AA] font-normal leading-[1.6] tracking-[0em] max-w-[500px]">
              {Array.isArray(section.body) ? (
                section.body.map((paragraph, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-2" : ""}>{paragraph}</p>
                ))
              ) : (
                <p>{section.body}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Center/Right-aligned Desktop/Tablet Layout */
        <div className="w-full h-full relative flex flex-col items-center">
          <div className="absolute top-[15vh] sm:top-[17vh] w-full max-w-[900px] text-center px-6 flex flex-col gap-6 items-center">
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-medium text-[#F5F5F7] tracking-[-0.025em] leading-[1.02] max-w-[850px]">
              {section.heading}
            </h2>
          </div>
          <div className="absolute bottom-6 md:bottom-10 left-[8%] sm:left-[10%] w-full max-w-[500px] text-left px-6 sm:px-0 flex flex-col items-start">
            <div className="font-sans text-lg sm:text-xl text-[#A1A1AA] font-normal leading-[1.6] tracking-[0em] max-w-[500px]">
              {Array.isArray(section.body) ? (
                section.body.map((paragraph, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-2" : ""}>{paragraph}</p>
                ))
              ) : (
                <p>{section.body}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
