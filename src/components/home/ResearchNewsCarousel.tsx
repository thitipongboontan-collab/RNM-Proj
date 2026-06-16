"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useRef } from "react";
import type { ResearchNewsItem } from "@/data/research-news";
import { ResearchNewsCard } from "@/components/home/ResearchNewsCard";
import { PageNavButton } from "@/components/ui/CircularPageNav";

const AUTO_SCROLL_SPEED = 1.15;

export function ResearchNewsCarousel({ items }: { items: ResearchNewsItem[] }) {
  const autoScrollPlugin = useRef(
    AutoScroll({
      speed: AUTO_SCROLL_SPEED,
      direction: "backward",
      startDelay: 0,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
      playOnInit: true,
    }),
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: true,
    },
    [autoScrollPlugin.current],
  );

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  return (
    <div
      className="flex items-center gap-3 sm:gap-4 lg:gap-5"
      aria-roledescription="carousel"
      aria-label="ข่าวสารงานวิจัย"
    >
      <PageNavButton direction="left" disabled={false} onClick={scrollPrev} />

      <div
        className="min-w-0 flex-1 overflow-hidden"
        ref={emblaRef}
        aria-live="off"
      >
        <div className="flex touch-pan-y gap-5 sm:gap-6">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_calc((100%-1.25rem)/2)] lg:flex-[0_0_calc((100%-4.5rem)/4)]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} จาก ${items.length}`}
            >
              <ResearchNewsCard item={item} />
            </div>
          ))}
        </div>
      </div>

      <PageNavButton direction="right" disabled={false} onClick={scrollNext} />
    </div>
  );
}
