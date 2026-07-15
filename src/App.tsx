import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionContent } from './types';
import StorySection from './components/StorySection';
import ContactForm, { OnePlugLogo } from './components/ContactForm';

// Sections data, with Hero prepended
const sectionsData: SectionContent[] = [
  {
    id: 'hero',
    heading: "One app. Every charging network.",
    body: "Access every major EV charging network through one seamless experience. No multiple apps. No switching wallets. Just charge.",
    position: 'left',
  },
  {
    id: 'section-02',
    heading: "Too many apps. Too many wallets",
    body: [
      "Different charging providers.",
      "Different payment methods.",
      "Different user experiences."
    ],
    position: 'right',
  },
  {
    id: 'section-03',
    heading: "One Map. One Payment",
    body: "Find charging stations across multiple EV charging networks and pay seamlessly without switching between different apps or wallets.",
    position: 'left',
  },
  {
    id: 'section-04',
    heading: "Designed around drivers",
    body: "Locate. Navigate. Charge. Pay. Everything in one experience.",
    position: 'center',
  },
  {
    id: 'section-05',
    heading: "Meet OnePlug",
    body: "One platform connecting your complete EV charging journey.",
    position: 'left',
  }
];

// Indicators mapping
const indicatorItems = [
  { id: 'hero', label: '01 // HERO' },
  { id: 'section-02', label: '02 // PAYMENTS' },
  { id: 'section-03', label: '03 // EXPERIENCE' },
  { id: 'section-04', label: '04 // DRIVERS' },
  { id: 'section-05', label: '05 // ONEPLUG' },
  { id: 'final-section', label: '06 // MEET ONEPLUG' },
];

const PIXELS_PER_FRAME = 15;

// Disjoint localized opacity calculation function: Persistent text (0-70%), Outgoing fades (70-82%), Buffer gap (82-88%), Incoming fades (88-100%)
const getSectionOpacity = (index: number, progress: number, totalSections: number) => {
  const numSteps = totalSections - 1; // 6
  const step = 1 / numSteps;
  
  const i = Math.floor(progress / step);
  const nextIdx = i + 1;
  
  if (i >= numSteps) {
    return index === numSteps ? 1 : 0;
  }
  if (i < 0) {
    return index === 0 ? 1 : 0;
  }
  
  const center_i = i * step;
  const L = step;
  const t = (progress - center_i) / L; // Progress within the current transition step [0, 1]
  
  if (index === i) {
    // Current section is fully visible for the first 70% of the segment
    if (t <= 0.70) {
      return 1;
    } else if (t < 0.82) {
      // Fade out over the next 12% of segment
      const norm = (t - 0.70) / 0.12;
      // Smoothstep fade out: 1 - (3x^2 - 2x^3)
      return 1 - (3 * norm * norm - 2 * norm * norm * norm);
    }
    return 0;
  } else if (index === nextIdx) {
    // Next section fades in over the final 12% of segment
    if (t > 0.88) {
      const norm = (t - 0.88) / 0.12;
      // Smoothstep fade in: 3x^2 - 2x^3
      return 3 * norm * norm - 2 * norm * norm * norm;
    }
    return 0;
  }
  
  return 0;
};

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // State used for dot indicators highlight
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  
  // Responsive mobile state tracking
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Canvas and frames caching refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const lastRenderedIndexRef = useRef<number>(-1);
  
  // DOM modification refs (for direct DOM updates yielding 60 FPS)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finalSectionRef = useRef<HTMLDivElement | null>(null);
  
  // References for scroll tracking and gesture controls
  const lastActiveIndexRef = useRef<number>(0);
  const lastTransitionTimeRef = useRef<number>(0);
  const touchStartRef = useRef<number>(0);
  const activeIndexRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const scrollAnimationRef = useRef<number | null>(null);
  const mobileFrameAnimRef = useRef<number | null>(null);

  // Sync active states with refs for use in stable event listeners
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Prevent all early interactions (scrolls, keys, gestures, pointer events, focus) during loading
  useEffect(() => {
    if (!isLoading) return;

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const preventKeys = (e: KeyboardEvent) => {
      const keys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
      if (keys.includes(e.code) || e.key === ' ') {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });
    window.addEventListener('keydown', preventKeys, { passive: false });

    // Focus Lock
    const activeEl = document.activeElement as HTMLElement;
    if (activeEl) activeEl.blur();

    const handleFocus = (e: FocusEvent) => {
      e.preventDefault();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };
    document.addEventListener('focusin', handleFocus);

    return () => {
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('keydown', preventKeys);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [isLoading]);

  // Reset scroll position on loading screen complete
  useEffect(() => {
    if (!isLoading) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    }
  }, [isLoading]);

  // Cancel programmatic scroll animation when user scrolls manually
  useEffect(() => {
    const cancelScrollAnimation = () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };

    window.addEventListener('wheel', cancelScrollAnimation, { passive: true });
    window.addEventListener('touchstart', cancelScrollAnimation, { passive: true });
    
    const preventKeys = (e: KeyboardEvent) => {
      const keys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
      if (keys.includes(e.code) || e.key === ' ') {
        cancelScrollAnimation();
      }
    };
    window.addEventListener('keydown', preventKeys, { passive: true });

    return () => {
      window.removeEventListener('wheel', cancelScrollAnimation);
      window.removeEventListener('touchstart', cancelScrollAnimation);
      window.removeEventListener('keydown', preventKeys);
    };
  }, []);

  // Monitor viewport size and handle responsive layout changes
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      resizeCanvas();
      
      // Force initial frame redraw on resize
      if (!mobile && framesRef.current.length > 0) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        const frameIndex = Math.min(framesRef.current.length - 1, Math.max(0, Math.round(progress * (framesRef.current.length - 1))));
        drawFrame(frameIndex);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 4K Canvas frame renderer
  const drawFrame = (index: number) => {
    if (index === lastRenderedIndexRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const totalFrames = 421;
    
    // Find the nearest loaded frame to prevent black flashes or empty spaces
    let img = framesRef.current[index];
    if (!img) {
      // Search backwards
      for (let i = index - 1; i >= 0; i--) {
        if (framesRef.current[i]) {
          img = framesRef.current[i];
          break;
        }
      }
    }
    
    // If still not found, search forwards
    if (!img) {
      for (let i = index + 1; i < totalFrames; i++) {
        if (framesRef.current[i]) {
          img = framesRef.current[i];
          break;
        }
      }
    }
    
    if (!img) return; // No image loaded at all yet
    
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    
    let renderWidth, renderHeight;
    if (imgRatio > canvasRatio) {
      renderWidth = w;
      renderHeight = w / imgRatio;
    } else {
      renderWidth = h * imgRatio;
      renderHeight = h;
    }
    
    const x = (w - renderWidth) / 2;
    const y = (h - renderHeight) / 2;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, x, y, renderWidth, renderHeight);
    
    lastRenderedIndexRef.current = index;
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  };

  // Manage native scrolling and height adjustments on loading cycle completion
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflowY = 'hidden';
      document.body.style.height = '100%';
      return;
    }

    if (isMobile) {
      // Mobile locks scrollbar, uses programmatic transitions
      document.body.style.overflowY = 'hidden';
      document.body.style.height = '100%';
      
      // Set initial slides visibility for mobile
      sectionsData.forEach((_, idx) => {
        const el = sectionRefs.current[idx];
        if (el) {
          el.style.opacity = idx === activeIndexRef.current ? '1' : '0';
          el.style.visibility = idx === activeIndexRef.current ? 'visible' : 'hidden';
          el.style.pointerEvents = idx === activeIndexRef.current ? 'auto' : 'none';
        }
      });
      const finalEl = finalSectionRef.current;
      if (finalEl) {
        finalEl.style.opacity = activeIndexRef.current === sectionsData.length ? '1' : '0';
        finalEl.style.visibility = activeIndexRef.current === sectionsData.length ? 'visible' : 'hidden';
        finalEl.style.pointerEvents = activeIndexRef.current === sectionsData.length ? 'auto' : 'none';
      }
    } else {
      // Desktop/Tablet allows native scrolling
      document.body.style.overflowY = 'auto';
      document.body.style.height = `${framesRef.current.length * PIXELS_PER_FRAME + window.innerHeight}px`;

      // Trigger initial scroll render cycle after layout paint
      const handleInitialUpdate = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        
        if (framesRef.current.length > 0) {
          const frameIndex = Math.min(framesRef.current.length - 1, Math.max(0, Math.round(progress * (framesRef.current.length - 1))));
          drawFrame(frameIndex);
        }

        sectionsData.forEach((_, idx) => {
          const opacity = getSectionOpacity(idx, progress, sectionsData.length + 1);
          const el = sectionRefs.current[idx];
          if (el) {
            el.style.opacity = String(opacity);
            el.style.visibility = opacity > 0 ? 'visible' : 'hidden';
            el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
          }
        });

        const finalOpacity = getSectionOpacity(sectionsData.length, progress, sectionsData.length + 1);
        const finalEl = finalSectionRef.current;
        if (finalEl) {
          finalEl.style.opacity = String(finalOpacity);
          finalEl.style.visibility = finalOpacity > 0 ? 'visible' : 'hidden';
          finalEl.style.pointerEvents = finalOpacity > 0.5 ? 'auto' : 'none';
        }
      };

      requestAnimationFrame(() => {
        handleInitialUpdate();
      });
    }

    return () => {
      document.body.style.height = '';
      document.body.style.overflowY = '';
    };
  }, [isLoading, isMobile]);

  // Bind to native window scroll: recalculates frame targets and writes opacities/visibilities directly to DOM (DESKTOP/TABLET ONLY)
  useEffect(() => {
    if (isLoading || isMobile) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

      // 1. Render frame index proportional to scroll (direct drawing - no time animation)
      if (framesRef.current.length > 0) {
        const frameIndex = Math.min(framesRef.current.length - 1, Math.max(0, Math.round(progress * (framesRef.current.length - 1))));
        drawFrame(frameIndex);
      }

      // 2. Write opacity and visibility directly to the DOM bypassing React's diff engine (Solid 60 FPS)
      sectionsData.forEach((_, idx) => {
        const opacity = getSectionOpacity(idx, progress, sectionsData.length + 1);
        const el = sectionRefs.current[idx];
        if (el) {
          el.style.opacity = String(opacity);
          el.style.visibility = opacity > 0 ? 'visible' : 'hidden';
          el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
        }
      });

      // Update final section overlay
      const finalOpacity = getSectionOpacity(sectionsData.length, progress, sectionsData.length + 1);
      const finalEl = finalSectionRef.current;
      if (finalEl) {
        finalEl.style.opacity = String(finalOpacity);
        finalEl.style.visibility = finalOpacity > 0 ? 'visible' : 'hidden';
        finalEl.style.pointerEvents = finalOpacity > 0.5 ? 'auto' : 'none';
      }

      // 3. Update the dot indicators state on boundary crossing
      const activeIdIdx = Math.min(sectionsData.length, Math.max(0, Math.round(progress * sectionsData.length)));
      if (activeIdIdx !== lastActiveIndexRef.current) {
        setActiveIndex(activeIdIdx);
        lastActiveIndexRef.current = activeIdIdx;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, isMobile]);

  // Programmatic mobile frame sequence interpolation animator
  const animateMobileFrames = (fromIndex: number, toIndex: number, duration = 440) => {
    const startFrame = Math.round(420 * fromIndex / 5);
    const targetFrame = Math.round(420 * toIndex / 5);
    const diff = targetFrame - startFrame;
    if (diff === 0) return;

    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      const easedProgress = easeInOutCubic(progress);
      const currentFrame = Math.round(startFrame + diff * easedProgress);
      drawFrame(currentFrame);

      if (progress < 1.0) {
        mobileFrameAnimRef.current = requestAnimationFrame(step);
      } else {
        mobileFrameAnimRef.current = null;
      }
    };

    if (mobileFrameAnimRef.current) {
      cancelAnimationFrame(mobileFrameAnimRef.current);
    }
    mobileFrameAnimRef.current = requestAnimationFrame(step);
  };

  // Programmatic transitions on Mobile (swipe triggers)
  const triggerMobileTransition = (direction: number) => {
    const nextIndex = activeIndexRef.current + direction;
    if (nextIndex < 0 || nextIndex > sectionsData.length || isTransitioningRef.current) return;
    
    lastTransitionTimeRef.current = performance.now();
    isTransitioningRef.current = true;
    
    const currIdx = activeIndexRef.current;
    
    // Animate background sequence frames in sync with mobile scroll transition
    animateMobileFrames(currIdx, nextIndex, 440);
    
    // 1. Fade out current section
    const elCurr = sectionRefs.current[currIdx] || (currIdx === sectionsData.length ? finalSectionRef.current : null);
    if (elCurr) {
      elCurr.style.transition = 'opacity 220ms ease-in-out';
      elCurr.style.opacity = '0';
      elCurr.style.pointerEvents = 'none';
      setTimeout(() => {
        elCurr.style.visibility = 'hidden';
      }, 220);
    }
    
    // 2. Fade in next section after 220ms
    setTimeout(() => {
      const elNext = sectionRefs.current[nextIndex] || (nextIndex === sectionsData.length ? finalSectionRef.current : null);
      if (elNext) {
        elNext.style.visibility = 'visible';
        elNext.style.transition = 'opacity 220ms ease-in-out';
        elNext.getBoundingClientRect(); // force layout reflow
        elNext.style.opacity = '1';
        elNext.style.pointerEvents = 'auto';
      }
    }, 220);
    
    // 3. Unlock after 440ms
    setTimeout(() => {
      setActiveIndex(nextIndex);
      isTransitioningRef.current = false;
    }, 440);
  };

  // Programmatic transitions for dot clicks on Mobile
  const triggerMobileJumpTransition = (targetIndex: number) => {
    const currIdx = activeIndexRef.current;
    if (targetIndex < 0 || targetIndex > sectionsData.length || targetIndex === currIdx || isTransitioningRef.current) return;
    
    lastTransitionTimeRef.current = performance.now();
    isTransitioningRef.current = true;
    
    // Animate background sequence frames in sync with mobile jump transition
    animateMobileFrames(currIdx, targetIndex, 440);
    
    // 1. Fade out current section
    const elCurr = sectionRefs.current[currIdx] || (currIdx === sectionsData.length ? finalSectionRef.current : null);
    if (elCurr) {
      elCurr.style.transition = 'opacity 220ms ease-in-out';
      elCurr.style.opacity = '0';
      elCurr.style.pointerEvents = 'none';
      setTimeout(() => {
        elCurr.style.visibility = 'hidden';
      }, 220);
    }
    
    // 2. Fade in target section after 220ms
    setTimeout(() => {
      const elNext = sectionRefs.current[targetIndex] || (targetIndex === sectionsData.length ? finalSectionRef.current : null);
      if (elNext) {
        elNext.style.visibility = 'visible';
        elNext.style.transition = 'opacity 220ms ease-in-out';
        elNext.getBoundingClientRect();
        elNext.style.opacity = '1';
        elNext.style.pointerEvents = 'auto';
      }
    }, 220);
    
    // 3. Unlock after 440ms
    setTimeout(() => {
      setActiveIndex(targetIndex);
      isTransitioningRef.current = false;
    }, 440);
  };

  // Bind Wheel scroll gestures (MOBILE ONLY - programmatically intercepted)
  useEffect(() => {
    if (isLoading || !isMobile) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = performance.now();
      if (now - lastTransitionTimeRef.current < 600 || isTransitioningRef.current) return;
      
      if (Math.abs(e.deltaY) < 15) return;
      
      if (e.deltaY > 0) {
        triggerMobileTransition(1);  // Scroll Down
      } else {
        triggerMobileTransition(-1); // Scroll Up
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isLoading, isMobile]);

  // Bind Touch gesture swipe listeners (MOBILE ONLY - programmatically intercepted)
  useEffect(() => {
    if (isLoading || !isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEnd = e.changedTouches[0].clientY;
      const deltaY = touchStartRef.current - touchEnd;
      
      const now = performance.now();
      if (now - lastTransitionTimeRef.current < 600 || isTransitioningRef.current) return;
      
      if (Math.abs(deltaY) < 50) return; // 50px swipe threshold
      
      if (deltaY > 0) {
        triggerMobileTransition(1);  // Swipe Up -> Next
      } else {
        triggerMobileTransition(-1); // Swipe Down -> Prev
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isLoading, isMobile]);

  // Preload and cache frames in public/
  useEffect(() => {
    resizeCanvas();

    const loadSingleFrameWithRetry = (frameIdx: number, retries = 3): Promise<HTMLImageElement> => {
      const frameStr = String(frameIdx).padStart(4, '0');
      const url = `oneplug_bg_frames/frame_${frameStr}.jpg`;
      
      const attempt = (remaining: number): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if ('decode' in img) {
              img.decode()
                .then(() => resolve(img))
                .catch(() => resolve(img));
            } else {
              resolve(img);
            }
          };
          img.onerror = () => {
            if (remaining > 0) {
              setTimeout(() => {
                attempt(remaining - 1).then(resolve).catch(reject);
              }, 100);
            } else {
              reject(new Error(`Failed to load frame ${frameIdx}`));
            }
          };
          img.src = url;
        });
      };
      
      return attempt(retries);
    };

    const loadAllFrames = async () => {
      try {
        const totalFrames = 421;
        framesRef.current = new Array(totalFrames);

        // Fallback Timeout: 15 seconds
        const timeoutId = setTimeout(() => {
          console.warn('Preloading timed out. Entering website with available assets.');
          if (framesRef.current[0]) {
            drawFrame(0);
          }
          setIsLoading(false);
        }, 15000);

        if (isMobile) {
          // Mobile Progressive Loader:
          // 1. Load the 6 critical section anchor frames first
          const anchors = [0, 84, 168, 252, 336, 420];
          let loadedAnchorsCount = 0;
          
          const anchorPromises = anchors.map(async (idx) => {
            try {
              const img = await loadSingleFrameWithRetry(idx + 1);
              framesRef.current[idx] = img;
              loadedAnchorsCount++;
              setLoadingPercent(Math.round((loadedAnchorsCount / anchors.length) * 100));
            } catch (err) {
              console.error(`Failed to load anchor frame ${idx + 1}`, err);
            }
          });
          
          await Promise.all(anchorPromises);
          drawFrame(0);
          clearTimeout(timeoutId);
          setIsLoading(false);
          
          // 2. Lazy load the remaining frames in the background (batching of 5 in parallel to prevent congestion)
          const lazyLoadRemaining = async () => {
            const batchSize = 5;
            const remainingIndices: number[] = [];
            for (let i = 0; i < totalFrames; i++) {
              if (!anchors.includes(i)) {
                remainingIndices.push(i);
              }
            }
            
            for (let i = 0; i < remainingIndices.length; i += batchSize) {
              const batch = remainingIndices.slice(i, i + batchSize);
              await Promise.all(
                batch.map(async (idx) => {
                  try {
                    const img = await loadSingleFrameWithRetry(idx + 1);
                    framesRef.current[idx] = img;
                  } catch (err) {
                    // Fail silently for background lazy loads
                  }
                })
              );
              // Yield main thread to prevent UI freezing
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          };
          
          // Run lazy load in background
          setTimeout(lazyLoadRemaining, 1000);
          return;
        }

        // Desktop loads ALL 421 frames in parallel
        let loadedCount = 0;
        const promises = [];
        
        for (let i = 1; i <= totalFrames; i++) {
          promises.push(
            loadSingleFrameWithRetry(i)
              .then(img => {
                framesRef.current[i - 1] = img;
                loadedCount++;
                setLoadingPercent(Math.round((loadedCount / totalFrames) * 100));
              })
              .catch(err => {
                console.warn(`Failed to preload frame ${i}`, err);
              })
          );
        }

        await Promise.all(promises);

        // Draw the first frame immediately
        drawFrame(0);
        
        clearTimeout(timeoutId);
        setIsLoading(false);
      } catch (err) {
        console.error('Preloading failed:', err);
        setIsLoading(false);
      }
    };

    loadAllFrames();
  }, [isMobile]);

  // Eased programmatic smooth scrolling
  const animateScrollTo = (targetScrollTop: number, duration = 1500) => {
    const startScrollTop = window.scrollY || document.documentElement.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    if (distance === 0) return;

    const startTime = performance.now();

    // easeInOutQuart for a smooth, premium, cinematic camera motion profile
    const easeInOutQuart = (t: number): number => {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    };

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      const easedProgress = easeInOutQuart(progress);
      const currentScrollTop = startScrollTop + distance * easedProgress;

      window.scrollTo(0, currentScrollTop);

      if (progress < 1.0) {
        scrollAnimationRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimationRef.current = null;
      }
    };

    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    scrollAnimationRef.current = requestAnimationFrame(step);
  };

  // Programmatic dot navigation smooth scroll trigger
  const scrollTo = (id: string) => {
    const targetIndex = indicatorItems.findIndex(item => item.id === id);
    if (targetIndex === -1) return;
    
    if (isMobile) {
      triggerMobileJumpTransition(targetIndex);
    } else {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const targetScrollTop = (targetIndex / (indicatorItems.length - 1)) * maxScroll;
      
      // Smoothly transition with our premium eased animator
      animateScrollTo(targetScrollTop, 1500);
    }
  };

  const activeId = indicatorItems[activeIndex]?.id || 'hero';

  return (
    <div className="relative min-h-screen bg-[#000000] text-white font-sans selection:bg-white/20 selection:text-white">
      
      {/* 
        PRELOADING SCREEN OVERLAY
        Displays a dark luxury loader centered in the viewport.
      */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center pointer-events-auto"
          >
            <motion.div
              animate={{
                scale: [0.98, 1.0, 0.98],
                opacity: [0.6, 1.0, 0.6]
              }}
              transition={{
                duration: 2.0,
                ease: 'easeInOut',
                repeat: Infinity
              }}
              className="relative flex items-center justify-center select-none"
            >
              <OnePlugLogo className="w-[200px] sm:w-[240px] h-auto text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        BACKGROUND CANVAS RENDERER
        Fullscreen fixed background element that renders 4K frames sequentially.
        Maintained static on mobile to show the hero background without heavy scroll animations.
      */}
      <canvas 
        ref={canvasRef}
        id="cinematic-canvas" 
        className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none block"
      />

      {/* 
        VIEWPORT-FIXED OVERLAY DECK
        All slides sit statically in the viewport and never slide or travel.
        Only their opacity and visibility values change, driven by scroll progress.
      */}
      {!isLoading && (
        <div className="fixed inset-0 w-screen h-screen z-10 pointer-events-none">
          {sectionsData.map((section, idx) => (
            <div
              key={section.id}
              ref={el => sectionRefs.current[idx] = el}
              style={{
                opacity: idx === 0 ? 1 : 0,
                visibility: idx === 0 ? 'visible' : 'hidden',
                pointerEvents: idx === 0 ? 'auto' : 'none',
              }}
              className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden transition-opacity duration-[100ms] ease-out bg-transparent`}
            >
              <StorySection 
                section={section} 
                index={idx} 
                opacity={1}
                isMobile={isMobile}
              />
            </div>
          ))}

          {/* VIEWPORT-FIXED FINAL SECTION */}
          <div
            ref={finalSectionRef}
            style={{
              opacity: 0,
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
            className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden transition-opacity duration-[100ms] ease-out bg-transparent`}
          >
            {isMobile ? (
              /* Mobile Portrait Layout for Final Section: structured vertical flow */
              <div className="w-full h-full flex flex-col justify-between px-6 pt-[10vh] pb-[8vh] text-left select-none box-border">
                {/* Title */}
                <div className="w-full">
                  <h1 className="font-display text-[36px] xs:text-[40px] sm:text-[44px] font-bold text-white leading-[1.1] max-w-[500px]">
                    Launching Soon
                  </h1>
                </div>
                
                {/* Middle Animation Spacer */}
                <div className="flex-1 min-h-[200px] max-h-[35vh] w-full" />
                
                {/* Subtext */}
                <div className="w-full mt-auto flex flex-col gap-2 max-w-[500px]">
                  <h2 className="font-sans text-xl text-white font-bold tracking-tight leading-[1.4]">
                    One App. Every Charger
                  </h2>
                  <p className="font-sans text-base text-[#A1A1AA] font-normal leading-[1.6]">
                    Powering the future of EV charging.
                  </p>
                </div>
              </div>
            ) : (
              /* Desktop/Tablet Layout for Final Section */
              <>
                <div className="absolute top-[14vh] sm:top-[16vh] left-[8%] sm:left-[10%] pr-6 sm:pr-0 max-w-[850px] text-left flex flex-col gap-6 items-start">
                  <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-medium text-[#F5F5F7] tracking-[-0.025em] leading-[1.02]">
                    Launching Soon
                  </h1>
                </div>
                <div className="absolute bottom-6 md:bottom-10 left-[8%] sm:left-[10%] w-full max-w-[500px] text-left px-6 sm:px-0 flex flex-col items-start gap-2">
                  <h2 className="font-sans text-2xl sm:text-3xl text-[#F5F5F7] font-medium tracking-tight leading-[1.4]">
                    One App. Every Charger
                  </h2>
                  <p className="font-sans text-lg sm:text-xl text-[#A1A1AA] font-normal leading-[1.6] tracking-[0em]">
                    Powering the future of EV charging.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Left Indicator / Progress Bar Panel matching Dark Luxury style */}
      {!isLoading && (
        <div 
          id="luxury-scroll-indicator"
          className="fixed left-4 md:left-10 top-1/2 -translate-y-1/2 z-35 flex flex-col gap-2 md:gap-4 pointer-events-auto"
        >
          {indicatorItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <div key={item.id} className="relative flex items-center group">
                <button
                  onClick={() => scrollTo(item.id)}
                  className={`rounded-full cursor-pointer transition-all duration-300 ease-out border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#00D2A0] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                    isActive 
                      ? 'w-2.5 md:w-3.5 h-2.5 md:h-3.5 bg-[#00D2A0] shadow-[0_0_12px_rgba(0,210,160,0.8)] scale-110' 
                      : 'w-1.5 md:w-2 h-1.5 md:h-2 bg-white/20 hover:bg-white/60 scale-100'
                  }`}
                  aria-label={`Go to ${item.label}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* CONTACT BUTTON - Only persistent UI element */}
      {!isLoading && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 pointer-events-auto">
          {isContactOpen ? (
            <div
              className={`flex items-center justify-center bg-[#000000]/40 border border-white/[0.06] rounded-full text-white/20 select-none pointer-events-none transition-all duration-300 ${
                isMobile ? 'w-12 h-12' : 'gap-3 px-6 py-3 text-xs font-medium tracking-widest uppercase'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {!isMobile && <span className="font-sans font-medium">Contact Us</span>}
            </div>
          ) : (
            <motion.button
              id="persistent-contact-btn"
              layoutId="contact-card-container"
              onClick={() => setIsContactOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ opacity: activeId === 'final-section' ? 0.3 : 1.0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 170 }}
              className={`flex items-center justify-center bg-[#000000] hover:bg-[#121212] border border-white/[0.18] hover:border-white/40 rounded-full text-white shadow-sm hover:shadow-md cursor-pointer ${
                isMobile ? 'w-12 h-12' : 'gap-3 px-6 py-3 text-xs font-medium tracking-widest uppercase'
              }`}
              aria-label="Contact Us"
              title="Contact Us"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {!isMobile && <span className="text-white font-sans font-medium">Contact Us</span>}
            </motion.button>
          )}
        </div>
      )}

      {/* Floating Glass Contact Form */}
      {!isLoading && (
        <ContactForm 
          isOpen={isContactOpen} 
          onClose={() => setIsContactOpen(false)} 
        />
      )}
    </div>
  );
}
