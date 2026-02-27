// Central source of truth for all tunable globe shader parameters.
// Both the shaders (Home.jsx) and the editor (GlobeEditor.jsx) import from here.
// Every value here becomes a uniform in GLSL — keep names matching exactly.

export const GLOBE_DEFAULTS = {
  // ── Surface Day/Night ──
  dayStrengthMin: -0.25,
  dayStrengthMax: 0.5,

  // ── City Lights ──
  cityGateMin: 0.06,
  cityGateMax: 0.2,
  cityLightColor: [1.0, 0.8, 0.4],
  cityLightBoost: [2.0, 1.8, 1.3],
  cityGlowPow: 2.0,
  cityGlowMult: 2.0,

  // ── Land Material ──
  landFresnelPow: 3.5,
  landFresnelMult: 0.10,
  landSpecPow: 60.0,
  landSpecMult: 0.12,
  bumpStrength: 0.35,

  // ── Water ──
  waterThresholdMin: 0.3,
  waterThresholdMax: 0.7,
  deepSeaColor: [0.005, 0.02, 0.08],
  midSeaColor: [0.02, 0.08, 0.22],
  shallowSeaColor: [0.06, 0.18, 0.38],
  waterSpecPow: 120.0,
  waterSpecMult: 2.5,
  waterGlarePow: 12.0,
  waterGlareMult: 0.5,
  waterFresnelPow: 4.0,

  // ── Surface Atmosphere ──
  atmosDayColor: [0.3, 0.7, 1.0],
  atmosTwilightColor: [0.74, 0.29, 0.04],
  atmosBlendMin: -0.25,
  atmosBlendMax: 0.75,
  atmosMixMin: -0.5,
  atmosMixMax: 1.0,
  atmosFresnelPow: 2.0,
  atmosStrength: 0.45,

  // ── Sunset ──
  sunsetColor: [1.0, 0.35, 0.12],
  sunsetStrength: 0.15,

  // ── Clouds ──
  cloudAlphaMin: 0.2,
  cloudAlphaMax: 0.8,
  cloudOpacity: 0.9,
  cloudLitColor: [1.0, 0.99, 0.96],
  cloudShadowColor: [0.15, 0.18, 0.25],
  cloudDayFactorMin: -0.15,
  cloudDayFactorMax: 0.5,
  cloudTerminatorColor: [1.0, 0.4, 0.1],
  cloudTerminatorMult: 2.0,
  cloudRimPow: 3.5,
  cloudRimStrength: 0.3,
  cloudSubsurfaceColor: [0.15, 0.12, 0.08],
  cloudSilverLiningColor: [1.0, 0.97, 0.93],

  // ── Atmosphere Rim (r103) ──
  rimRadius: 103,
  rimFresnelPow: 4.0,
  rimGlowMult: 5.0,
  rimDayColor: [0.3, 0.65, 1.0],
  rimTwilightColor: [0.85, 0.35, 0.06],
  rimNightColor: [0.05, 0.08, 0.2],
  rimNightToTwilightMin: -0.5,
  rimNightToTwilightMax: 0.0,
  rimTwilightToDayMin: 0.0,
  rimTwilightToDayMax: 0.6,
  rimSunMaskMin: -0.8,
  rimSunMaskMax: 0.6,
  rimBacklitMin: -0.3,
  rimBacklitMax: -0.05,
  rimBacklitFadeMin: -0.8,
  rimBacklitFadeMax: -0.3,
  rimBacklitWeight: 0.5,
  rimFadeout: 0.3, // soft outer edge: 0=hard, 1=very soft

  // ── Atmosphere Halo (r108) ──
  haloRadius: 108,
  haloFresnelPow: 1.5,
  haloGlowMult: 0.35,
  haloDayColor: [0.2, 0.5, 0.9],
  haloTwilightColor: [0.6, 0.25, 0.04],
  haloBlendMin: -0.2,
  haloBlendMax: 0.7,
  haloSunMaskMin: -0.6,
  haloSunMaskMax: 0.8,
  haloFadeout: 0.5, // soft outer edge: 0=hard, 1=very soft

  // ── Aurora Borealis ──
  auroraEnabled: true,
  auroraColor1: [0.1, 0.95, 0.3],
  auroraColor2: [0.2, 0.4, 0.95],
  auroraColor3: [0.6, 0.1, 0.8],
  auroraIntensity: 1.5,
  auroraSpeed: 0.4,
  auroraLatitude: 70.0,
  auroraWidth: 18.0,
  auroraNoiseScale: 3.0,
  auroraHeight: 101.5,
  auroraCurtainPow: 2.0,

  // ── Shader Lighting (in-shader, affects ShaderMaterial) ──
  shaderAmbient: 0.08,
  shaderSunMult: 1.0,

  // ── Scene Lights (THREE.js lights for non-shader objects) ──
  ambientIntensity: 0.15,
  sunIntensity: 2.0,

  // ── Particles: Stars ──
  starTwinkleBase: 0.4,
  starTwinkleDepth: 0.6,
  starTwinkleSpeed: 1.5,
  starSize: 1.8,

  // ── Particles: Dust ──
  dustSize: 1.0,
  dustSpeed: 0.8,
  dustAmplitude: 1.5,

  // ── Particles: Mouse ──
  mouseRippleRadius: 8.0,

  // ── Cloud Mesh ──
  cloudMeshRadius: 100.8,
  cloudRotationSpeed: 0.012,

  // ── Time Control ──
  timeOverrideHour: -1, // -1 = real time, 0-24 = manual hour

  // ── Animation ──
  animationPaused: false,

  // ── Globe Overflow (bento card) ──
  globeOverflowTop: 0, // px the globe sticks out above the card

  // ── Visibility Toggles ──
  satellitesVisible: true,
  planesVisible: true,
  carsVisible: true,
  wispsVisible: true,
  cloudsVisible: true,
  lensFlareVisible: true,
  dustVisible: true,
  starsVisible: true,

  // ── Object Speeds ──
  satelliteSpeed: 1.0,
  planeSpeed: 1.0,
  wispSpeed: 1.0,
};
