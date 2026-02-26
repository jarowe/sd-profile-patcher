import { motion } from 'framer-motion';
import { Sparkles, Globe2, BookOpen, ArrowRight, ChevronLeft, ChevronRight, Instagram, Github, Linkedin, Quote } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { photos } from '../data/photos';
import MusicCell from '../components/MusicCell';
import confetti from 'canvas-confetti';
// GSAP removed entirely from Home - using pure CSS animations to prevent black screen bugs
import { playHoverSound, playClickSound } from '../utils/sounds';
import DailyCipher from '../components/DailyCipher';
import SpeedPuzzle from '../components/SpeedPuzzle';
import './Home.css';
import { Howler } from 'howler';
import * as THREE from 'three';
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

const worldschoolMessages = [
  { from: 'Maria', text: "Found a gluten-free bakery in Athens!! The boys lost it" },
  { from: 'Jace', text: "Dad, glaciers move like 1 inch per day. I measured." },
  { from: 'Jax', text: "I negotiated in Greek today. Got 2 euros off." },
  { from: 'Dad', text: "Today's lesson: live volcano. No textbook needed." },
  { from: 'Jole', text: "Can gelato count as lunch? It's educational." },
  { from: 'Maria', text: "Did you pack the GF bread? ...Please say yes." },
  { from: 'Jace', text: "The Greek market lady taught me to count to 10!" },
  { from: 'Dad', text: "WiFi from the Austrian Alps: surprisingly excellent." },
  { from: 'Jax', text: "I navigated the whole city. I'm basically a GPS now." },
  { from: 'Jole', text: "Museum guard said I asked the best question today!" },
  { from: 'Maria', text: "3 countries, 2 weeks. The boys didn't even blink." },
  { from: 'Dad', text: "Celiac life hack: pack snacks for every timezone." },
  { from: 'Jace', text: "Can we homeschool on the beach? Asking for myself." },
  { from: 'Jax', text: "Spain has the BEST gluten-free pizza. Fight me." },
  { from: 'Jole', text: "I drew the Acropolis. It's better than the real one." },
  { from: 'Maria', text: "This is the 4th cafe. We WILL find GF waffles." },
];

const avatarEffects = ['float', 'glitch', 'spin', 'ripple'];

const avatarPhotos = [
  'headshot.jpg',
  'family-alps.jpg',
  'couple-golden-hour.jpg',
  'boys-selfie.jpg',
  'greek-island.jpg',
  '514485957_10106849219267053_8426182179315507744_n.jpg',
  '514538141_18508719016008994_6802406149798537855_n.jpg',
  'rooftop-social.jpg',
  'jaredIMG_4650-3smVbD.jpg',
];

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
  const [activeExpedition, setActiveExpedition] = useState(0);

  const globeRef = useRef();
  const mapContainerRef = useRef();
  const [globeSize, setGlobeSize] = useState({ width: 0, height: 0 });
  const [globeMounted, setGlobeMounted] = useState(false);

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

  // Callback ref: fires when Globe actually mounts (after lazy load resolves)
  const handleGlobeRef = useCallback((el) => {
    globeRef.current = el;
    if (el) setGlobeMounted(true);
  }, []);

  const autoRotateTimer = useRef(null);

  // Auto-cycle through locations when globe is idle
  const globeCycleTimer = useRef(null);
  const isUserInteracting = useRef(false);
  const hasAnimatedIn = useRef(false);

  const startGlobeCycle = useCallback(() => {
    if (globeCycleTimer.current) clearInterval(globeCycleTimer.current);
    globeCycleTimer.current = setInterval(() => {
      if (!isUserInteracting.current && globeRef.current) {
        setActiveExpedition(prev => {
          const next = (prev + 1) % expeditions.length;
          const loc = expeditions[next];
          const controls = globeRef.current.controls();
          if (controls) controls.enableZoom = false; // Disable zoom during transit

          globeRef.current.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.2 }, 2500);
          setHoveredMarker(loc);

          // Clear marker tooltip after a moment
          setTimeout(() => {
            if (controls) controls.enableZoom = true;
            if (!isUserInteracting.current) setHoveredMarker(null);
          }, 3500);
          return next;
        });
      }
    }, 8000);
  }, []);

  // Globe initialization via useEffect + globeMounted (proven reliable approach)
  useEffect(() => {
    if (!globeMounted || !globeRef.current) return;

    let handleStart, handleEnd;

    const initTimer = setTimeout(() => {
      const globe = globeRef.current;
      if (!globe) return;

      try {
        // ------------------------------------------------------------------
        // CONTROLS - weighted momentum spin
        // ------------------------------------------------------------------
        const controls = globe.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8;
        controls.enableZoom = false; // disabled during cinematic
        controls.minDistance = 110;
        controls.maxDistance = 600;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.8;

        handleStart = () => {
          isUserInteracting.current = true;
          controls.autoRotate = false;
          if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
          if (globeCycleTimer.current) clearInterval(globeCycleTimer.current);
        };
        handleEnd = () => {
          autoRotateTimer.current = setTimeout(() => {
            isUserInteracting.current = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0;
            const ramp = setInterval(() => {
              if (controls.autoRotateSpeed < 0.8) {
                controls.autoRotateSpeed += 0.02;
              } else {
                controls.autoRotateSpeed = 0.8;
                clearInterval(ramp);
              }
            }, 50);
            startGlobeCycle();
          }, 5000);
        };
        controls.addEventListener('start', handleStart);
        controls.addEventListener('end', handleEnd);

        // ------------------------------------------------------------------
        // AUDIO ANALYSER
        // ------------------------------------------------------------------
        let audioDataArray = new Uint8Array(64);
        try {
          if (!window.globalAnalyser) {
            window.globalAnalyser = Howler.ctx.createAnalyser();
            window.globalAnalyser.fftSize = 128;
            Howler.masterGain.connect(window.globalAnalyser);
            window.globalAnalyser.connect(Howler.ctx.destination);
          }
        } catch (e) { }

        // ------------------------------------------------------------------
        // SHADERS & EFFECTS (injected into Three.js scene)
        // ------------------------------------------------------------------
        const scene = globe.scene();

        if (!globe.customUniforms) {
          globe.customUniforms = {
            time: { value: 0 },
            audioPulse: { value: 0 },
            warpIntensity: { value: 1.0 }
          };
        }

        // 1. Warp shell (cinematic entrance effect)
        if (!globe.warpShell) {
          const warpMat = new THREE.ShaderMaterial({
            uniforms: globe.customUniforms,
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float time;
              uniform float warpIntensity;
              varying vec2 vUv;
              void main() {
                float dist = distance(vUv, vec2(0.5));
                float ring = sin(dist * 60.0 - time * 15.0) * warpIntensity;
                vec3 color = vec3(ring * 0.3 + 0.5, ring * 0.1, ring * 0.8 + 0.2);
                float alpha = smoothstep(0.5, 0.0, dist) * warpIntensity * abs(ring);
                gl_FragColor = vec4(color, alpha * 0.7);
              }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.FrontSide
          });
          const warpMesh = new THREE.Mesh(new THREE.SphereGeometry(105, 64, 64), warpMat);
          scene.add(warpMesh);
          globe.warpShell = warpMesh;
        }

        // 2. Aurora fresnel envelope
        if (!globe.auroraShell) {
          const auroraMat = new THREE.ShaderMaterial({
            uniforms: globe.customUniforms,
            vertexShader: `
              varying vec3 vNormal;
              varying vec3 vPosition;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float time;
              uniform float audioPulse;
              varying vec3 vNormal;
              varying vec3 vPosition;
              const vec3 color1 = vec3(0.0, 0.9, 0.6);
              const vec3 color2 = vec3(0.5, 0.1, 0.9);
              const vec3 color3 = vec3(0.1, 0.5, 1.0);
              vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
              vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
              float snoise(vec3 v){
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod(i, 289.0);
                vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ * ns.x + ns.yyyy;
                vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
              }
              void main() {
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float fresnel = clamp(1.0 - dot(viewDir, vNormal), 0.0, 1.0);
                fresnel = pow(fresnel, 2.5);
                float n = snoise(vPosition * 0.015 + vec3(0.0, time * 0.2, time * 0.1));
                float mask = smoothstep(0.1, 0.9, n * 0.5 + 0.5);
                vec3 col = mix(color1, color2, mask);
                col = mix(col, color3, audioPulse * fresnel);
                float alpha = fresnel * (0.8 + n * 0.4 + audioPulse);
                gl_FragColor = vec4(col * (1.5 + audioPulse), alpha * 0.8);
              }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.FrontSide
          });
          const auroraMesh = new THREE.Mesh(new THREE.SphereGeometry(103.5, 64, 64), auroraMat);
          scene.add(auroraMesh);
          globe.auroraShell = auroraMesh;
        }

        // 3. Dual particles: 8000 deep stars + 4000 magic dust
        if (!globe.particleSystem) {
          const bgStarCount = 8000;
          const dustCount = 4000;
          const totalCount = bgStarCount + dustCount;
          const posArr = new Float32Array(totalCount * 3);
          const scaleArr = new Float32Array(totalCount);
          const colorArr = new Float32Array(totalCount * 3);
          const typeArr = new Float32Array(totalCount);

          for (let i = 0; i < totalCount; i++) {
            const isDust = i >= bgStarCount;
            const r = isDust ? (103 + Math.random() * 50) : (400 + Math.random() * 800);
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            posArr[i*3] = r * Math.sin(phi) * Math.cos(theta);
            posArr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            posArr[i*3+2] = r * Math.cos(phi);
            scaleArr[i] = Math.random();
            typeArr[i] = isDust ? 1.0 : 0.0;
            if (isDust) {
              const m = Math.random();
              (m > 0.66 ? new THREE.Color(0x7c3aed) : m > 0.33 ? new THREE.Color(0x38bdf8) : new THREE.Color(0xf472b6)).toArray(colorArr, i*3);
            } else {
              (Math.random() > 0.8 ? new THREE.Color(0xaae3ff) : new THREE.Color(0xffffff)).toArray(colorArr, i*3);
            }
          }

          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
          geo.setAttribute('aScale', new THREE.BufferAttribute(scaleArr, 1));
          geo.setAttribute('customColor', new THREE.BufferAttribute(colorArr, 3));
          geo.setAttribute('pType', new THREE.BufferAttribute(typeArr, 1));

          const pMat = new THREE.ShaderMaterial({
            uniforms: { time: globe.customUniforms.time, audioPulse: globe.customUniforms.audioPulse, pixelRatio: { value: window.devicePixelRatio || 1 } },
            vertexShader: `
              uniform float time; uniform float audioPulse; uniform float pixelRatio;
              attribute float aScale; attribute vec3 customColor; attribute float pType;
              varying vec3 vColor; varying float vType;
              void main() {
                vColor = customColor; vType = pType;
                vec3 pos = position;
                if (pType > 0.5) {
                  pos.x += sin(time*0.5+pos.y*0.05)*(5.0+audioPulse*20.0);
                  pos.y += cos(time*0.3+pos.x*0.05)*(5.0+audioPulse*20.0);
                  pos.z += sin(time*0.4+pos.z*0.05)*(5.0+audioPulse*20.0);
                }
                vec4 mv = modelViewMatrix * vec4(pos,1.0);
                gl_Position = projectionMatrix * mv;
                float sz = (pType>0.5) ? aScale*(3.0+audioPulse*15.0) : aScale*(1.5+audioPulse*2.0);
                gl_PointSize = sz * pixelRatio * (300.0 / -mv.z);
              }
            `,
            fragmentShader: `
              varying vec3 vColor; varying float vType; uniform float audioPulse;
              void main() {
                vec2 xy = gl_PointCoord.xy - vec2(0.5);
                float ll = length(xy);
                if(ll>0.5) discard;
                float glow = (vType>0.5) ? smoothstep(0.5,0.1,ll) : smoothstep(0.5,0.4,ll);
                float alpha = glow * (0.4 + audioPulse*0.6);
                gl_FragColor = vec4(vColor*(1.0+audioPulse*((vType>0.5)?1.5:0.5)), alpha);
              }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
          });
          const pts = new THREE.Points(geo, pMat);
          scene.add(pts);
          globe.particleSystem = pts;
        }

        // ------------------------------------------------------------------
        // CINEMATIC ENTRANCE
        // ------------------------------------------------------------------
        if (!hasAnimatedIn.current) {
          hasAnimatedIn.current = true;
          const first = expeditions[0];
          globe.pointOfView({ lat: -70, lng: 280, altitude: 8.0 }, 0);

          setTimeout(() => {
            if (!globeRef.current) return;
            globeRef.current.pointOfView({ lat: first.lat, lng: first.lng, altitude: 1.5 }, 6000);

            const clockStart = Date.now();
            const fadeWarp = () => {
              const elapsed = Date.now() - clockStart;
              const p = Math.min(elapsed / 6000, 1.0);
              if (globe.customUniforms) globe.customUniforms.warpIntensity.value = Math.pow(1.0 - p, 4.0);
              if (p < 1.0) requestAnimationFrame(fadeWarp);
              else if (globe.warpShell) { scene.remove(globe.warpShell); globe.warpShell = null; }
            };
            fadeWarp();

            setTimeout(() => {
              if (globeRef.current) {
                const c = globeRef.current.controls();
                if (c) c.enableZoom = true;
              }
              startGlobeCycle();
            }, 6500);
          }, 150);
        }

        // Animation loop for shaders
        const clock = new THREE.Clock();
        if (!globe.animateTick) {
          globe.animateTick = true;
          const tick = () => {
            if (globeRef.current && globe.customUniforms) {
              globe.customUniforms.time.value = clock.getElapsedTime();
              if (window.globalAnalyser) {
                window.globalAnalyser.getByteFrequencyData(audioDataArray);
                let sum = 0;
                for (let k = 0; k < 32; k++) sum += audioDataArray[k];
                globe.customUniforms.audioPulse.value = (sum / 32) / 255.0;
              }
            }
            requestAnimationFrame(tick);
          };
          tick();
        }
      } catch (e) {
        console.warn('Globe init error:', e);
      }
    }, 500);

    return () => {
      clearTimeout(initTimer);
      if (globeRef.current && handleStart) {
        try {
          const c = globeRef.current.controls();
          c.removeEventListener('start', handleStart);
          c.removeEventListener('end', handleEnd);
        } catch (_) {}
      }
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
      if (globeCycleTimer.current) clearInterval(globeCycleTimer.current);
    };
  }, [globeMounted, startGlobeCycle]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const container = useRef();
  const [showBrand, setShowBrand] = useState(() => !sessionStorage.getItem('jarowe_visited'));

  // Brand reveal - pure CSS animation handles visuals, this just dismisses the overlay
  useEffect(() => {
    if (!showBrand) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem('jarowe_visited', 'true');
      setShowBrand(false);
    }, 3300);
    return () => clearTimeout(timer);
  }, [showBrand]);

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
      // Step 1: restore transition
      cell.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      // Step 2: force reflow so browser registers the transition BEFORE the transform change
      void cell.offsetHeight;
      // Step 3: now animate back to neutral
      cell.style.transform = '';
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
        navigate('/vault');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Globe location navigation
  const navigateGlobe = useCallback((direction) => {
    const newIdx = direction === 'next'
      ? (activeExpedition + 1) % expeditions.length
      : (activeExpedition - 1 + expeditions.length) % expeditions.length;
    setActiveExpedition(newIdx);
    const loc = expeditions[newIdx];
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.2 }, 1500);
    }
    setHoveredMarker(loc);
    playClickSound();
  }, [activeExpedition]);

  // Avatar click effects + photo cycling
  const [avatarEffect, setAvatarEffect] = useState(null);
  const [avatarPhotoIdx, setAvatarPhotoIdx] = useState(0);
  const avatarClickCount = useRef(0);
  const avatarDiscovered = useRef(localStorage.getItem('jarowe_avatar_discovered') === 'true');

  // Auto-cycle avatar photos every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAvatarPhotoIdx(prev => (prev + 1) % avatarPhotos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleAvatarClick = useCallback((e) => {
    e.stopPropagation();
    const effectIndex = avatarClickCount.current % avatarEffects.length;
    setAvatarEffect(avatarEffects[effectIndex]);
    avatarClickCount.current++;
    playClickSound();

    // Advance to next photo on click
    setAvatarPhotoIdx(prev => (prev + 1) % avatarPhotos.length);

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

  // Globe text message blurbs
  const [globeMessage, setGlobeMessage] = useState(null);
  const globeMsgIdx = useRef(0);

  useEffect(() => {
    const cycle = () => {
      const msg = worldschoolMessages[globeMsgIdx.current % worldschoolMessages.length];
      globeMsgIdx.current++;
      setGlobeMessage({ phase: 'typing', from: msg.from });
      setTimeout(() => setGlobeMessage({ phase: 'visible', ...msg }), 1800);
      setTimeout(() => setGlobeMessage(null), 7000);
    };
    const delay = setTimeout(cycle, 3000);
    const interval = setInterval(cycle, 10000);
    return () => { clearTimeout(delay); clearInterval(interval); };
  }, []);

  // Hidden character peek-a-boo
  const [peekVisible, setPeekVisible] = useState(false);
  const [peekPosition, setPeekPosition] = useState({ cell: 0, side: 'right' });
  const [prismBops, setPrismBops] = useState(0);
  const [prismBubble, setPrismBubble] = useState(null);
  const [showSpeedGame, setShowSpeedGame] = useState(false);

  const prismPhrases = [
    "Hey! You found me!",
    "Boop! Again!",
    "One more... I dare you!",
    "WHOA! Secret time!",
    "Can't catch me!",
    "I see everything...",
    "Did you try the cipher?",
    "Go explore the universe!",
    "I'm made of pure light!",
    "Refraction is my cardio",
    "The boys would love me",
    "I've been to Greece too!",
    "Click the avatar... trust me",
    "Type 'vault' for a surprise!",
    "Your vibes are immaculate",
    "I'm basically a disco ball",
  ];

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 12000 + Math.random() * 20000;
      return setTimeout(() => {
        const sides = ['right', 'left', 'top'];
        setPeekPosition({
          cell: Math.floor(Math.random() * 4),
          side: sides[Math.floor(Math.random() * sides.length)]
        });
        setPeekVisible(true);
        setTimeout(() => setPeekVisible(false), 4000);
        timerId = scheduleNext();
      }, delay);
    };

    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  const handleCatchCharacter = useCallback(() => {
    setPeekVisible(false);
    playClickSound();
    const newBops = prismBops + 1;
    setPrismBops(newBops);
    setPrismBubble(prismPhrases[(newBops - 1) % prismPhrases.length]);
    setTimeout(() => setPrismBubble(null), 2500);

    confetti({
      particleCount: 40 + newBops * 20,
      spread: 60 + newBops * 10,
      origin: { y: 0.5 },
      colors: ['#22c55e', '#fbbf24', '#38bdf8', '#7c3aed', '#f472b6'],
    });

    // Every 3 bops, trigger the speed puzzle game
    if (newBops % 3 === 0) {
      setTimeout(() => setShowSpeedGame(true), 1500);
    }
  }, [prismBops]);

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
                  onClick={handleAvatarClick}
                  role="button"
                  tabIndex={0}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={avatarPhotoIdx}
                      className="avatar-photo-inner"
                      style={{ backgroundImage: `url(${BASE}images/${avatarPhotos[avatarPhotoIdx]})` }}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.8 }}
                    />
                  </AnimatePresence>
                </div>
                <div className="hero-titles">
                  <h1>Jared Rowe</h1>
                  <h2>Dad. Builder. Noise Maker.</h2>
                </div>
              </div>
              <p className="hero-bio">
                Worldschooling dad of three. Maria and I traded the traditional classroom for the Austrian Alps, Greek islands, and everywhere in between. By day I shape creative tools at Elgato, by night I build at Starseed Labs. The whole world is our school.
              </p>
            </div>
          </div>

          {/* WORLD MAP CELL */}
          <div className="bento-cell cell-map">
            <div className="map-container" ref={mapContainerRef}>
              <Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>Loading globe...</div>}>
                {globeSize.width > 0 && (
                  <Globe
                    ref={handleGlobeRef}
                    width={globeSize.width}
                    height={globeSize.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundColor="rgba(0,0,0,0)"
                    atmosphereColor="#7c3aed"
                    atmosphereAltitude={0.45}
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
                    labelText={(d) => (d === hoveredMarker || expeditions.indexOf(d) === activeExpedition) ? d.name : ''}
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
            {/* Fog / particle overlay */}
            <div className="globe-fog-layer" />
            <div className="globe-particles-layer" />
            {/* WORLDSCHOOLING FAMILY badge */}
            <div className="worldschool-badge">
              <span className="ws-dot" />
              WORLDSCHOOLING FAMILY
            </div>
            {/* Text message blurbs */}
            <AnimatePresence>
              {globeMessage && (
                <motion.div
                  className="globe-msg-bubble"
                  key={globeMsgIdx.current}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {globeMessage.phase === 'typing' ? (
                    <>
                      <span className="msg-sender">{globeMessage.from}</span>
                      <div className="typing-dots"><span /><span /><span /></div>
                    </>
                  ) : (
                    <>
                      <span className="msg-sender">{globeMessage.from}</span>
                      <span className="msg-text">{globeMessage.text}</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="map-badge">
              <button className="globe-nav-btn" onClick={(e) => { e.stopPropagation(); navigateGlobe('prev'); }} aria-label="Previous location">
                <ChevronLeft size={14} />
              </button>
              <div className="map-badge-center">
                <Globe2 size={14} />
                <span className="map-badge-location">
                  {hoveredMarker ? hoveredMarker.name : expeditions[activeExpedition].name}
                </span>
              </div>
              <button className="globe-nav-btn" onClick={(e) => { e.stopPropagation(); navigateGlobe('next'); }} aria-label="Next location">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="bento-cell cell-music">
            <MusicCell />
          </div>

          {/* WORKSHOP CELL */}
          <div className="bento-cell cell-project clickable" onClick={() => navigate('/workshop')}>
            <div className="project-image" style={{ backgroundImage: `url(${BASE}images/tools-builds-bg.png)`, filter: 'brightness(0.7) contrast(1.1)' }}></div>
            <div className="featured-badge">Tools & Builds</div>
            <div className="bento-content" style={{ zIndex: 1 }}>
              <h3 className="project-title" style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>The Workshop</h3>
              <p style={{ color: '#eee', fontSize: '0.95rem' }}>SD Patcher, BEAMY, & Experiments.</p>
            </div>
          </div>

          {/* NOW PAGE CELL */}
          <div
            className="bento-cell cell-now clickable tilt-enabled"
            onClick={() => navigate('/now')}
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
            <div className="insta-overlay" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                <div className="insta-text">Life in Photos</div>
                <Instagram size={20} color="#fff" />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={photoIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: '0.85rem', color: '#ccc', letterSpacing: '0.5px' }}
                >
                  {photos[photoIndex].caption}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* DIGITAL GARDEN CELL */}
          <div className="bento-cell cell-garden clickable" onClick={() => navigate('/garden')}>
            <div className="bento-content" style={{ justifyContent: 'center' }}>
              <div className="garden-header"><BookOpen size={20} /> Brain Dump</div>
              <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
                Half-baked ideas I'm thinking out loud about.
              </p>
            </div>
          </div>

          {/* ENTER THE UNIVERSE CELL */}
          <div className="bento-cell cell-universe clickable" onClick={() => navigate('/universe')}>
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
          <div className="bento-cell cell-into clickable" onClick={() => navigate('/favorites')}>
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

          {/* DAILY CIPHER + VAULT CELL */}
          <div className="bento-cell cell-game-vault">
            <DailyCipher showVault={true} />
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
              {/* Bop counter badge */}
              {prismBops > 0 && (
                <div className="prism-bop-counter">{prismBops}</div>
              )}
              {/* Talk bubble */}
              <AnimatePresence>
                {prismBubble && (
                  <motion.div
                    className="prism-bubble"
                    initial={{ opacity: 0, scale: 0, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {prismBubble}
                  </motion.div>
                )}
              </AnimatePresence>
              <svg className="peek-prism" width="48" height="56" viewBox="0 0 48 56" fill="none">
                <defs>
                  <linearGradient id="prism-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed">
                      <animate attributeName="stop-color" values="#7c3aed;#38bdf8;#f472b6;#22c55e;#7c3aed" dur="4s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="50%" stopColor="#38bdf8">
                      <animate attributeName="stop-color" values="#38bdf8;#f472b6;#22c55e;#7c3aed;#38bdf8" dur="4s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#f472b6">
                      <animate attributeName="stop-color" values="#f472b6;#22c55e;#7c3aed;#38bdf8;#f472b6" dur="4s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>
                  <linearGradient id="prism-shine" x1="0%" y1="0%" x2="50%" y2="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                  <filter id="prism-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <polygon points="24,4 44,44 4,44" fill="url(#prism-gradient)" filter="url(#prism-glow)" opacity="0.9" />
                <polygon points="24,4 44,44 4,44" fill="url(#prism-shine)" />
                <line x1="24" y1="12" x2="14" y2="38" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <line x1="24" y1="12" x2="34" y2="38" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <circle cx="24" cy="28" r="5" fill="rgba(0,0,0,0.3)" />
                <circle cx="24" cy="28" r="3" fill="rgba(255,255,255,0.9)">
                  <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="24" cy="28" r="1.5" fill="#050510" />
                <circle cx="25.5" cy="26.5" r="0.8" fill="rgba(255,255,255,0.8)" />
                <g opacity="0.6">
                  <line x1="38" y1="36" x2="46" y2="48" stroke="#ef4444" strokeWidth="1.5" />
                  <line x1="39" y1="37" x2="47" y2="50" stroke="#f59e0b" strokeWidth="1.5" />
                  <line x1="40" y1="38" x2="48" y2="52" stroke="#22c55e" strokeWidth="1.5" />
                  <line x1="41" y1="39" x2="48" y2="54" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1="42" y1="40" x2="47" y2="56" stroke="#7c3aed" strokeWidth="1.5" />
                </g>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SPEED PUZZLE GAME */}
        <AnimatePresence>
          {showSpeedGame && (
            <SpeedPuzzle onClose={() => setShowSpeedGame(false)} />
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
