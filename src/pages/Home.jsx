import { motion } from 'framer-motion';
import { Play, Pause, MapPin, Sparkles, Code, Globe2, BookOpen, Twitter, Linkedin, Twitch, Github, ArrowRight, Rss, Instagram } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import confetti from 'canvas-confetti';
import { photos } from '../data/photos';
import { Howl, Howler } from 'howler';
import './Home.css';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const markers = [
  { markerOffset: 15, name: "Home (US)", coordinates: [-100.0000, 40.0000] },
  { markerOffset: 15, name: "Alps", coordinates: [13.0000, 47.0000] },
  { markerOffset: 15, name: "Greece", coordinates: [23.0000, 39.0000] },
  { markerOffset: -30, name: "Spain", coordinates: [-3.0000, 40.0000] }
];

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handlePlayMusic = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Howl({
          src: ['https://cdn.freesound.org/previews/10/10006_22457-hq.mp3'], // placeholder
          loop: true,
          volume: 0.5,
        });
      }
      audioRef.current.play();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#0ea5e9', '#fff']
      });
    } else {
      if (audioRef.current) audioRef.current.pause();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    show: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', bounce: 0.3, duration: 0.6 } }
  };

  return (
    <div className="home-wrapper">
      <section className="bento-container">
        <motion.div
          className="bento-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* HERO IDENTITY CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-hero">
            <div className="bento-content">
              <div className="hero-header">
                <div className="hero-avatar" style={{ backgroundImage: 'url(https://jarowe.github.io/jarowe/IMG_6214.jpg)' }}></div>
                <div className="hero-titles">
                  <h1>Jared Rowe</h1>
                  <h2>Technologist & Visionary</h2>
                </div>
              </div>
              <p className="hero-bio">
                Building exactly what's never been seen before. From crafting the creative ecosystem at Elgato,
                to leading Starseed Labs, and worldschooling with my boys.
              </p>
            </div>
          </motion.div>

          {/* WORLD MAP CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-map">
            <div className="map-container">
              <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#151515"
                        stroke="rgba(255,255,255,0.05)"
                      />
                    ))
                  }
                </Geographies>
                {markers.map(({ name, coordinates, markerOffset }) => (
                  <Marker key={name} coordinates={coordinates}>
                    <circle r={4} fill="#0ea5e9" stroke="#fff" strokeWidth={1} />
                  </Marker>
                ))}
              </ComposableMap>
            </div>
            <div className="map-badge">
              <Globe2 size={16} /> Worldschooling Family
            </div>
          </motion.div>

          {/* MUSIC CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-music clickable" onClick={handlePlayMusic}>
            <div className="bento-content">
              <div className="music-art">
                {isPlaying ? <Sparkles size={40} color="#fff" /> : <Play size={40} color="#fff" />}
              </div>
              <div>
                <div className="now-playing">AI Soundtrack</div>
                <div className="song-title">Digital Pulse</div>
                <div className="song-artist">By Jarowe</div>
              </div>
              <div className="music-controls">
                <span>{isPlaying ? "Playing..." : "Tap to Play"}</span>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </div>
            </div>
          </motion.div>

          {/* FEATURED PROJECT CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-project clickable" onClick={() => navigate('/projects/beamy')}>
            <div className="project-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop)' }}></div>
            <div className="featured-badge">Featured</div>
            <div className="bento-content">
              <h3 className="project-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>BEAMY</h3>
              <p style={{ color: '#ddd', fontSize: '1rem' }}>Simply Powerful Animation Engine. Built on a C++ core with React frontend.</p>
            </div>
          </motion.div>

          {/* NOW PAGE CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-now clickable" onClick={() => navigate('/now')}>
            <div className="bento-content">
              <div className="now-header">
                <div className="now-pulse"></div>
                Currently
              </div>
              <p style={{ color: '#ddd', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Living in the US, hacking on WebAudio, and exploring GenAI paradigms for creatives.
              </p>
            </div>
          </motion.div>

          {/* SOCIALS CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-socials">
            <div className="bento-content" style={{ padding: '1.5rem' }}>
              <div className="socials-grid">
                <a href="https://x.com/jaredalanrowe" target="_blank" rel="noreferrer" className="social-link"><Twitter size={24} /></a>
                <a href="https://github.com/jarowe" target="_blank" rel="noreferrer" className="social-link"><Github size={24} /></a>
                <a href="https://linkedin.com/in/jaredalanrowe" target="_blank" rel="noreferrer" className="social-link"><Linkedin size={24} /></a>
                <a href="https://www.instagram.com/jaredrowe/" target="_blank" rel="noreferrer" className="social-link"><Instagram size={24} /></a>
              </div>
            </div>
          </motion.div>

          {/* INSTAGRAM CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-instagram clickable" onClick={() => window.open('https://www.instagram.com/jaredrowe/', '_blank')}>
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
          </motion.div>

          {/* DIGITAL GARDEN CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-garden clickable" onClick={() => navigate('/garden')}>
            <div className="bento-content" style={{ justifyContent: 'center' }}>
              <div className="garden-header"><BookOpen size={20} /> The Sandbox Notes</div>
              <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
                Thoughts on AI, technical leadership, and building modern audio-visual pipelines.
              </p>
            </div>
          </motion.div>

          {/* ENTER THE UNIVERSE CELL */}
          <motion.div variants={itemVariants} className="bento-cell cell-universe clickable" onClick={() => navigate('/universe')}>
            <div className="bento-content">
              <div className="universe-content">
                <div>
                  <div className="universe-text">Enter the Universe</div>
                  <p style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Immersive 3D Experience</p>
                </div>
                <div className="enter-btn">
                  Explore <ArrowRight size={18} />
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </section>
    </div>
  );
}
