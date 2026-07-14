import { useState, useEffect, useRef } from 'react';

interface SectionState {
  id: number;
  opacity: number;
  shouldRender: boolean;
}

export function useSectionProgress(sectionsCount: number, scrollY: number, windowHeight: number) {
  // Track height is 1.2 * windowHeight per section
  const trackHeight = windowHeight * 1.2;
  const progress = trackHeight ? scrollY / trackHeight : 0;

  // Mathematically active section index based on scroll position
  const targetActiveIndex = Math.min(Math.max(Math.round(progress), 0), sectionsCount);

  // States to keep track of transition sequence
  const [currentActiveIndex, setCurrentActiveIndex] = useState(0);
  
  // Opacity state for each section (0 to sectionsCount)
  const [opacities, setOpacities] = useState<number[]>(() => 
    Array.from({ length: sectionsCount + 1 }, (_, i) => (i === 0 ? 1 : 0))
  );

  // Render state for each section (for mounting / unmounting)
  const [renderStates, setRenderStates] = useState<boolean[]>(() => 
    Array.from({ length: sectionsCount + 1 }, (_, i) => i === 0)
  );

  const transitionRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (targetActiveIndex !== currentActiveIndex) {
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
      }

      const prevIndex = currentActiveIndex;
      const nextIndex = targetActiveIndex;

      // 1. Trigger fade-out of the previously active section
      setOpacities(prev => {
        const updated = [...prev];
        updated[prevIndex] = 0;
        return updated;
      });

      // 2. Wait exactly 800ms for the previous section to completely fade out
      transitionRef.current = setTimeout(() => {
        setRenderStates(prev => {
          const updated = [...prev];
          updated[prevIndex] = false; // Unmount previous section
          updated[nextIndex] = true;  // Mount next section
          return updated;
        });

        // Set next index opacity to 0 initially before fade-in triggers
        setOpacities(prev => {
          const updated = [...prev];
          updated[nextIndex] = 0;
          return updated;
        });

        // 3. Immediately queue the fade-in of the next section on the next frame
        const nextFrameTimeout = setTimeout(() => {
          setOpacities(prev => {
            const updated = [...prev];
            updated[nextIndex] = 1;
            return updated;
          });
          setCurrentActiveIndex(nextIndex);
        }, 30);

        return () => clearTimeout(nextFrameTimeout);
      }, 800); // 800ms ease-in-out transition duration
    }

    return () => {
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
      }
    };
  }, [targetActiveIndex, currentActiveIndex, sectionsCount]);

  // Map state to SectionState array
  const sectionProgresses: SectionState[] = Array.from({ length: sectionsCount + 1 }).map((_, idx) => ({
    id: idx,
    opacity: opacities[idx],
    shouldRender: renderStates[idx],
  }));

  return {
    progress,
    activeSectionIndex: currentActiveIndex,
    targetActiveIndex,
    sectionProgresses,
  };
}
