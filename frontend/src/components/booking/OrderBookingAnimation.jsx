import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Store, 
  Bike, 
  KeyRound, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Zap,
  CreditCard,
  Smartphone
} from 'lucide-react';

/**
 * Plays a pleasant web audio chime for order events without external audio files
 */
const playWebAudioChime = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      // Pleasant Indian temple bell / celebration chime: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.7);
      });
    }
  } catch (err) {
    // Audio context may be restricted by browser policy before first interaction
  }
};

/**
 * Animated Canvas Confetti for Celebration
 */
const ConfettiBurst = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#993D24', '#D97706', '#15803D', '#EAB308', '#2563EB', '#F43F5E'];
    const particles = Array.from({ length: 50 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.7) * 12,
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
    }));

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.alpha -= 0.012;
        p.rotation += p.vRot;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 1.4);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" />;
};

/**
 * OrderBookingAnimation
 * Rich multi-stage booking animation displaying payment escrow, artisan dispatch,
 * hyperlocal assignment, OTP generation, and confirmation.
 */
export default function OrderBookingAnimation({
  amount = 0,
  paymentMethod = 'UPI (Demo)',
  storeName = 'Mohalla Artisan Workshop',
  deliveryAddress = 'Doorstep Delivery',
  onComplete,
}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [otpDigits, setOtpDigits] = useState('------');

  const stages = [
    {
      id: 'PAYMENT',
      title: 'Authorizing Payment & Escrow',
      desc: `Securing ₹${Number(amount).toFixed(2)} via ${paymentMethod} in Mohalla Escrow Protection`,
      icon: paymentMethod.toLowerCase().includes('razorpay') ? CreditCard : Smartphone,
      color: 'text-marigold',
      bgColor: 'bg-marigold/15',
      borderColor: 'border-marigold/30',
      targetProgress: 28,
      duration: 700,
    },
    {
      id: 'STORE',
      title: 'Connecting to Mohalla Store',
      desc: `Alerting ${storeName} to prepare fresh artisanal stock`,
      icon: Store,
      color: 'text-clay',
      bgColor: 'bg-clay/15',
      borderColor: 'border-clay/30',
      targetProgress: 56,
      duration: 800,
    },
    {
      id: 'RIDER',
      title: 'Assigning Mohalla Runner',
      desc: `Finding nearest delivery partner for doorstep delivery in your neighbourhood`,
      icon: Bike,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      targetProgress: 82,
      duration: 800,
    },
    {
      id: 'OTP',
      title: 'Generating 6-Digit Delivery OTP',
      desc: 'Locking tamper-proof cryptographic PIN for hand-to-hand delivery verification',
      icon: KeyRound,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      targetProgress: 96,
      duration: 700,
    },
    {
      id: 'CONFIRMED',
      title: 'Order Confirmed & Booked! 🎉',
      desc: 'Seller notified. Your delivery OTP is securely linked to this order.',
      icon: CheckCircle2,
      color: 'text-neem',
      bgColor: 'bg-neem/15',
      borderColor: 'border-neem/30',
      targetProgress: 100,
      duration: 1000,
    },
  ];

  // Cycling OTP numbers animation during OTP stage
  useEffect(() => {
    if (currentStageIndex === 3) {
      const interval = setInterval(() => {
        const rand = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpDigits(rand);
      }, 70);
      return () => clearInterval(interval);
    } else if (currentStageIndex >= 4) {
      setOtpDigits('VERIFIED');
    }
  }, [currentStageIndex]);

  useEffect(() => {
    let timer;
    const stage = stages[currentStageIndex];

    if (stage) {
      setProgress(stage.targetProgress);
      playWebAudioChime(currentStageIndex === stages.length - 1 ? 'success' : 'tick');

      if (currentStageIndex < stages.length - 1) {
        timer = setTimeout(() => {
          setCurrentStageIndex((prev) => prev + 1);
        }, stage.duration);
      } else {
        // Final confirmed stage — complete callback
        timer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 1200);
      }
    }

    return () => clearTimeout(timer);
  }, [currentStageIndex]);

  const activeStage = stages[currentStageIndex] || stages[0];
  const ActiveIcon = activeStage.icon;
  const isConfirmed = currentStageIndex === stages.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-lg bg-warmwhite rounded-3xl p-6 sm:p-8 border-2 border-clay/30 shadow-2xl overflow-hidden jali-bg"
      >
        {/* Celebration Confetti at completion */}
        {isConfirmed && <ConfettiBurst />}

        {/* Top Header Pill */}
        <div className="flex items-center justify-between border-b border-clay/15 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-clay animate-ping" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-clay">
              Mohalla Instant Booking
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white/80 border border-clay/20 text-indigo">
            ₹{Number(amount).toFixed(2)}
          </span>
        </div>

        {/* Central Dynamic Stage Animation Canvas */}
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            {/* Glowing Ambient Halo */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className={`absolute -inset-4 rounded-full blur-xl ${
                isConfirmed ? 'bg-neem/40' : 'bg-clay/30'
              }`}
            />

            {/* Central Animated Badge */}
            <motion.div
              key={activeStage.id}
              initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 250 }}
              className={`relative w-24 h-24 rounded-3xl ${activeStage.bgColor} border-2 ${activeStage.borderColor} flex items-center justify-center shadow-lg`}
            >
              <ActiveIcon className={`w-12 h-12 ${activeStage.color}`} />

              {/* Hyperlocal Bicycle Track Effect */}
              {activeStage.id === 'RIDER' && (
                <motion.div
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-sm"
                >
                  🚴 En Route
                </motion.div>
              )}

              {/* Live Digit Counter during OTP stage */}
              {activeStage.id === 'OTP' && (
                <div className="absolute -bottom-3 bg-indigo text-marigold font-mono text-[11px] font-bold px-2 py-0.5 rounded-full tracking-widest shadow">
                  {otpDigits}
                </div>
              )}
            </motion.div>
          </div>

          {/* Dynamic Stage Text */}
          <div className="space-y-1.5 px-2">
            <motion.h3
              key={`title-${activeStage.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display text-indigo"
            >
              {activeStage.title}
            </motion.h3>

            <motion.p
              key={`desc-${activeStage.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs sm:text-sm text-indigo/70 max-w-sm mx-auto leading-relaxed"
            >
              {activeStage.desc}
            </motion.p>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo/60">
            <span>Stage {currentStageIndex + 1} of {stages.length}</span>
            <span className="text-clay">{progress}% Complete</span>
          </div>

          <div className="h-2.5 w-full bg-clay/15 rounded-full overflow-hidden p-0.5">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                isConfirmed ? 'bg-neem' : 'bg-gradient-to-r from-clay via-saffron to-marigold'
              }`}
              initial={{ width: '10%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
          </div>
        </div>

        {/* Stage Timeline Stepper */}
        <div className="grid grid-cols-5 gap-1.5 pt-6 border-t border-clay/15 mt-6">
          {stages.map((stg, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurr = idx === currentStageIndex;
            const StgIcon = stg.icon;

            return (
              <div
                key={stg.id}
                className={`flex flex-col items-center p-1.5 rounded-xl transition-all ${
                  isCurr ? 'bg-white shadow-sm border border-clay/20' : 'opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? 'bg-neem text-warmwhite'
                      : isCurr
                      ? 'bg-clay text-warmwhite'
                      : 'bg-clay/10 text-indigo/60'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <StgIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[9px] font-semibold text-indigo/70 mt-1 truncate max-w-[55px] text-center">
                  {stg.id}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer skip or info button */}
        <div className="pt-4 flex items-center justify-between text-xs text-indigo/50">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-neem" />
            <span>100% Neighbour Verified</span>
          </div>

          {!isConfirmed && (
            <button
              type="button"
              onClick={() => {
                if (onComplete) onComplete();
              }}
              className="hover:text-clay hover:underline font-medium cursor-pointer"
            >
              Skip animation →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
