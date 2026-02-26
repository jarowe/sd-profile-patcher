import { motion } from 'framer-motion';
import { Sparkles, Globe2, BookOpen, ArrowRight, Instagram, Github, Linkedin, Quote } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { photos } from '../data/photos';
import MusicCell from '../components/MusicCell';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { playHoverSound, playClickSound } from '../utils/sounds';
import DailyCipher from '../components/DailyCipher';
import './Home.css';
const Globe = lazy(() => import('react-globe.gl'));

const quotes = [
  { text: "Build what shouldn't exist yet.", author: "Me, probably at 2am" },
  { text: "The best interface is no interface.", author: "Golden Krishna" },
  { text: "We don't stop playing because we grow old. We grow old because we stop playing.", author: "George Bernard Shaw" },
  { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
  { text: "The future is already here. It's just not evenly distributed.", author: "William Gibson" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
];

const currentlyMessages = [
  "Currently fueled by espresso and synthwave",
  "The boys are probably breaking something right now",
  "Somewhere between genius and sleep deprivation",
  "If you're reading this, say hi on X",
  "Building the future one commit at a time",
  "Maria says I need to sleep more. She's right.",
  "Jace asked me to explain quantum computing today",
  "Three boys. Zero chill. Maximum adventure.",
];

const avatarEffects = ['float', 'glitch', 'spin', 'ripple'];

const expeditions = [
  // Europe
  { lat: 36.43, lng: -5.15, name: 'Estepona, Spain', region: 'europe', color: '#38bdf8', photo: 'couple-golden-hour.jpg' },
  { lat: 47.27, lng: 13.33, name: 'Austrian Alps', region: 'europe', color: '#38bdf8', photo: 'family-alps.jpg' },
  { lat: 37.44, lng: 24.94, name: 'Greek Islands', region: 'europe', color: '#38bdf8', photo: 'greek-island.jpg' },
  { lat: 18.04, lng: -63.05, name: 'Sint Maarten', region: 'caribbean', color: '#fbbf24', photo: 'rooftop-social.jpg' },
  // US Adventures
  { lat: 35.61, lng: -83.43, name: 'Great Smoky Mountains', region: 'us', color: '#10b981', photo: 'boys-selfie.jpg' },
  { lat: 35.77, lng: -82.27, name: 'Blue Ridge Mountains', region: 'us', color: '#10b981', photo: 'boys-selfie.jpg' },
  { lat: 28.54, lng: -81.38, name: 'Orlando, FL', region: 'us', color: '#fbbf24', photo: null },
  { lat: 28.29, lng: -81.41, name: 'Kissimmee, FL', region: 'us', color: '#fbbf24', photo: null },
];

const arcsData = [
  { startLat: 40, startLng: -100, endLat: 47.27, endLng: 13.33, color: '#7c3aed' }, // US → Alps
  { startLat: 47.27, startLng: 13.33, endLat: 37.44, endLng: 24.94, color: '#38bdf8' }, // Alps → Greece
  { startLat: 37.44, startLng: 24.94, endLat: 36.43, endLng: -5.15, color: '#38bdf8' }, // Greece → Spain
];

export default function Home() {
  const BASE = import.meta.env.BASE_URL;
  const navigate = useNavigate();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState(null);

  const globeRef = useRef();
  const mapContainerRef = useRef();
  const [globeSize, setGlobeSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setGlobeSize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const autoRotateTimer = useRef(null);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.8;
      controls.enableZoom = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      globeRef.current.pointOfView({ lat: 35, lng: -40, altitude: 1.8 });

      // Pause autoRotate on interaction, resume after 3s
      const handleStart = () => {
        controls.autoRotate = false;
        if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
      };
      const handleEnd = () => {
        autoRotateTimer.current = setTimeout(() => {
          controls.autoRotateSpeed = 0;
          controls.autoRotate = true;
          // Smooth ramp back to normal speed
          const ramp = setInterval(() => {
            if (controls.autoRotateSpeed < 0.8) {
              controls.autoRotateSpeed += 0.05;
            } else {
              controls.autoRotateSpeed = 0.8;
              clearInterval(ramp);
            }
          }, 50);
        }, 3000);
      };

      controls.addEventListener('start', handleStart);
      controls.addEventListener('end', handleEnd);

      return () => {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
        if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
      };
    }
  }, [globeSize.width]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const container = useRef();
  const [showBrand, setShowBrand] = useState(() => !sessionStorage.getItem('jarowe_visited'));
  const brandCompleted = useRef(false);

  useGSAP(() => {
    if (showBrand) {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem('jarowe_visited', 'true');
          brandCompleted.current = true;
          setShowBrand(false);
        }
      });
      tl.from('.brand-char', {
        y: 50, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'back.out(1.7)'
      })
        .to('.brand-char', {
          opacity: 0, y: -20, duration: 0.5, stagger: 0.05, delay: 1
        })
        .from('.bento-cell', {
          y: 50, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power2.out'
        }, "-=0.2");
    } else if (!brandCompleted.current) {
      // Only run entrance animation on direct visits (no brand reveal)
      gsap.from('.bento-cell', {
        y: 30, opacity: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out'
      });
    }
  }, { scope: container, dependencies: [showBrand] });

  // 3D cell tracking
  useEffect(() => {
    const cells = document.querySelectorAll('.bento-cell.tilt-enabled');

    const handleMouseMove = (e) => {
      const cell = e.currentTarget;
      const rect = cell.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      cell.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = (e) => {
      const cell = e.currentTarget;
      cell.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      cell.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    };

    const handleMouseEnter = (e) => {
      const cell = e.currentTarget;
      cell.style.transition = 'none';
      playHoverSound();
    };

    cells.forEach(cell => {
      cell.addEventListener('mousemove', handleMouseMove);
      cell.addEventListener('mouseleave', handleMouseLeave);
      cell.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      cells.forEach(cell => {
        cell.removeEventListener('mousemove', handleMouseMove);
        cell.removeEventListener('mouseleave', handleMouseLeave);
        cell.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, []);

  useEffect(() => {
    const handleCellClick = () => playClickSound();
    const clickables = document.querySelectorAll('.clickable, .back-link');
    clickables.forEach(c => c.addEventListener('click', handleCellClick));
    return () => clickables.forEach(c => c.removeEventListener('click', handleCellClick));
  }, []);

  useEffect(() => {
    let keySequence = '';
    const handleKeyDown = (e) => {
      keySequence += e.key;
      if (keySequence.length > 5) {
        keySequence = keySequence.slice(-5);
      }
      if (keySequence.toLowerCase() === 'vault') {
        navigate('/vault', { viewTransition: true });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Avatar click effects
  const [avatarEffect, setAvatarEffect] = useState(null);
  const avatarClickCount = useRef(0);
  const avatarDiscovered = useRef(localStorage.getItem('jarowe_avatar_discovered') === 'true');

  const handleAvatarClick = useCallback((e) => {
    e.stopPropagation();
    const effectIndex = avatarClickCount.current % avatarEffects.length;
    setAvatarEffect(avatarEffects[effectIndex]);
    avatarClickCount.current++;
    playClickSound();

    if (avatarEffects[effectIndex] === 'ripple') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: 0.15, y: 0.25 },
        colors: ['#7c3aed', '#38bdf8', '#f472b6'],
        gravity: 0.8,
        scalar: 0.8,
      });
    }

    if (!avatarDiscovered.current) {
      avatarDiscovered.current = true;
      localStorage.setItem('jarowe_avatar_discovered', 'true');
    }

    setTimeout(() => setAvatarEffect(null), 1000);
  }, []);

  // Currently cell hover messages
  const [currentlyMsg, setCurrentlyMsg] = useState(null);
  const currentlyMsgIndex = useRef(0);

  const handleCurrentlyHover = useCallback(() => {
    setCurrentlyMsg(currentlyMessages[currentlyMsgIndex.current % currentlyMessages.length]);
    currentlyMsgIndex.current++;
  }, []);

  const handleCurrentlyLeave = useCallback(() => {
    setCurrentlyMsg(null);
  }, []);

  // Rotating quotes
  const [quoteIndex, setQuoteIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Hidden character peek-a-boo
  const [peekVisible, setPeekVisible] = useState(false);
  const [peekPosition, setPeekPosition] = useState({ cell: 0, side: 'right' });
  const peekCaught = useRef(false);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 30000; // 15-45 seconds
      return setTimeout(() => {
        const sides = ['right', 'left', 'top'];
        setPeekPosition({
          cell: Math.floor(Math.random() * 4),
          side: sides[Math.floor(Math.random() * sides.length)]
        });
        setPeekVisible(true);
        setTimeout(() => setPeekVisible(false), 3500);
        timerId = scheduleNext();
      }, delay);
    };

    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  const handleCatchCharacter = useCallback(() => {
    if (!peekCaught.current) {
      peekCaught.current = true;
    }
    setPeekVisible(false);
    playClickSound();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#22c55e', '#fbbf24', '#38bdf8'],
    });
  }, []);

  return (
    <div className="home-wrapper" ref={container}>
      <AnimatePresence>
        {showBrand && (
          <motion.div
            className="brand-reveal-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050510' }}
          >
            <div style={{ display: 'flex', gap: '8px', fontSize: '4rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'white' }}>
              {"JAROWE.".split('').map((char, i) => (
                <span key={i} className="brand-char" style={{ display: 'inline-block' }}>{char}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="bento-container">
        <div className="bento-grid">
          {/* HERO IDENTITY CELL */}
          <div className="bento-cell cell-hero tilt-enabled">
            <div className="bento-content">
              <div className="hero-header">
                <div
                  className={`hero-avatar ${avatarEffect ? `avatar-${avatarEffect}` : ''}`}
                  style={{ backgroundImage: `url(${BASE}images/headshot.jpg)` }}
                  onClick={handleAvatarClick}
                  role="button"
                  tabIndex={0}
                ></div>
                <div className="hero-titles">
                  <h1>Jared Rowe</h1>
                  <h2>Dad. Builder. Noise Maker.</h2>
                </div>
              </div>
              <p className="hero-bio">
                I build things that shouldn't exist yet. By day I'm shaping the creative tools ecosystem at Elgato. By night I'm running Starseed Labs. And somehow in between, my wife and I are dragging three boys across the planet and calling it school.
              </p>
            </div>
          </div>

          {/* WORLD MAP CELL */}
          <div className="bento-cell cell-map">
            <div className="map-container" ref={mapContainerRef}>
              <Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>Loading globe...</div>}>
                {globeSize.width > 0 && (
                  <Globe
                    ref={globeRef}
                    width={globeSize.width}
                    height={globeSize.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundColor="rgba(0,0,0,0)"
                    atmosphereColor="#7c3aed"
                    atmosphereAltitude={0.25}
                    arcsData={arcsData}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={0.2}
                    arcDashAnimateTime={2000}
                    arcStroke={0.5}
                    ringsData={expeditions}
                    ringColor={(d) => d.color}
                    ringMaxRadius={2}
                    ringPropagationSpeed={1}
                    ringRepeatPeriod={1000}
                    labelsData={expeditions}
                    labelLat="lat"
                    labelLng="lng"
                    labelText="name"
                    labelSize={1.2}
                    labelDotRadius={0.3}
                    labelColor={() => 'rgba(255, 255, 255, 0.9)'}
                    labelResolution={2}
                    onLabelHover={(label) => setHoveredMarker(label)}
                    onRingHover={(ring) => setHoveredMarker(ring)}
                  />
                )}
              </Suspense>
              <AnimatePresence>
                {hoveredMarker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(10, 10, 20, 0.85)',
                      backdropFilter: 'blur(16px)',
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      zIndex: 100,
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <strong style={{ color: '#fff', fontSize: '13px', letterSpacing: '0.5px' }}>{hoveredMarker.name}</strong>
                    {hoveredMarker.photo && (
                      <motion.img
                        key={hoveredMarker.photo}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        src={`${BASE}images/${hoveredMarker.photo}`}
                        alt={hoveredMarker.name}
                        style={{ width: '140px', height: '90px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="map-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe2 size={16} /> Worldschooling Family
              </div>
              <div style={{ fontSize: '0.8rem', color: '#0ea5e9' }}>{hoveredMarker ? `Hovering: ${hoveredMarker.name}` : 'Hover for locations'}</div>
            </div>
          </div>

          <div className="bento-cell cell-music">
            <MusicCell />
          </div>

          {/* WORKSHOP CELL */}
          <div className="bento-cell cell-project clickable" onClick={() => navigate('/workshop', { viewTransition: true })}>
            <div className="project-image" style={{ backgroundImage: `url(${BASE}images/jaredIMG_4650-3smVbD.jpg)`, filter: 'brightness(0.5) contrast(1.2)' }}></div>
            <div className="featured-badge">Tools & Builds</div>
            <div className="bento-content" style={{ zIndex: 1 }}>
              <h3 className="project-title" style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>The Workshop</h3>
              <p style={{ color: '#eee', fontSize: '0.95rem' }}>SD Patcher, BEAMY, & Experiments.</p>
            </div>
          </div>

          {/* NOW PAGE CELL */}
          <div
            className="bento-cell cell-now clickable tilt-enabled"
            onClick={() => navigate('/now', { viewTransition: true })}
            onMouseEnter={handleCurrentlyHover}
            onMouseLeave={handleCurrentlyLeave}
          >
            <div className="bento-content">
              <div className="now-header">
                <div className="now-pulse"></div>
                Currently
              </div>
              <p style={{ color: '#ddd', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Living in the US, hacking on WebAudio, and exploring GenAI paradigms for creatives.
              </p>
              <AnimatePresence>
                {currentlyMsg && (
                  <motion.div
                    className="currently-bubble"
                    initial={{ opacity: 0, scale: 0, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {currentlyMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SOCIALS CELL */}
          <div className="bento-cell cell-socials">
            <div className="bento-content" style={{ padding: '1.5rem' }}>
              <div className="socials-grid">
                <a href="https://x.com/jaredalanrowe" target="_blank" rel="noreferrer" className="social-link">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://github.com/jarowe" target="_blank" rel="noreferrer" className="social-link"><Github size={24} /></a>
                <a href="https://linkedin.com/in/jaredalanrowe" target="_blank" rel="noreferrer" className="social-link"><Linkedin size={24} /></a>
                <a href="https://www.instagram.com/jaredrowe/" target="_blank" rel="noreferrer" className="social-link"><Instagram size={24} /></a>
              </div>
            </div>
          </div>

          {/* INSTAGRAM CELL */}
          <div className="bento-cell cell-instagram clickable" onClick={() => window.open('https://www.instagram.com/jaredrowe/', '_blank')}>
            <div className="insta-carousel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={photoIndex}
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: 1, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 4, ease: "linear" }}
                  className="insta-photo"
                  style={{ backgroundImage: `url(${photos[photoIndex].src})` }}
                />
              </AnimatePresence>
            </div>
            <div className="insta-overlay">
              <div className="insta-text">Life in Photos</div>
              <Instagram size={20} color="#fff" />
            </div>
          </div>

          {/* DIGITAL GARDEN CELL */}
          <div className="bento-cell cell-garden clickable" onClick={() => navigate('/garden', { viewTransition: true })}>
            <div className="bento-content" style={{ justifyContent: 'center' }}>
              <div className="garden-header"><BookOpen size={20} /> Brain Dump</div>
              <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
                Half-baked ideas I'm thinking out loud about.
              </p>
            </div>
          </div>

          {/* ENTER THE UNIVERSE CELL */}
          <div className="bento-cell cell-universe clickable" onClick={() => navigate('/universe', { viewTransition: true })}>
            <div className="bento-content">
              <div className="universe-content">
                <div>
                  <div className="universe-text">Go Deeper</div>
                  <p style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>See how everything connects.</p>
                </div>
                <div className="enter-btn">
                  Explore <ArrowRight size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* INTO RIGHT NOW CELL */}
          <div className="bento-cell cell-into clickable" onClick={() => navigate('/favorites', { viewTransition: true })}>
            <div className="bento-content" style={{ background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.8), rgba(15, 15, 20, 0.4))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f472b6', fontWeight: 'bold', marginBottom: '10px' }}>
                <Sparkles size={18} /> Into Right Now
              </div>
              <p style={{ color: '#eee', fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                The Three-Body Problem
              </p>
              <p style={{ color: '#999', fontSize: '0.85rem' }}>Cannot put it down.</p>
            </div>
          </div>

          {/* FAVORITE QUOTES CELL */}
          <div className="bento-cell cell-quotes">
            <div className="bento-content quotes-content">
              <div className="quotes-decoration">"</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="quote-inner"
                >
                  <p className="quote-text">{quotes[quoteIndex].text}</p>
                  <p className="quote-author">— {quotes[quoteIndex].author}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* DAILY CIPHER GAME CELL */}
          <div className="bento-cell cell-game">
            <DailyCipher onUnlock={() => playClickSound()} />
          </div>

        </div>

        {/* HIDDEN CHARACTER */}
        <AnimatePresence>
          {peekVisible && (
            <motion.div
              className={`peek-character peek-${peekPosition.side}`}
              initial={{ opacity: 0, x: peekPosition.side === 'right' ? 30 : peekPosition.side === 'left' ? -30 : 0, y: peekPosition.side === 'top' ? -30 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: peekPosition.side === 'right' ? 30 : peekPosition.side === 'left' ? -30 : 0, y: peekPosition.side === 'top' ? -30 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={handleCatchCharacter}
              style={{ cursor: 'pointer' }}
            >
              <div className="peek-astronaut">
                <div className="astronaut-helmet"></div>
                <div className="astronaut-visor"></div>
                <div className="astronaut-body"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
