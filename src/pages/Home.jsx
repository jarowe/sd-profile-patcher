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

// Real-time sun position based on UTC time (solar declination + hour angle)
function getSunDirection() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  // Solar declination: axial tilt effect (-23.4° to +23.4°)
  const declination = -23.4397 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
  // Hour angle from UTC
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const solarLongitude = -((utcHours - 12) * 15);
  const latRad = declination * (Math.PI / 180);
  const lngRad = solarLongitude * (Math.PI / 180);
  return new THREE.Vector3(
    Math.cos(latRad) * Math.cos(lngRad),
    Math.sin(latRad),
    -Math.cos(latRad) * Math.sin(lngRad)
  ).normalize();
}

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
  const [globeReady, setGlobeReady] = useState(false);

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
        // EXTREME MAGICAL SHADERS & EFFECTS
        // ------------------------------------------------------------------
        const scene = globe.scene();
        
        // --- A. Cinematic Lighting Setup ---
        // Clean out default lights to own the scene fully
        scene.children.filter(c => c.type === 'DirectionalLight' || c.type === 'AmbientLight').forEach(l => scene.remove(l));
        const ambient = new THREE.AmbientLight(0xffffff, 0.5); // Brighter base to show texture
        const rimColor = new THREE.DirectionalLight(0x7c3aed, 2.5); // Deep purple rim
        rimColor.position.set(-200, 100, -200);
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(200, 100, 200);
        scene.add(ambient, rimColor, sunLight);

        if (!globe.customUniforms) {
          globe.customUniforms = {
            time: { value: 0 },
            audioPulse: { value: 0 },
            prismPulse: { value: 0.0 },
            introIntensity: { value: 1.0 },
            sunDir: { value: getSunDirection() }
          };
        }
        // Position lights to match real-time sun direction
        const initSunPos = globe.customUniforms.sunDir.value.clone().multiplyScalar(200);
        sunLight.position.copy(initSunPos);
        rimColor.position.copy(initSunPos.clone().negate().add(new THREE.Vector3(0, 100, 0)));
        globe._sunLight = sunLight;
        globe._rimLight = rimColor;

        // --- B. Living Ocean Shader Material ---
        if (!globe.oceanMaterialSet) {
          const texLoader = new THREE.TextureLoader();
          const earthTex = texLoader.load('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
          const nightTex = texLoader.load('//cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_lights_2048.png');
          const waterTex = texLoader.load('//unpkg.com/three-globe/example/img/earth-water.png');
          // 4K packed texture: R=bump, G=roughness, B=clouds (Bobby Roe / three.js Journey approach)
          const packedTex = texLoader.load('//cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_bump_roughness_clouds_4096.jpg');
          const oceanMat = new THREE.ShaderMaterial({
            uniforms: {
              earthMap: { value: earthTex },
              nightMap: { value: nightTex },
              waterMask: { value: waterTex },
              packedTex: { value: packedTex },
              time: globe.customUniforms.time,
              audioPulse: globe.customUniforms.audioPulse,
              prismPulse: globe.customUniforms.prismPulse,
              sunDir: globe.customUniforms.sunDir
            },
            vertexShader: `
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vWorldNormal;
              varying vec3 vWorldPos;
              varying vec3 vViewPos;
              void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vViewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D earthMap;
              uniform sampler2D nightMap;
              uniform sampler2D waterMask;
              uniform sampler2D packedTex;
              uniform float time;
              uniform float audioPulse;
              uniform float prismPulse;
              uniform vec3 sunDir;
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vWorldNormal;
              varying vec3 vWorldPos;
              varying vec3 vViewPos;

              float hash21(vec2 p) {
                p = fract(p * vec2(234.34, 435.345));
                p += dot(p, p + 34.23);
                return fract(p.x * p.y);
              }
              float vnoise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                  mix(hash21(i), hash21(i + vec2(1,0)), f.x),
                  mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x),
                  f.y
                );
              }
              float fbm(vec2 p) {
                float v = 0.0; float a = 0.5;
                mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
                for (int i = 0; i < 5; i++) {
                  v += a * vnoise(p);
                  p = rot * p * 2.0;
                  a *= 0.5;
                }
                return v;
              }

              void main() {
                vec4 dayCol = texture2D(earthMap, vUv);
                vec3 nightCol = texture2D(nightMap, vUv).rgb;
                float waterVal = texture2D(waterMask, vUv).r;
                float isWater = smoothstep(0.3, 0.7, waterVal);
                vec3 packed = texture2D(packedTex, vUv).rgb;

                // All lighting in WORLD space so sun stays fixed as camera orbits
                vec3 worldViewDir = normalize(cameraPosition - vWorldPos);
                float NdotL = dot(vWorldNormal, sunDir);
                float dayStrength = smoothstep(-0.25, 0.5, NdotL);
                float dayLight = 0.08 + max(NdotL, 0.0) * 0.92;
                float rawFresnel = clamp(1.0 - dot(worldViewDir, vWorldNormal), 0.0, 1.0);
                vec3 halfDir = normalize(sunDir + worldViewDir);

                // --- LAND: matte terrain + bump detail + night lights ---
                float landFresnel = pow(rawFresnel, 3.5);
                float bumpVal = packed.r;
                float bumpLight = 1.0 + (bumpVal - 0.5) * 0.35 * dayStrength;
                vec3 landDay = dayCol.rgb * dayLight * bumpLight + dayCol.rgb * landFresnel * 0.10;
                float roughness = packed.g;
                float landSpec = (1.0 - roughness) * pow(max(dot(vWorldNormal, halfDir), 0.0), 60.0) * 0.12;
                landDay += vec3(0.7, 0.75, 0.8) * landSpec;
                // City lights: warm golden glow with exponential peak brightness
                float lightPeak = max(max(nightCol.r, nightCol.g), nightCol.b);
                vec3 warmLight = nightCol * vec3(1.2, 1.0, 0.7);
                vec3 landNight = warmLight * 3.0 + warmLight * lightPeak * 5.0;
                landNight += vec3(1.0, 0.7, 0.3) * pow(lightPeak, 3.0) * 2.0;
                vec3 landColor = mix(landNight, landDay, dayStrength);

                // --- WATER: animated ocean + tidal currents + specular + Fresnel ---
                // Ocean currents: large-scale flow patterns
                float lat = vUv.y * 3.14159 - 1.5708;
                vec2 currentFlow = vec2(
                  sin(lat * 3.0) * 0.008 + sin(lat * 7.0 + time * 0.02) * 0.003,
                  cos(vUv.x * 6.28 + time * 0.015) * 0.004
                );
                // Tidal pull (slow rhythmic surge)
                float tide = sin(time * 0.03) * 0.003 + sin(time * 0.07 + vUv.x * 12.0) * 0.001;
                vec2 tidalUv = vUv + currentFlow + vec2(tide, tide * 0.5);

                vec2 waveUv = tidalUv * 1200.0;
                vec2 bigWaveUv = tidalUv * 300.0;
                float t = time * 0.12;

                // Large ocean swells with tidal variation
                float bigW1 = fbm(bigWaveUv + vec2(t * 0.8, t * 0.5));
                float bigW2 = fbm(bigWaveUv * 0.6 - vec2(t * 0.3, t * 0.6));
                float tidalSurge = sin(time * 0.05 + vUv.y * 8.0) * 0.15;
                float bigWaves = (bigW1 + bigW2) * 0.5 + tidalSurge * 0.1;

                // Fine detail ripples + crosshatch currents
                float w1 = fbm(waveUv + vec2(t, t * 0.7));
                float w2 = fbm(waveUv * 0.7 - vec2(t * 0.5, t * 0.3));
                float w3 = fbm(waveUv * 1.3 + vec2(t * 0.2, -t * 0.4)) * 0.3;
                float waves = (w1 + w2) * 0.5 + w3;

                // Combined wave normals: big swells + fine ripples
                float dx = fbm(waveUv + vec2(0.01, 0.0) + vec2(t, t*0.7)) - w1;
                float dy = fbm(waveUv + vec2(0.0, 0.01) + vec2(t, t*0.7)) - w1;
                float bdx = fbm(bigWaveUv + vec2(0.02, 0.0) + vec2(t*0.8, t*0.5)) - bigW1;
                float bdy = fbm(bigWaveUv + vec2(0.0, 0.02) + vec2(t*0.8, t*0.5)) - bigW1;
                vec3 waveN = normalize(vWorldNormal + vec3(dx + bdx * 2.0, dy + bdy * 2.0, 0.0) * 8.0);

                float spec = pow(max(dot(waveN, halfDir), 0.0), 120.0);
                float glare = pow(max(dot(waveN, halfDir), 0.0), 12.0);
                float wFresnel = pow(1.0 - max(dot(worldViewDir, waveN), 0.0), 4.0);

                // Ocean color with depth variation + subsurface glow
                vec3 deepSea = vec3(0.005, 0.02, 0.08);
                vec3 midSea = vec3(0.02, 0.08, 0.22);
                vec3 shallowSea = vec3(0.06, 0.18, 0.38);
                vec3 oceanBase = mix(deepSea, midSea, waves);
                oceanBase = mix(oceanBase, shallowSea, bigWaves * 0.4);
                // Subsurface scattering: sun-facing water glows from within
                vec3 subsurface = vec3(0.0, 0.12, 0.25) * pow(max(NdotL, 0.0), 2.0) * bigWaves;
                oceanBase += subsurface;
                vec3 oceanCol = mix(dayCol.rgb * 0.35, oceanBase, 0.65);

                // Sky reflection via Fresnel
                vec3 skyReflection = mix(vec3(0.15, 0.3, 0.6), vec3(0.5, 0.65, 0.85), wFresnel);

                vec3 waterDay = oceanCol * dayLight
                  + vec3(1.0, 0.95, 0.85) * spec * 2.5
                  + vec3(0.9, 0.85, 0.7) * glare * 0.5
                  + skyReflection * wFresnel * 0.5
                  + vec3(0.3, 0.5, 0.8) * waves * audioPulse * 0.3;
                // Night water reflects city light glow from nearby land
                float cityGlow = max(max(nightCol.r, nightCol.g), nightCol.b);
                vec3 waterNight = deepSea * 0.2 + vec3(0.01, 0.02, 0.05) * bigWaves
                  + vec3(0.8, 0.6, 0.3) * cityGlow * 0.15;
                vec3 waterColor = mix(waterNight, waterDay, dayStrength);

                // Liquid glass shimmer on prism bop (water goes prismatic)
                vec3 prismWater = vec3(
                  0.5 + 0.5 * sin(time * 2.0 + vUv.x * 20.0),
                  0.5 + 0.5 * sin(time * 2.0 + vUv.x * 20.0 + 2.094),
                  0.5 + 0.5 * sin(time * 2.0 + vUv.x * 20.0 + 4.189)
                );
                waterColor = mix(waterColor, prismWater * waterColor * 2.0, prismPulse * 0.3 * isWater);

                vec3 finalColor = mix(landColor, waterColor, isWater);

                // Cloud shadows from packed blue channel
                float cloudDensity = smoothstep(0.2, 0.7, packed.b);
                finalColor *= (1.0 - cloudDensity * 0.3 * dayStrength);

                // --- TSL-style atmospheric blending on surface ---
                vec3 atmosphereDayColor = vec3(0.3, 0.7, 1.0);
                vec3 atmosphereTwilightColor = vec3(0.74, 0.29, 0.04);
                vec3 atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, smoothstep(-0.25, 0.75, NdotL));
                float atmosphereMix = clamp(smoothstep(-0.5, 1.0, NdotL) * pow(rawFresnel, 2.0), 0.0, 1.0);
                finalColor = mix(finalColor, atmosphereColor, atmosphereMix * 0.6);

                // Sunset glow at terminator
                float sunsetGlow = smoothstep(-0.05, 0.3, NdotL) * smoothstep(0.5, 0.05, max(NdotL, 0.0));
                finalColor += vec3(1.0, 0.35, 0.12) * sunsetGlow * 0.15;

                gl_FragColor = vec4(finalColor, 1.0);
              }
            `,
          });

          // Replace the globe's default MeshPhongMaterial
          scene.traverse((child) => {
            if (child.isMesh && child.material && child.material.type === 'MeshPhongMaterial' && child.geometry?.parameters?.radius > 90) {
              child.material = oceanMat;
              globe._globeMesh = child; // Store for raycaster occlusion
            }
          });
          globe.oceanMaterialSet = true;
        }

        // --- B2. Volumetric Cloud Layer (4K from packed texture blue channel) ---
        if (!globe.cloudMesh) {
          // Use the same 4K packed texture - blue channel has high-res cloud data
          const cloud4KTex = new THREE.TextureLoader().load(
            '//cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_bump_roughness_clouds_4096.jpg'
          );

          const cloudMat = new THREE.ShaderMaterial({
            uniforms: {
              cloudsMap: { value: cloud4KTex },
              sunDir: globe.customUniforms.sunDir,
              time: globe.customUniforms.time,
              audioPulse: globe.customUniforms.audioPulse,
            },
            vertexShader: `
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vViewPos;
              varying vec3 vWorldNormal;
              void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                vViewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D cloudsMap;
              uniform vec3 sunDir;
              uniform float time;
              uniform float audioPulse;
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vViewPos;
              varying vec3 vWorldNormal;

              void main() {
                // Organic noise warp: clouds drift and distort subtly
                vec2 cloudUv = vUv;
                float warpX = sin(vUv.y * 10.0 + time * 0.15) * 0.004
                            + sin(vUv.y * 25.0 + time * 0.08) * 0.002;
                float warpY = cos(vUv.x * 8.0 + time * 0.12) * 0.003
                            + cos(vUv.x * 20.0 + time * 0.1) * 0.001;
                cloudUv += vec2(warpX, warpY);

                // BLUE channel = cloud density in packed texture (4096x2048)
                float cloudVal = texture2D(cloudsMap, cloudUv).b;

                // Smooth threshold: only show actual clouds, not noise floor
                float alpha = smoothstep(0.2, 0.8, cloudVal);

                // Sun illumination
                float NdotL = dot(vWorldNormal, sunDir);
                float dayFactor = smoothstep(-0.15, 0.5, NdotL);
                float illumination = 0.08 + max(NdotL, 0.0) * 0.92;

                // Lit clouds are bright white, shadow side is blue-gray
                vec3 litCloud = vec3(1.0, 0.99, 0.96);
                vec3 shadowCloud = vec3(0.15, 0.18, 0.25);
                vec3 cloudColor = mix(shadowCloud, litCloud, dayFactor) * illumination;

                // Self-shadowing: thicker cloud masses have darker cores
                float thickness = cloudVal * cloudVal;
                cloudColor *= (1.0 - thickness * 0.2);

                // Subsurface scattering: thick clouds glow slightly warm on sun-facing side
                cloudColor += vec3(0.15, 0.12, 0.08) * thickness * max(NdotL, 0.0);

                // Sunset/terminator scattering - golden edge glow
                float terminator = smoothstep(0.0, 0.1, max(NdotL, 0.0)) * smoothstep(0.22, 0.1, max(NdotL, 0.0));
                cloudColor += vec3(1.0, 0.4, 0.1) * terminator * cloudVal * 2.0;

                // Silver lining: bright rim light on cloud edges facing camera
                vec3 viewDir = normalize(-vViewPos);
                float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.5);
                cloudColor += vec3(1.0, 0.97, 0.93) * rim * 0.3 * illumination;

                // Music-reactive cloud brightness
                cloudColor += cloudColor * audioPulse * 0.15;

                // Night side: clouds fade but thin wisp remains for realism
                alpha *= max(dayFactor, 0.04);

                // Bump alpha based on cloud thickness for volumetric feel
                alpha = alpha * (0.7 + thickness * 0.3);

                gl_FragColor = vec4(cloudColor, alpha * 0.9);
              }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            side: THREE.FrontSide
          });

          const cloudMesh = new THREE.Mesh(
            new THREE.SphereGeometry(100.8, 96, 96),  // Higher segments for 4K detail
            cloudMat
          );
          cloudMesh.renderOrder = 1;  // After globe surface (0), before aurora (2)
          scene.add(cloudMesh);
          globe.cloudMesh = cloudMesh;
        }

        // --- B3. Iridescent Atmospheric Haze (noise fog between clouds and aurora) ---
        if (!globe.hazeShell) {
          const hazeMat = new THREE.ShaderMaterial({
            uniforms: {
              time: globe.customUniforms.time,
              sunDir: globe.customUniforms.sunDir
            },
            vertexShader: `
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldNormal;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float time;
              uniform vec3 sunDir;
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldNormal;
              void main() {
                vec3 viewDir = normalize(-vPosition);
                float rawFresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.8);

                // Noise-based atmospheric fog bands
                float n1 = sin(vWorldNormal.x * 14.0 + time * 0.2) * 0.5 + 0.5;
                float n2 = sin(vWorldNormal.y * 10.0 + time * 0.15 + 1.5) * 0.5 + 0.5;
                float n3 = sin(vWorldNormal.z * 12.0 + time * 0.18 + 3.0) * 0.5 + 0.5;
                float n4 = sin((vWorldNormal.x + vWorldNormal.z) * 7.0 + time * 0.1) * 0.5 + 0.5;
                float fogPattern = n1 * 0.3 + n2 * 0.25 + n3 * 0.25 + n4 * 0.2;

                // TSL-style atmosphere base + iridescent shimmer
                float sunOrientation = dot(vWorldNormal, sunDir);
                vec3 atmosphereDayColor = vec3(0.3, 0.7, 1.0);
                vec3 atmosphereTwilightColor = vec3(0.74, 0.29, 0.04);
                vec3 baseColor = mix(atmosphereTwilightColor, atmosphereDayColor, smoothstep(-0.25, 0.75, sunOrientation));

                // Iridescent prismatic shimmer overlay
                vec3 iriShimmer = vec3(
                  0.15 * sin(rawFresnel * 8.0 + time * 0.25),
                  0.15 * sin(rawFresnel * 8.0 + time * 0.25 + 2.094),
                  0.12 * sin(rawFresnel * 8.0 + time * 0.25 + 4.189)
                );
                vec3 hazeColor = baseColor + iriShimmer;

                // Night side: deeper indigo
                float dayStrength = smoothstep(-0.5, 0.5, sunOrientation);
                hazeColor = mix(vec3(0.06, 0.03, 0.15), hazeColor, dayStrength);

                // Mask haze by sun orientation: disappears on dark side
                float dayAlpha = smoothstep(-0.5, 0.0, sunOrientation);
                float alpha = rawFresnel * fogPattern * 0.12 * dayAlpha;
                gl_FragColor = vec4(hazeColor, alpha);
              }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            side: THREE.FrontSide
          });
          const hazeMesh = new THREE.Mesh(new THREE.SphereGeometry(101.2, 64, 64), hazeMat);
          hazeMesh.renderOrder = 1.5;
          scene.add(hazeMesh);
          globe.hazeShell = hazeMesh;
        }

        // --- C. Aurora Borealis Shell (depthTest off = renders OVER globe face) ---
        if (!globe.auroraShell) {
          const auroraMat = new THREE.ShaderMaterial({
            uniforms: globe.customUniforms,
            vertexShader: `
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldPos;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float time;
              uniform float audioPulse;
              uniform float prismPulse;
              uniform float introIntensity;
              uniform vec3 sunDir;
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldPos;
              const vec3 auroraGreen = vec3(0.0, 0.95, 0.5);
              const vec3 auroraPurple = vec3(0.5, 0.1, 0.95);
              const vec3 auroraBlue = vec3(0.1, 0.5, 1.0);
              const vec3 auroraRed = vec3(0.8, 0.1, 0.3);
              const vec3 auroraGold = vec3(1.0, 0.8, 0.3);

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
                vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y); vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
                m = m * m; return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
              }
              void main() {
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float rawFresnel = clamp(1.0 - dot(viewDir, vNormal), 0.0, 1.0);

                // Latitude constraint: aurora in polar regions only (after intro)
                float latitude = abs(normalize(vWorldPos).y);
                // Northern lights event: ~30s cycle with sharp burst extending south
                float eventCycle = sin(time * 0.3) * 0.5 + 0.5;
                float eventPulse = pow(eventCycle, 6.0);
                float auroraZone = smoothstep(0.55 - eventPulse * 0.15, 0.75, latitude);
                // Aurora prefers night/twilight side (more visible where it's dark)
                float sunOrientation = dot(normalize(vWorldPos), sunDir);
                float nightFactor = smoothstep(0.3, -0.2, sunOrientation);
                auroraZone *= max(nightFactor, 0.2);
                // During intro: full globe coverage, then settle to poles
                auroraZone = mix(auroraZone, 1.0, introIntensity);
                // Prism bop briefly extends aurora
                auroraZone = mix(auroraZone, 1.0, prismPulse * 0.4);

                // Fresnel: intro wraps globe, settles to edge glow
                float fresnelPow = max(0.15, 2.0 - introIntensity * 1.8 - prismPulse * 0.6);
                float fresnel = pow(rawFresnel, fresnelPow);

                // Flowing aurora speed (slower prism response)
                float speed = time * (0.18 + introIntensity * 0.4 + prismPulse * 0.1);
                float n1 = snoise(vPosition * 0.012 + vec3(0.0, speed, speed * 0.5));
                float n2 = snoise(vPosition * 0.025 + vec3(speed * 0.3, 0.0, speed));
                float n3 = snoise(vPosition * 0.008 + vec3(speed * 0.15, speed * 0.2, 0.0));
                float n = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
                float mask = smoothstep(0.0, 1.0, n * 0.5 + 0.5);

                // Multi-color aurora bands
                vec3 col = mix(auroraGreen, auroraPurple, mask);
                col = mix(col, auroraBlue, smoothstep(0.3, 0.7, n2 * 0.5 + 0.5));
                col = mix(col, auroraRed, smoothstep(0.7, 1.0, rawFresnel) * 0.3);
                col = mix(col, auroraGold, introIntensity * smoothstep(0.4, 0.8, n3 * 0.5 + 0.5) * 0.4);
                // Electric event burst: brighter green during events
                col = mix(col, auroraGreen * 2.5, eventPulse * auroraZone * 0.4);
                col = mix(col, col * 1.5, audioPulse * rawFresnel);

                // Slow prismatic color shift on bop
                vec3 hitColor = vec3(
                  0.5 + 0.5 * sin(time * 1.5),
                  0.5 + 0.5 * sin(time * 1.5 + 2.094),
                  0.5 + 0.5 * sin(time * 1.5 + 4.189)
                );
                col = mix(col, hitColor, prismPulse * 0.25);

                // Curtain bands + intro coverage
                float curtain = smoothstep(-0.2, 0.6, n1) * smoothstep(-0.3, 0.5, n2);
                float introBoost = introIntensity * (0.6 + n3 * 0.4);
                float alpha = max(fresnel * curtain * auroraZone, introBoost) * (0.7 + audioPulse * 0.5 + prismPulse * 0.2);

                float brightness = 1.0 + introIntensity * 0.8 + audioPulse * 0.3 + eventPulse * 0.5 + prismPulse * 0.2;
                float alphaOut = alpha * (0.25 + introIntensity * 0.3);
                gl_FragColor = vec4(col * brightness, alphaOut);
              }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            side: THREE.FrontSide
          });
          const auroraMesh = new THREE.Mesh(new THREE.SphereGeometry(101.5, 64, 64), auroraMat);
          auroraMesh.renderOrder = 2;
          scene.add(auroraMesh);
          globe.auroraShell = auroraMesh;
        }

        // --- D. Atmospheric Glow (inner rim + outer halo, matching NASA reference) ---
        if (!globe.atmosShell) {
          // Inner atmosphere rim (FrontSide - visible edge glow ON the globe)
          const innerAtmosMat = new THREE.ShaderMaterial({
            uniforms: {
              time: globe.customUniforms.time,
              introIntensity: globe.customUniforms.introIntensity,
              sunDir: globe.customUniforms.sunDir
            },
            vertexShader: `
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldNormal;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float time;
              uniform float introIntensity;
              uniform vec3 sunDir;
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vWorldNormal;
              void main() {
                vec3 viewDir = normalize(-vPosition);
                float rawFresnel = 1.0 - abs(dot(viewDir, vNormal));
                float baseFresnel = pow(rawFresnel, 3.0);

                // Dynamic atmospheric shimmer
                float shimmer = sin(vWorldNormal.x * 10.0 + time * 0.5) * 0.10
                              + sin(vWorldNormal.y * 8.0 + time * 0.35) * 0.06
                              + sin(vWorldNormal.z * 6.0 + time * 0.25) * 0.04;
                float fresnel = baseFresnel * (1.0 + shimmer);

                // TSL-style atmosphere: blue day + warm twilight
                float sunOrientation = dot(vWorldNormal, sunDir);
                vec3 atmosphereDayColor = vec3(0.3, 0.7, 1.0);
                vec3 atmosphereTwilightColor = vec3(0.74, 0.29, 0.04);
                vec3 atmosColor = mix(atmosphereTwilightColor, atmosphereDayColor, smoothstep(-0.25, 0.75, sunOrientation));

                // Night side: subtle purple/indigo
                vec3 nightAtmos = vec3(0.06, 0.02, 0.15);
                float dayMask = smoothstep(-0.5, 1.0, sunOrientation);
                atmosColor = mix(nightAtmos, atmosColor, dayMask);

                // Intro sweep: light wave sweeps around the globe
                float sweepAngle = time * 1.8;
                float sweepMask = pow(sin(vWorldNormal.x * 2.0 + vWorldNormal.z * 2.0 + sweepAngle) * 0.5 + 0.5, 3.0);
                float introSweep = introIntensity * sweepMask * 0.4;

                // Alpha masked by dayMask: atmosphere disappears on the dark side
                float dayAlpha = smoothstep(-0.5, 0.0, sunOrientation);
                float alpha = fresnel * (0.6 + introIntensity * 0.25) + introSweep;
                alpha *= max(dayAlpha, introIntensity);
                gl_FragColor = vec4(atmosColor, alpha);
              }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            side: THREE.FrontSide
          });
          const innerAtmos = new THREE.Mesh(new THREE.SphereGeometry(102, 64, 64), innerAtmosMat);
          innerAtmos.renderOrder = 3;
          scene.add(innerAtmos);

          // Outer atmospheric halo (BackSide - glowing rim AROUND the globe silhouette)
          const outerAtmosMat = new THREE.ShaderMaterial({
            uniforms: {
              sunDir: globe.customUniforms.sunDir,
              introIntensity: globe.customUniforms.introIntensity
            },
            vertexShader: `
              varying vec3 vNormal;
              varying vec3 vWorldNormal;
              varying vec3 vPosition;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform vec3 sunDir;
              uniform float introIntensity;
              varying vec3 vNormal;
              varying vec3 vWorldNormal;
              varying vec3 vPosition;
              void main() {
                vec3 viewDir = normalize(-vPosition);
                float rawFresnel = 1.0 - abs(dot(viewDir, vNormal));

                // TSL-style outer halo: visible from center, fades at extreme rim
                float haloFresnel = clamp(1.0 - (rawFresnel - 0.73) / 0.27, 0.0, 1.0);
                float alpha = pow(haloFresnel, 3.0);

                // Atmosphere color: blue day + warm twilight
                float sunOrientation = dot(vWorldNormal, sunDir);
                vec3 atmosphereDayColor = vec3(0.3, 0.7, 1.0);
                vec3 atmosphereTwilightColor = vec3(0.74, 0.29, 0.04);
                vec3 color = mix(atmosphereTwilightColor, atmosphereDayColor, smoothstep(-0.25, 0.75, sunOrientation));

                // Mask by sun orientation (no glow on deep night side)
                float dayStrength = smoothstep(-0.5, 1.0, sunOrientation);
                alpha *= dayStrength;
                alpha *= (0.6 + introIntensity * 0.2);

                gl_FragColor = vec4(color, alpha);
              }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            side: THREE.BackSide
          });
          const outerAtmos = new THREE.Mesh(new THREE.SphereGeometry(107, 64, 64), outerAtmosMat);
          outerAtmos.renderOrder = 3;
          scene.add(outerAtmos);

          globe.atmosShell = { inner: innerAtmos, outer: outerAtmos };
        }

        // --- D2. Cinematic Lens Flare (procedural, at sun position) ---
        if (!globe.lensFlare) {
          const flareSunDir = globe.customUniforms.sunDir.value;

          // Generate radial gradient texture
          const makeFlareTexture = (size, stops) => {
            const c = document.createElement('canvas');
            c.width = c.height = size;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            stops.forEach(([pos, color]) => g.addColorStop(pos, color));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, size, size);
            return new THREE.CanvasTexture(c);
          };

          // Main warm sun glow
          const mainTex = makeFlareTexture(256, [
            [0, 'rgba(255,255,240,1)'],
            [0.05, 'rgba(255,245,220,0.9)'],
            [0.15, 'rgba(255,220,150,0.5)'],
            [0.4, 'rgba(255,180,80,0.15)'],
            [1, 'rgba(255,150,50,0)']
          ]);

          // Diffuse outer halo
          const haloTex = makeFlareTexture(256, [
            [0, 'rgba(255,200,100,0.3)'],
            [0.3, 'rgba(200,150,255,0.1)'],
            [0.6, 'rgba(100,150,255,0.05)'],
            [1, 'rgba(50,100,255,0)']
          ]);

          // Star-burst rays texture
          const rayTex = (() => {
            const c = document.createElement('canvas');
            c.width = c.height = 256;
            const ctx = c.getContext('2d');
            ctx.translate(128, 128);
            const rayCount = 8;
            for (let i = 0; i < rayCount; i++) {
              ctx.save();
              ctx.rotate((Math.PI * 2 / rayCount) * i);
              const g = ctx.createLinearGradient(0, 0, 120, 0);
              g.addColorStop(0, 'rgba(255,240,200,0.6)');
              g.addColorStop(0.3, 'rgba(255,220,150,0.2)');
              g.addColorStop(1, 'rgba(255,200,100,0)');
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.moveTo(0, -1.5);
              ctx.lineTo(120, -0.5);
              ctx.lineTo(120, 0.5);
              ctx.lineTo(0, 1.5);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
            return new THREE.CanvasTexture(c);
          })();

          const flarePos = flareSunDir.clone().multiplyScalar(800);

          // Layer 1: Main sun glow (massive cinematic star)
          const mainMat = new THREE.SpriteMaterial({
            map: mainTex, transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false, opacity: 0.9
          });
          const mainFlare = new THREE.Sprite(mainMat);
          mainFlare.position.copy(flarePos);
          mainFlare.scale.set(150, 150, 1);
          scene.add(mainFlare);

          // Layer 2: Starburst rays
          const rayMat = new THREE.SpriteMaterial({
            map: rayTex, transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false, opacity: 0.6
          });
          const rays = new THREE.Sprite(rayMat);
          rays.position.copy(flarePos);
          rays.scale.set(300, 300, 1);
          scene.add(rays);

          // Layer 3: Wide halo
          const haloMat = new THREE.SpriteMaterial({
            map: haloTex, transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false, opacity: 0.35
          });
          const halo = new THREE.Sprite(haloMat);
          halo.position.copy(flarePos);
          halo.scale.set(550, 550, 1);
          scene.add(halo);

          // Layer 4: JJ Abrams anamorphic horizontal streak
          const anamorphicTex = (() => {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 64;
            const ctx = c.getContext('2d');
            const g = ctx.createLinearGradient(0, 32, 512, 32);
            g.addColorStop(0, 'rgba(100,150,255,0)');
            g.addColorStop(0.15, 'rgba(150,180,255,0.03)');
            g.addColorStop(0.35, 'rgba(200,220,255,0.12)');
            g.addColorStop(0.5, 'rgba(255,250,240,0.4)');
            g.addColorStop(0.65, 'rgba(200,220,255,0.12)');
            g.addColorStop(0.85, 'rgba(150,180,255,0.03)');
            g.addColorStop(1, 'rgba(100,150,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 512, 64);
            // Vertical fade for thin streak
            const vg = ctx.createLinearGradient(0, 0, 0, 64);
            vg.addColorStop(0, 'rgba(255,255,255,0)');
            vg.addColorStop(0.3, 'rgba(255,255,255,1)');
            vg.addColorStop(0.7, 'rgba(255,255,255,1)');
            vg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, 512, 64);
            return new THREE.CanvasTexture(c);
          })();
          const anamorphicMat = new THREE.SpriteMaterial({
            map: anamorphicTex, transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: false, opacity: 0.45
          });
          const anamorphic = new THREE.Sprite(anamorphicMat);
          anamorphic.position.copy(flarePos);
          anamorphic.scale.set(900, 40, 1);
          scene.add(anamorphic);

          // Lens artifacts along sun-to-center line
          const hexTex = (() => {
            const c = document.createElement('canvas');
            c.width = c.height = 64;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
            g.addColorStop(0, 'rgba(120,180,255,0.35)');
            g.addColorStop(0.6, 'rgba(160,100,255,0.1)');
            g.addColorStop(1, 'rgba(100,150,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i - Math.PI / 6;
              const x = 32 + 26 * Math.cos(a);
              const y = 32 + 26 * Math.sin(a);
              i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            return new THREE.CanvasTexture(c);
          })();

          const artifacts = [];
          [0.3, 0.55, -0.15, -0.4, -0.7].forEach((t, i) => {
            const mat = new THREE.SpriteMaterial({
              map: hexTex, transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false, depthTest: false,
              opacity: 0.2 - i * 0.02,
              color: i % 2 === 0 ? 0x88aaff : 0xcc88ff
            });
            const s = new THREE.Sprite(mat);
            s.position.copy(flareSunDir.clone().multiplyScalar(800 * (1 - t)));
            const size = 12 + i * 8;
            s.scale.set(size, size, 1);
            scene.add(s);
            artifacts.push(s);
          });

          globe.lensFlare = { main: mainFlare, rays, halo, anamorphic, artifacts };
        }

        // --- E. Tri-Layer Particles (TINY twinkling magic + deep stars + reaction bursts) ---
        if (!globe.particleSystem) {
          const bgStarCount = 8000;
          const dustCount = 8000; // doubled tiny dust
          const totalCount = bgStarCount + dustCount;
          const posArr = new Float32Array(totalCount * 3);
          const scaleArr = new Float32Array(totalCount);
          const colorArr = new Float32Array(totalCount * 3);
          const typeArr = new Float32Array(totalCount);
          const burstOffsetArr = new Float32Array(totalCount * 3); // for crazy hit bursts

          for (let i = 0; i < totalCount; i++) {
            const isDust = i >= bgStarCount;
            // Magically hugging the atmosphere
            const r = isDust ? (101.5 + Math.random() * 8) : (400 + Math.random() * 800);
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            posArr[i*3] = r * Math.sin(phi) * Math.cos(theta);
            posArr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            posArr[i*3+2] = r * Math.cos(phi);
            scaleArr[i] = Math.random();
            typeArr[i] = isDust ? 1.0 : 0.0;

            // Random burst offsets (outwards)
            burstOffsetArr[i*3] = posArr[i*3] * (Math.random() * 0.2);
            burstOffsetArr[i*3+1] = posArr[i*3+1] * (Math.random() * 0.2);
            burstOffsetArr[i*3+2] = posArr[i*3+2] * (Math.random() * 0.2);

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
          geo.setAttribute('burstOffset', new THREE.BufferAttribute(burstOffsetArr, 3));

          // Mouse tracking for particle ripples
          const mouseWorld = new THREE.Vector3(0, 0, 0);
          const mouseUniforms = { value: mouseWorld };
          globe._particleMousePos = mouseWorld;
          const globeEl = mapContainerRef.current;
          if (globeEl) {
            const onMouseMove = (e) => {
              const rect = globeEl.getBoundingClientRect();
              const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
              // Project mouse into 3D space near the globe surface
              const cam = globe.camera();
              if (cam) {
                const ray = new THREE.Vector3(nx, ny, 0.5).unproject(cam);
                const dir = ray.sub(cam.position).normalize();
                // Intersect with sphere of radius ~105 (dust cloud region)
                const a = dir.dot(dir);
                const b = 2 * cam.position.dot(dir);
                const c = cam.position.dot(cam.position) - 105 * 105;
                const disc = b * b - 4 * a * c;
                if (disc > 0) {
                  const t = (-b - Math.sqrt(disc)) / (2 * a);
                  if (t > 0) {
                    mouseWorld.copy(cam.position).add(dir.multiplyScalar(t));
                  }
                }
              }
            };
            globeEl.addEventListener('mousemove', onMouseMove);
            globe._particleMouseCleanup = () => globeEl.removeEventListener('mousemove', onMouseMove);
          }

          const pMat = new THREE.ShaderMaterial({
            uniforms: {
              time: globe.customUniforms.time,
              audioPulse: globe.customUniforms.audioPulse,
              prismPulse: globe.customUniforms.prismPulse,
              pixelRatio: { value: window.devicePixelRatio || 1 },
              mousePos: mouseUniforms
            },
            vertexShader: `
              uniform float time; uniform float audioPulse; uniform float prismPulse; uniform float pixelRatio;
              uniform vec3 mousePos;
              attribute float aScale; attribute vec3 customColor; attribute float pType; attribute vec3 burstOffset;
              varying vec3 vColor; varying float vType; varying float vMouseDist;
              void main() {
                vColor = customColor; vType = pType;
                vec3 pos = position;
                if (pType > 0.5) {
                  float speed = time * (0.8 + prismPulse * 0.3);
                  // Gentle orbital drift
                  pos.x += sin(speed*0.5+pos.y*0.05)*(1.5+audioPulse*4.0);
                  pos.y += cos(speed*0.3+pos.x*0.05)*(1.5+audioPulse*4.0);
                  pos.z += sin(speed*0.4+pos.z*0.05)*(1.5+audioPulse*4.0);
                  // Gentle breathing on bop, no explosion
                  pos += burstOffset * prismPulse * 0.05;

                  // Mouse ripple: particles near mouse get pushed outward like water
                  float mouseDist = distance(pos, mousePos);
                  float rippleRadius = 8.0;
                  if (mouseDist < rippleRadius && length(mousePos) > 1.0) {
                    vec3 pushDir = normalize(pos - mousePos);
                    float rippleStr = (1.0 - mouseDist / rippleRadius);
                    rippleStr = rippleStr * rippleStr * 3.0;
                    // Ripple wave - particles oscillate as the ripple passes through
                    float wave = sin(mouseDist * 0.5 - time * 4.0) * 0.5 + 0.5;
                    pos += pushDir * rippleStr * wave;
                  }
                  vMouseDist = mouseDist;
                } else {
                  vMouseDist = 999.0;
                }
                vec4 mv = modelViewMatrix * vec4(pos,1.0);
                gl_Position = projectionMatrix * mv;
                // Gentle prism glow-up (reduced from before)
                float baseSize = (pType>0.5) ? aScale*(1.0 + audioPulse*3.0 + prismPulse*1.2) : aScale*(1.8+audioPulse*2.0);
                gl_PointSize = baseSize * pixelRatio * (300.0 / -mv.z);
              }
            `,
            fragmentShader: `
              varying vec3 vColor; varying float vType; varying float vMouseDist;
              uniform float audioPulse; uniform float prismPulse; uniform float time;
              void main() {
                vec2 xy = gl_PointCoord.xy - vec2(0.5);
                float ll = length(xy);
                if(ll>0.5) discard;
                float glow = (vType>0.5) ? smoothstep(0.5,0.0,ll) : smoothstep(0.5,0.4,ll);
                float alpha = glow * (0.6 + audioPulse*0.4 + prismPulse*0.3);

                // Mouse proximity glow - particles near cursor glow brighter
                float mouseGlow = (vMouseDist < 8.0) ? (1.0 - vMouseDist / 8.0) * 0.5 : 0.0;

                // Gentle prismatic color shift
                vec3 prismatic = vec3(
                  0.5 + 0.5 * sin(time * 3.0),
                  0.5 + 0.5 * sin(time * 3.0 + 2.094),
                  0.5 + 0.5 * sin(time * 3.0 + 4.189)
                );
                vec3 shimmer = mix(vColor, prismatic, prismPulse * 0.4);
                // Mouse makes nearby particles glow white/bright
                shimmer += vec3(0.3, 0.5, 1.0) * mouseGlow;
                gl_FragColor = vec4(shimmer*(1.0 + audioPulse*0.8 + prismPulse*0.3 + mouseGlow), alpha + mouseGlow * 0.3);
              }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
          });
          const pts = new THREE.Points(geo, pMat);
          scene.add(pts);
          globe.particleSystem = pts;
        }

        // --- F. Orbiting Objects + Micro Hidden Gems ---
        if (!globe.satellitesGroup) {
          globe.satellitesGroup = new THREE.Group();
          scene.add(globe.satellitesGroup);

          const satColors = [0xffffff, 0x38bdf8, 0xfbbf24, 0xf472b6];
          // High-orbit satellites
          for(let i=0; i<15; i++) {
            const geo = new THREE.BoxGeometry(0.5, 0.2, 0.5);
            const mat = new THREE.MeshBasicMaterial({ color: satColors[i % satColors.length], wireframe: true });
            const m = new THREE.Mesh(geo, mat);
            m.userData = {
              r: 115 + Math.random() * 20,
              lat: (Math.random() - 0.5) * Math.PI,
              lng: (Math.random() - 0.5) * Math.PI * 2,
              speedLat: (Math.random() - 0.5) * 0.05,
              speedLng: (Math.random() - 0.5) * 0.08 + 0.02
            };
            globe.satellitesGroup.add(m);
          }

          // Micro wireframe planes (TINY - need to zoom very close)
          for(let i=0; i<12; i++) {
            const planeGroup = new THREE.Group();
            // Fuselage
            const body = new THREE.Mesh(
              new THREE.CylinderGeometry(0.02, 0.015, 0.15, 4),
              new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 })
            );
            body.rotation.z = Math.PI / 2;
            planeGroup.add(body);
            // Wings
            const wing = new THREE.Mesh(
              new THREE.BoxGeometry(0.04, 0.005, 0.12),
              new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.5 })
            );
            planeGroup.add(wing);
            planeGroup.userData = {
              r: 100.6 + Math.random() * 0.8,
              lat: (Math.random() - 0.5) * Math.PI * 0.8,
              lng: Math.random() * Math.PI * 2,
              speedLat: (Math.random() - 0.5) * 0.01,
              speedLng: 0.03 + Math.random() * 0.04,
              type: 'plane'
            };
            globe.satellitesGroup.add(planeGroup);
          }

          // Micro wireframe cars (MICROSCOPIC - on the surface)
          for(let i=0; i<8; i++) {
            const car = new THREE.Mesh(
              new THREE.BoxGeometry(0.04, 0.02, 0.02),
              new THREE.MeshBasicMaterial({ color: [0xef4444, 0xfbbf24, 0x22c55e, 0x38bdf8][i%4], wireframe: true, transparent: true, opacity: 0.5 })
            );
            car.userData = {
              r: 100.15,
              lat: (Math.random() - 0.5) * Math.PI * 0.6,
              lng: Math.random() * Math.PI * 2,
              speedLat: 0,
              speedLng: 0.005 + Math.random() * 0.01,
              type: 'car'
            };
            globe.satellitesGroup.add(car);
          }

          // Ghost spirit wisps (tiny glowing entities near surface)
          for(let i=0; i<20; i++) {
            const wispGeo = new THREE.SphereGeometry(0.03 + Math.random() * 0.02, 4, 4);
            const wispMat = new THREE.MeshBasicMaterial({
              color: [0x7c3aed, 0x38bdf8, 0xf472b6, 0x22c55e, 0xfbbf24][i%5],
              wireframe: true,
              transparent: true,
              opacity: 0.3 + Math.random() * 0.3
            });
            const wisp = new THREE.Mesh(wispGeo, wispMat);
            wisp.userData = {
              r: 100.3 + Math.random() * 1.0,
              lat: (Math.random() - 0.5) * Math.PI,
              lng: Math.random() * Math.PI * 2,
              speedLat: (Math.random() - 0.5) * 0.02,
              speedLng: (Math.random() - 0.5) * 0.03,
              type: 'wisp',
              bobPhase: Math.random() * Math.PI * 2,
              bobSpeed: 1.0 + Math.random() * 2.0
            };
            globe.satellitesGroup.add(wisp);
          }
        }

        // ------------------------------------------------------------------
        // CINEMATIC ENTRANCE - fade reveal + sweeping camera
        // ------------------------------------------------------------------
        if (!hasAnimatedIn.current) {
          hasAnimatedIn.current = true;
          const first = expeditions[0];
          // Position camera BEFORE revealing (container starts at opacity 0)
          globe.pointOfView({ lat: first.lat + 25, lng: first.lng - 50, altitude: 3.0 }, 0);

          // Reveal the globe (CSS opacity transition handles the fade)
          requestAnimationFrame(() => setGlobeReady(true));

          // Begin cinematic sweep
          setTimeout(() => {
            if (!globeRef.current) return;
            globeRef.current.pointOfView({ lat: first.lat, lng: first.lng, altitude: 1.5 }, 4000);

            setTimeout(() => {
              if (globeRef.current) {
                const c = globeRef.current.controls();
                if (c) c.enableZoom = true;
              }
              startGlobeCycle();
            }, 4500);
          }, 200);
        }

        // --- G. Animation loop for shaders & motion ---
        const clock = new THREE.Clock();
        if (!globe.animateTick) {
          globe.animateTick = true;
          const tick = () => {
            if (globeRef.current && globe.customUniforms) {
              const dt = clock.getDelta();
              const elTs = clock.getElapsedTime();
              globe.customUniforms.time.value = elTs;

              // Update real-time sun position (cheap computation, updates all shared sunDir uniforms)
              const newSunDir = getSunDirection();
              globe.customUniforms.sunDir.value.copy(newSunDir);
              // Move directional lights to match sun
              if (globe._sunLight) globe._sunLight.position.copy(newSunDir.clone().multiplyScalar(200));
              if (globe._rimLight) globe._rimLight.position.copy(newSunDir.clone().negate().add(new THREE.Vector3(0, 100, 0)));

              // Decay intro aurora (swirling orb fades over ~5 seconds)
              if (globe.customUniforms.introIntensity.value > 0) {
                globe.customUniforms.introIntensity.value = Math.max(0, globe.customUniforms.introIntensity.value - dt * 0.2);
              }

              // Decay Prism Pulse slowly and gracefully (8+ second fade)
              if (globe.customUniforms.prismPulse.value > 0) {
                 const ppv = globe.customUniforms.prismPulse.value;
                 // Slower exponential decay: gentle return to normal
                 globe.customUniforms.prismPulse.value = Math.max(0, ppv - dt * (0.08 + ppv * 0.06));
              }

              if (window.globalAnalyser) {
                window.globalAnalyser.getByteFrequencyData(audioDataArray);
                let sum = 0;
                for (let k = 0; k < 32; k++) sum += audioDataArray[k];
                globe.customUniforms.audioPulse.value = (sum / 32) / 255.0;
              }

              // Rotate cloud layer slowly (counter to globe rotation) + subtle tilt
              if (globe.cloudMesh) {
                globe.cloudMesh.rotation.y += dt * 0.012;
                globe.cloudMesh.rotation.x = Math.sin(elTs * 0.03) * 0.005;
              }

              // Animate lens flare with occlusion (fades behind globe)
              if (globe.lensFlare) {
                const lf = globe.lensFlare;
                // Update flare positions to match dynamic sun direction
                const flareBasePos = newSunDir.clone().multiplyScalar(800);
                lf.main.position.copy(flareBasePos);
                if (lf.rays) lf.rays.position.copy(flareBasePos);
                if (lf.halo) lf.halo.position.copy(flareBasePos);
                if (lf.anamorphic) lf.anamorphic.position.copy(flareBasePos);
                if (lf.artifacts) {
                  const offsets = [0.3, 0.55, -0.15, -0.4, -0.7];
                  lf.artifacts.forEach((a, i) => {
                    a.position.copy(newSunDir.clone().multiplyScalar(800 * (1 - offsets[i])));
                  });
                }

                const camera = globe.camera();
                const flareWorldPos = lf.main.position.clone();

                // Occlusion: raycast from camera toward sun, check if globe blocks it
                let occlusionTarget = 0;
                if (camera && !globe._flareRaycaster) {
                  globe._flareRaycaster = new THREE.Raycaster();
                  globe._flareOcclusion = 0;
                }
                if (globe._flareRaycaster && camera) {
                  const dir = flareWorldPos.clone().sub(camera.position).normalize();
                  globe._flareRaycaster.set(camera.position, dir);
                  const hits = globe._globeMesh ? globe._flareRaycaster.intersectObjects([globe._globeMesh], false) : [];
                  const sunDist = camera.position.distanceTo(flareWorldPos);
                  occlusionTarget = (hits.length > 0 && hits[0].distance < sunDist) ? 1.0 : 0.0;
                  // Sharp clip at earth edge
                  globe._flareOcclusion += (occlusionTarget - globe._flareOcclusion) * Math.min(dt * 15.0, 1.0);
                }
                const flareVis = 1.0 - (globe._flareOcclusion || 0);

                if (lf.rays) {
                  lf.rays.material.rotation = elTs * 0.04;
                  lf.rays.material.opacity = (0.45 + Math.sin(elTs * 0.8) * 0.15) * flareVis;
                }
                if (lf.main) {
                  const breathe = 1.0 + Math.sin(elTs * 1.2) * 0.12;
                  lf.main.scale.set(150 * breathe, 150 * breathe, 1);
                  lf.main.material.opacity = 0.9 * flareVis;
                }
                if (lf.halo) {
                  const hBreath = 1.0 + Math.sin(elTs * 0.5) * 0.08;
                  lf.halo.scale.set(550 * hBreath, 550 * hBreath, 1);
                  lf.halo.material.opacity = 0.4 * flareVis;
                }
                if (lf.anamorphic) {
                  const streakBreath = 1.0 + Math.sin(elTs * 0.6) * 0.08;
                  lf.anamorphic.scale.set(900 * streakBreath, 40, 1);
                  lf.anamorphic.material.opacity = 0.5 * flareVis;
                }
                if (lf.artifacts) {
                  lf.artifacts.forEach(a => {
                    a.material.opacity = a.material.opacity > 0 ? a.material.opacity * flareVis : 0;
                  });
                }
              }

              // Animate Satellites & Planes
              if (globe.satellitesGroup) {
                const pp = globe.customUniforms.prismPulse.value;
                const globalPrismMultiplier = 1.0 + pp * 1.5;
                globe.satellitesGroup.children.forEach(m => {
                  const ud = m.userData;
                  ud.lat += ud.speedLat * dt * globalPrismMultiplier;
                  ud.lng += ud.speedLng * dt * globalPrismMultiplier;

                  const phi = Math.PI / 2 - ud.lat;
                  const theta = ud.lng;
                  // Wisps bob up and down gently
                  const bobR = ud.type === 'wisp'
                    ? ud.r + Math.sin(elTs * ud.bobSpeed + ud.bobPhase) * 0.15
                    : ud.r;

                  m.position.x = bobR * Math.sin(phi) * Math.cos(theta);
                  m.position.y = bobR * Math.cos(phi);
                  m.position.z = bobR * Math.sin(phi) * Math.sin(theta);

                  if (ud.type === 'plane') {
                    // Planes orient in direction of travel
                    const fwdTheta = theta + ud.speedLng * 10;
                    const fwdX = ud.r * Math.sin(phi) * Math.cos(fwdTheta);
                    const fwdY = ud.r * Math.cos(phi);
                    const fwdZ = ud.r * Math.sin(phi) * Math.sin(fwdTheta);
                    m.lookAt(fwdX, fwdY, fwdZ);
                  } else if (ud.type === 'wisp') {
                    // Wisps pulse opacity
                    m.material.opacity = 0.3 + Math.sin(elTs * ud.bobSpeed + ud.bobPhase) * 0.2;
                  } else {
                    m.lookAt(0, 0, 0);
                  }
                });
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
      if (globeRef.current?._particleMouseCleanup) globeRef.current._particleMouseCleanup();
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
  const [prismSparkles, setPrismSparkles] = useState([]);
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
    if (globeRef.current && globeRef.current.customUniforms) {
      globeRef.current.customUniforms.prismPulse.value = 1.0; // TRIGGER EXTREME GLOBE REACTION
    }
    setPrismBops(newBops);
    setPrismBubble(prismPhrases[(newBops - 1) % prismPhrases.length]);
    setTimeout(() => setPrismBubble(null), 2500);

    confetti({
      particleCount: 20 + newBops * 5,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#22c55e', '#fbbf24', '#38bdf8', '#7c3aed', '#f472b6'],
      gravity: 0.4,
      scalar: 0.7,
      drift: 0.5,
      ticks: 150,
    });

    // Spawn sparkle trail particles
    const sparkles = Array.from({ length: 16 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100 - 20,
      color: ['#7c3aed', '#38bdf8', '#f472b6', '#22c55e', '#fbbf24', '#ef4444', '#a78bfa', '#34d399'][i % 8],
      delay: Math.random() * 0.6,
      size: 2 + Math.random() * 5,
      duration: 1.5 + Math.random() * 1.5,
    }));
    setPrismSparkles(sparkles);
    setTimeout(() => setPrismSparkles([]), 3500);

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
            <div className="map-container" ref={mapContainerRef} style={{ opacity: globeReady ? 1 : 0, transition: 'opacity 1.5s ease-in' }}>
              <Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>Loading globe...</div>}>
                {globeSize.width > 0 && (
                  <Globe
                    ref={handleGlobeRef}
                    width={globeSize.width}
                    height={globeSize.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundColor="rgba(0,0,0,0)"
                    showAtmosphere={false}

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
              <div className="prism-3d">
                <svg className="peek-prism" width="70" height="65" viewBox="-10 -2 76 64" fill="none">
                  <defs>
                    {/* Multi-layer glass gradient - simulates internal dispersion */}
                    <linearGradient id="prism-glass-base" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(167,139,250,0.55)">
                        <animate attributeName="stop-color" values="rgba(167,139,250,0.55);rgba(56,189,248,0.5);rgba(244,114,182,0.45);rgba(34,197,94,0.5);rgba(167,139,250,0.55)" dur="6s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%" stopColor="rgba(56,189,248,0.25)">
                        <animate attributeName="stop-color" values="rgba(56,189,248,0.25);rgba(244,114,182,0.25);rgba(251,191,36,0.25);rgba(124,58,237,0.25);rgba(56,189,248,0.25)" dur="6s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="rgba(244,114,182,0.5)">
                        <animate attributeName="stop-color" values="rgba(244,114,182,0.5);rgba(34,197,94,0.45);rgba(167,139,250,0.5);rgba(56,189,248,0.45);rgba(244,114,182,0.5)" dur="6s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                    {/* Glass surface specular highlight */}
                    <linearGradient id="prism-specular" x1="20%" y1="0%" x2="80%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.7)">
                        <animate attributeName="stop-color" values="rgba(255,255,255,0.7);rgba(255,255,255,0.4);rgba(255,255,255,0.7)" dur="3s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="25%" stopColor="rgba(255,255,255,0.04)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
                      <stop offset="75%" stopColor="rgba(255,255,255,0.12)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
                    </linearGradient>
                    {/* Internal radial light */}
                    <radialGradient id="prism-inner-light" cx="45%" cy="40%" r="50%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.3)">
                        <animate attributeName="stop-color" values="rgba(255,255,255,0.3);rgba(167,139,250,0.2);rgba(56,189,248,0.2);rgba(255,255,255,0.3)" dur="4s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                    {/* Edge highlight for glass depth */}
                    <linearGradient id="prism-edge-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                      <stop offset="15%" stopColor="rgba(255,255,255,0.15)" />
                      <stop offset="85%" stopColor="rgba(255,255,255,0.1)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
                    </linearGradient>
                    {/* Glass luminosity glow */}
                    <filter id="glass-glow" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="3.5" result="glow" />
                      <feColorMatrix type="saturate" values="2.5" in="glow" result="sat" />
                      <feMerge><feMergeNode in="sat" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    {/* Wide soft ray glow */}
                    <filter id="ray-soft" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {/* Clip for internal effects */}
                    <clipPath id="prism-clip"><path d="M31,9 L47,43 Q51,49 45,49 L11,49 Q5,49 9,43 L25,9 Q28,3 31,9 Z" /></clipPath>
                    {/* Ray gradients - wider bands with soft falloff */}
                    <linearGradient id="ray-r" x1="0%" x2="100%"><stop offset="0%" stopColor="#ff4444" stopOpacity="0.9"/><stop offset="50%" stopColor="#ff4444" stopOpacity="0.35"/><stop offset="100%" stopColor="#ff4444" stopOpacity="0"/></linearGradient>
                    <linearGradient id="ray-o" x1="0%" x2="100%"><stop offset="0%" stopColor="#ff9900" stopOpacity="0.85"/><stop offset="50%" stopColor="#ff9900" stopOpacity="0.3"/><stop offset="100%" stopColor="#ff9900" stopOpacity="0"/></linearGradient>
                    <linearGradient id="ray-y" x1="0%" x2="100%"><stop offset="0%" stopColor="#ffdd00" stopOpacity="0.8"/><stop offset="50%" stopColor="#ffdd00" stopOpacity="0.25"/><stop offset="100%" stopColor="#ffdd00" stopOpacity="0"/></linearGradient>
                    <linearGradient id="ray-g" x1="0%" x2="100%"><stop offset="0%" stopColor="#22cc66" stopOpacity="0.85"/><stop offset="50%" stopColor="#22cc66" stopOpacity="0.3"/><stop offset="100%" stopColor="#22cc66" stopOpacity="0"/></linearGradient>
                    <linearGradient id="ray-b" x1="0%" x2="100%"><stop offset="0%" stopColor="#4499ff" stopOpacity="0.85"/><stop offset="50%" stopColor="#4499ff" stopOpacity="0.3"/><stop offset="100%" stopColor="#4499ff" stopOpacity="0"/></linearGradient>
                    <linearGradient id="ray-v" x1="0%" x2="100%"><stop offset="0%" stopColor="#9944ff" stopOpacity="0.9"/><stop offset="50%" stopColor="#9944ff" stopOpacity="0.35"/><stop offset="100%" stopColor="#9944ff" stopOpacity="0"/></linearGradient>
                    {/* Incoming beam */}
                    <linearGradient id="beam-in" x1="0%" x2="100%"><stop offset="0%" stopColor="white" stopOpacity="0"/><stop offset="60%" stopColor="white" stopOpacity="0.4"/><stop offset="100%" stopColor="white" stopOpacity="0.85"/></linearGradient>
                  </defs>
                  {/* Ambient light spill from refraction onto surrounding area */}
                  <ellipse cx="50" cy="32" rx="18" ry="22" fill="none" stroke="rgba(124,58,237,0.08)" strokeWidth="8" filter="url(#ray-soft)">
                    <animate attributeName="rx" values="18;22;18" dur="4s" repeatCount="indefinite" />
                  </ellipse>
                  {/* Incoming white light beam - wider, more physical */}
                  <rect x="-8" y="24" width="24" height="5" rx="2.5" fill="url(#beam-in)" filter="url(#ray-soft)">
                    <animate attributeName="opacity" values="0.8;0.45;0.8" dur="3s" repeatCount="indefinite" />
                  </rect>
                  {/* Shadow underneath for 3D grounding */}
                  <ellipse cx="28" cy="54" rx="18" ry="4" fill="rgba(0,0,0,0.25)" filter="url(#ray-soft)" />
                  {/* 3D back face (offset for depth) */}
                  <path d="M32,10 L48,44 Q52,50 46,50 L12,50 Q6,50 10,44 L26,10 Q29,4 32,10 Z" fill="rgba(60,30,120,0.3)" />
                  {/* Glass body - base refraction color (rounded corners) */}
                  <path d="M31,9 L47,43 Q51,49 45,49 L11,49 Q5,49 9,43 L25,9 Q28,3 31,9 Z" fill="url(#prism-glass-base)" filter="url(#glass-glow)" opacity="0.92" />
                  {/* Glass body - specular highlight layer */}
                  <path d="M31,9 L47,43 Q51,49 45,49 L11,49 Q5,49 9,43 L25,9 Q28,3 31,9 Z" fill="url(#prism-specular)" />
                  {/* Glass body - internal radial light */}
                  <path d="M31,9 L47,43 Q51,49 45,49 L11,49 Q5,49 9,43 L25,9 Q28,3 31,9 Z" fill="url(#prism-inner-light)" />
                  {/* Glass facet edge - left face (slightly darker for depth) */}
                  <path d="M25,9 Q28,3 28,9 L28,49 L11,49 Q5,49 9,43 Z" fill="rgba(0,0,0,0.1)" />
                  {/* Glass facet edge - right face highlight */}
                  <path d="M31,9 L47,43 Q51,49 45,49 L28,49 L28,9 Q28,3 31,9 Z" fill="rgba(255,255,255,0.06)" />
                  {/* Glass edge outline - crisp glass border (rounded) */}
                  <path d="M31,9 L47,43 Q51,49 45,49 L11,49 Q5,49 9,43 L25,9 Q28,3 31,9 Z" fill="none" stroke="url(#prism-edge-glow)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.8" />
                  {/* Internal caustic shimmer - animated light lines inside glass */}
                  <g clipPath="url(#prism-clip)" opacity="0.5">
                    <line x1="28" y1="8" x2="12" y2="46" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6">
                      <animate attributeName="x2" values="12;20;12" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite" />
                    </line>
                    <line x1="28" y1="8" x2="44" y2="46" stroke="rgba(255,255,255,0.6)" strokeWidth="0.6">
                      <animate attributeName="x2" values="44;36;44" dur="3.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0.15;0.6" dur="3.5s" repeatCount="indefinite" />
                    </line>
                    {/* Rainbow caustics inside glass body */}
                    <line x1="28" y1="14" x2="17" y2="44" stroke="rgba(124,58,237,0.5)" strokeWidth="1.2">
                      <animate attributeName="x2" values="17;23;17" dur="2.8s" repeatCount="indefinite" />
                    </line>
                    <line x1="28" y1="14" x2="39" y2="44" stroke="rgba(56,189,248,0.4)" strokeWidth="1.2">
                      <animate attributeName="x2" values="39;33;39" dur="3.2s" repeatCount="indefinite" />
                    </line>
                    <line x1="28" y1="18" x2="22" y2="44" stroke="rgba(244,114,182,0.3)" strokeWidth="0.8">
                      <animate attributeName="x2" values="22;28;22" dur="2.5s" repeatCount="indefinite" />
                    </line>
                  </g>
                  {/* Eye - larger, more expressive */}
                  <circle cx="28" cy="30" r="6" fill="rgba(0,0,0,0.3)" />
                  <circle cx="28" cy="30" r="4.2" fill="rgba(255,255,255,0.93)">
                    <animate attributeName="r" values="4.2;4.6;4.2" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="28" cy="30" r="2" fill="#050510" />
                  <circle cx="29.8" cy="28" r="1.1" fill="white" opacity="0.95" />
                  <circle cx="26.3" cy="31.2" r="0.5" fill="white" opacity="0.4" />
                  {/* Prismatic refraction rays - WIDE soft beams, not thin lines */}
                  <g filter="url(#ray-soft)">
                    <rect x="43" y="14" width="26" height="4" rx="2" fill="url(#ray-r)" transform="rotate(-12, 43, 16)">
                      <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.2s" repeatCount="indefinite" />
                      <animate attributeName="width" values="26;22;26" dur="2.2s" repeatCount="indefinite" />
                    </rect>
                    <rect x="44" y="21" width="24" height="3.5" rx="1.75" fill="url(#ray-o)" transform="rotate(-6, 44, 22.75)">
                      <animate attributeName="opacity" values="0.85;0.45;0.85" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="width" values="24;20;24" dur="2.5s" repeatCount="indefinite" />
                    </rect>
                    <rect x="45" y="27.5" width="24" height="3.5" rx="1.75" fill="url(#ray-y)" transform="rotate(-1, 45, 29.25)">
                      <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2.8s" repeatCount="indefinite" />
                      <animate attributeName="width" values="24;19;24" dur="2.8s" repeatCount="indefinite" />
                    </rect>
                    <rect x="45" y="34" width="24" height="3.5" rx="1.75" fill="url(#ray-g)" transform="rotate(5, 45, 35.75)">
                      <animate attributeName="opacity" values="0.85;0.45;0.85" dur="2.3s" repeatCount="indefinite" />
                      <animate attributeName="width" values="24;20;24" dur="2.3s" repeatCount="indefinite" />
                    </rect>
                    <rect x="44" y="40.5" width="24" height="4" rx="2" fill="url(#ray-b)" transform="rotate(10, 44, 42.5)">
                      <animate attributeName="opacity" values="0.85;0.5;0.85" dur="2.6s" repeatCount="indefinite" />
                      <animate attributeName="width" values="24;20;24" dur="2.6s" repeatCount="indefinite" />
                    </rect>
                    <rect x="43" y="47" width="26" height="3.5" rx="1.75" fill="url(#ray-v)" transform="rotate(15, 43, 48.75)">
                      <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.1s" repeatCount="indefinite" />
                      <animate attributeName="width" values="26;21;26" dur="2.1s" repeatCount="indefinite" />
                    </rect>
                  </g>
                </svg>
                {/* Sparkle trail particles */}
                {prismSparkles.map(s => (
                  <div
                    key={s.id}
                    className="prism-sparkle"
                    style={{
                      '--sparkle-x': `${s.x}px`,
                      '--sparkle-y': `${s.y}px`,
                      '--sparkle-color': s.color,
                      '--sparkle-delay': `${s.delay}s`,
                      '--sparkle-size': `${s.size}px`,
                      '--sparkle-duration': `${s.duration}s`,
                    }}
                  />
                ))}
              </div>
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
