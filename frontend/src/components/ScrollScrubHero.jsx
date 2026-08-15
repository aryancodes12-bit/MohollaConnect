import { useEffect, useRef, useState } from 'react';

/**
 * ScrollScrubHero
 * ----------------
 * A pinned scroll-scrubbed animation for the LocalConnect welcome page —
 * scroll position maps to frame index of a pre-rendered image sequence
 * (extracted from a stitched AI-generated video showing the buyer→seller→
 * OTP→trust-badge journey).
 */

const FRAME_COUNT = 630;
const FRAME_PATH = (i) => `/hero-frames/frame-${String(i).padStart(3, '0')}.jpg`;

const CAPTIONS = [
  'हर दुकान की एक कहानी है — every kirana has a story',
  'Discover what\u2019s brewing in your mohalla',
  'Every handoff, OTP-verified',
  'Trusted by your neighbourhood',
];

export default function ScrollScrubHero({ scrollHeightVh = 180 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [activeCaption, setActiveCaption] = useState(0);

  // Preload frame sequence
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    let erroredCount = 0;
    const images = new Array(FRAME_COUNT);

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => {
        if (cancelled) return;
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / FRAME_COUNT) * 100));
        if (loadedCount + erroredCount === FRAME_COUNT) {
          if (loadedCount === 0) setFailed(true);
          else setLoaded(true);
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        erroredCount++;
        if (loadedCount + erroredCount === FRAME_COUNT) {
          if (loadedCount === 0) setFailed(true);
          else setLoaded(true);
        }
      };
      images[i] = img;
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, []);

  // Wire GSAP ScrollTrigger once frames are loaded
  useEffect(() => {
    if (!loaded) return;
    let ctx;
    let ScrollTriggerRef;

    import('gsap')
      .then(async (gsapModule) => {
        const gsap = gsapModule.gsap;
        const st = await import('gsap/ScrollTrigger');
        ScrollTriggerRef = st.ScrollTrigger;
        gsap.registerPlugin(ScrollTriggerRef);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctxCanvas = canvas.getContext('2d');
        const images = imagesRef.current.filter((img) => img.complete && img.naturalWidth > 0);
        if (images.length === 0) return;

        const drawFrame = (index) => {
          const img = images[Math.max(0, Math.min(images.length - 1, index))];
          if (!img || !canvas) return;

          const rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const dpr = window.devicePixelRatio || 1;
            const targetWidth = Math.floor(rect.width * dpr);
            const targetHeight = Math.floor(rect.height * dpr);
            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
              canvas.width = targetWidth;
              canvas.height = targetHeight;
            }
          }

          ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);

          // Object-cover calculation
          const hRatio = canvas.width / img.naturalWidth;
          const vRatio = canvas.height / img.naturalHeight;
          const ratio = Math.max(hRatio, vRatio);

          const centerShiftX = (canvas.width - img.naturalWidth * ratio) / 2;
          const centerShiftY = (canvas.height - img.naturalHeight * ratio) / 2;

          ctxCanvas.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            centerShiftX,
            centerShiftY,
            img.naturalWidth * ratio,
            img.naturalHeight * ratio
          );
        };

        drawFrame(0);

        const frameState = { frame: 0 };

        ctx = gsap.context(() => {
          gsap.to(frameState, {
            frame: images.length - 1,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top top+=80',
              end: 'bottom bottom',
              scrub: 0.5,
              onUpdate: (self) => {
                drawFrame(Math.round(frameState.frame));
                const idx = Math.floor(self.progress * CAPTIONS.length);
                setActiveCaption(Math.min(CAPTIONS.length - 1, idx));
              },
            },
          });
        }, containerRef);
      })
      .catch(() => setFailed(true));

    return () => {
      if (ctx) ctx.revert();
      if (ScrollTriggerRef) ScrollTriggerRef.getAll().forEach((t) => t.kill());
    };
  }, [loaded]);

  // Fallback: no frames present yet — static indigo/jali hero so dev never breaks
  if (failed) {
    return (
      <div className="relative rounded-3xl bg-indigo text-warmwhite overflow-hidden jali-bg foil-border-indigo shadow-indigo h-[60vh] md:h-[70vh] max-h-[600px] flex items-center justify-center">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-clay/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-marigold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 text-center px-6 space-y-3">
          <p className="font-display text-2xl md:text-3xl text-warmwhite">
            Scroll animation not generated yet
          </p>
          <p className="font-body text-sm text-warmwhite/70 max-w-md mx-auto">
            Drop your extracted frames into <code className="text-marigold">public/hero-frames/</code> to activate the scroll-scrub sequence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', height: `${scrollHeightVh}vh` }}>
      <div className="sticky top-20 h-[60vh] sm:h-[68vh] md:h-[75vh] max-h-[620px] w-full overflow-hidden rounded-3xl jali-bg foil-border-indigo shadow-indigo bg-indigo flex items-center justify-center">
        {!loaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-warmwhite bg-indigo/90 backdrop-blur-sm">
            <span className="font-body text-sm text-warmwhite/70">Loading Journey {loadProgress}%</span>
            <div className="w-40 h-1 bg-warmwhite/20 overflow-hidden rounded-full">
              <div
                className="h-full bg-clay transition-all duration-200 ease-out"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
        />

        {/* Warm glow accents to match rest of hero styling */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-clay/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-marigold/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top badge overlay */}
        <div className="absolute top-4 left-4 z-10 px-3.5 py-1.5 rounded-full bg-indigo/60 backdrop-blur-md border border-warmwhite/15 text-warmwhite text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-marigold animate-pulse" />
          <span>Mohalla Story Journey</span>
        </div>

        {loaded && CAPTIONS[activeCaption] && (
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 px-6 text-center z-10 w-full max-w-xl">
            <div className="inline-block px-6 py-3 rounded-2xl bg-indigo/80 backdrop-blur-md border border-warmwhite/15 shadow-warm">
              <p className="font-display text-xl sm:text-2xl md:text-3xl text-warmwhite drop-shadow-lg transition-all duration-300">
                {CAPTIONS[activeCaption]}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
