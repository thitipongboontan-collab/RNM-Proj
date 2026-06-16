"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef } from "react";
import type { ResearchNewsItem } from "@/data/research-news";
import { ResearchNewsCard } from "@/components/home/ResearchNewsCard";
import { PageNavButton } from "@/components/ui/CircularPageNav";

const AUTOPLAY_DELAY_MS = 5000;
const SCROLL_DURATION = 25;

type CarouselSlide = ResearchNewsItem & { slideKey: string };

function buildLoopSlides(items: ResearchNewsItem[]): CarouselSlide[] {
  if (items.length <= 1) {
    return items.map((item) => ({ ...item, slideKey: item.id }));
  }

  const repeated = [...items, ...items, ...items];
  return repeated.map((item, index) => ({
    ...item,
    slideKey: `${item.id}-${index}`,
  }));
}

export function ResearchNewsCarousel({ items }: { items: ResearchNewsItem[] }) {
  const slides = buildLoopSlides(items);
  const isHoveringRef = useRef(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
    duration: SCROLL_DURATION,
    containScroll: "trimSnaps",
  });

  const scrollTowardRight = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollTowardLeft = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || items.length <= 1) return;

    const normalizeLoop = () => {
      const count = items.length;
      const snap = emblaApi.selectedScrollSnap();

      if (snap < count) {
        emblaApi.scrollTo(snap + count, true);
        return;
      }

      if (snap >= count * 2) {
        emblaApi.scrollTo(snap - count, true);
      }
    };

    emblaApi.scrollTo(items.length, true);
    emblaApi.on("select", normalizeLoop);
    emblaApi.on("reInit", () => {
      emblaApi.scrollTo(items.length, true);
    });

    return () => {
      emblaApi.off("select", normalizeLoop);
    };
  }, [emblaApi, items.length]);

  useEffect(() => {
    if (!emblaApi || items.length <= 1) return;

    const tick = () => {
      if (isHoveringRef.current) return;
      emblaApi.scrollPrev();
    };

    autoplayTimerRef.current = setInterval(tick, AUTOPLAY_DELAY_MS);

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [emblaApi, items.length]);

  return (
    <div
      className="flex items-center gap-3 sm:gap-4 lg:gap-5"
      aria-roledescription="carousel"
      aria-label="ข่าวสารงานวิจัย"
      onMouseEnter={() => {
        isHoveringRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveringRef.current = false;
      }}
    >
      <PageNavButton direction="left" disabled={false} onClick={scrollTowardLeft} />

      <div
        className="min-w-0 flex-1 overflow-hidden"
        ref={emblaRef}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="-ml-5 flex touch-pan-y sm:-ml-6">
          {slides.map((item, index) => (
            <div
              key={item.slideKey}
              className="min-w-0 flex-[0_0_100%] pl-5 sm:flex-[0_0_50%] sm:pl-6 lg:flex-[0_0_25%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${(index % items.length) + 1} จาก ${items.length}`}
            >
              <ResearchNewsCard item={item} />
            </div>
          ))}
        </div>
      </div>

      <PageNavButton direction="right" disabled={false} onClick={scrollTowardRight} />
    </div>
  );
}
