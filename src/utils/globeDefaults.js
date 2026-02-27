// Central source of truth for all tunable globe shader parameters.
// Both the shaders (Home.jsx) and the editor (GlobeEditor.jsx) import from here.

export const GLOBE_DEFAULTS = {
  // ── Surface Day/Night ──
  dayStrengthMin: -0.77,
  dayStrengthMax: 0.41,

  // ── City Lights ──
  cityGateMin: 0.17,
  cityGateMax: 0.37,
  cityLightColor: [0.643, 0.486, 0.357],
  cityLightBoost: [0.0, 0.0, 0.0],
  cityGlowPow: 1.9,
  cityGlowMult: 2.4,

  // ── Land Material ──
  landFresnelPow: 5.2,
  landFresnelMult: 0.25,
  landSpecPow: 44.0,
  landSpecMult: 0.22,
  bumpStrength: 0.85,

  // ── Water ──
  waterThresholdMin: 0.3,
  waterThresholdMax: 0.7,
  deepSeaColor: [0.005, 0.02, 0.08],
  midSeaColor: [0.02, 0.08, 0.22],
  shallowSeaColor: [0.06, 0.18, 0.38],
  waterSpecPow: 159.0,
  waterSpecMult: 0.5,
  waterGlarePow: 12.5,
  waterGlareMult: 0.55,
  waterFresnelPow: 4.1,
  waterWaveSpeed: 1.0,
  waterWaveScale: 1.0,
  waterCurrentStrength: 1.0,

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
  sunsetColor: [0.867, 0.447, 0.294],
  sunsetStrength: 0.14,

  // ── Clouds ──
  cloudAlphaMin: 0.0,
  cloudAlphaMax: 1.0,
  cloudOpacity: 0.99,
  cloudLitColor: [1.0, 0.99, 0.96],
  cloudShadowColor: [0.15, 0.18, 0.25],
  cloudDayFactorMin: -0.15,
  cloudDayFactorMax: 0.5,
  cloudTerminatorColor: [1.0, 0.459, 0.102],
  cloudTerminatorMult: 2.0,
  cloudRimPow: 3.5,
  cloudRimStrength: 0.3,
  cloudSubsurfaceColor: [0.15, 0.12, 0.08],
  cloudSilverLiningColor: [1.0, 0.97, 0.93],

  // ── Atmosphere Rim ──
  rimRadius: 103,
  rimFresnelPow: 3.4,
  rimGlowMult: 1.5,
  rimDayColor: [0.3, 0.65, 1.0],
  rimTwilightColor: [0.85, 0.35, 0.06],
  rimNightColor: [0.05, 0.08, 0.2],
  rimNightToTwilightMin: -1.0,
  rimNightToTwilightMax: 0.0,
  rimTwilightToDayMin: 0.0,
  rimTwilightToDayMax: 0.6,
  rimSunMaskMin: -0.8,
  rimSunMaskMax: 0.6,
  rimBacklitMin: -0.3,
  rimBacklitMax: -0.05,
  rimBacklitFadeMin: -0.8,
  rimBacklitFadeMax: -0.3,
  rimBacklitWeight: 0.98,
  rimFadeout: 0.3,

  // ── Atmosphere Halo ──
  haloRadius: 108,
  haloFresnelPow: 4.1,
  haloGlowMult: 3.0,
  haloDayColor: [0.2, 0.5, 0.9],
  haloTwilightColor: [0.6, 0.25, 0.04],
  haloBlendMin: 0.2,
  haloBlendMax: 1.33,
  haloSunMaskMin: -0.2,
  haloSunMaskMax: 0.26,
  haloFadeout: 0.5,

  // ── Aurora Borealis ──
  auroraEnabled: true,
  auroraColor1: [0.1, 0.95, 0.3],
  auroraColor2: [0.2, 0.4, 0.95],
  auroraColor3: [0.6, 0.1, 0.8],
  auroraIntensity: 0.85,
  auroraSpeed: 0.45,
  auroraLatitude: 57.0,
  auroraWidth: 23.0,
  auroraNoiseScale: 4.2,
  auroraHeight: 101.5,
  auroraCurtainPow: 2.6,
  auroraEvolution: 1.7,
  auroraWaveSpeed: 0.8,

  // ── Prismatic Glow Layer (iridescent fresnel noise) ──
  prismGlowEnabled: true,
  prismGlowColor1: [0.2, 0.6, 1.0],
  prismGlowColor2: [0.5, 0.1, 0.9],
  prismGlowColor3: [0.1, 0.9, 0.4],
  prismGlowIntensity: 1.3,
  prismGlowSpeed: 0.6,
  prismGlowNoiseScale: 6.9,
  prismGlowFresnelPow: 2.0,
  prismGlowHeight: 101.2,
  prismGlowRotSpeed: 0.05,  // auto-rotation speed

  // ── Environment Glow Layer (full-wrap prismatic noise field) ──
  envGlowEnabled: true,
  envGlowColor1: [0.1, 0.4, 1.0],
  envGlowColor2: [0.7, 0.1, 0.9],
  envGlowColor3: [0.1, 0.9, 0.5],
  envGlowIntensity: 0.12,
  envGlowSpeed: 0.25,
  envGlowNoiseScale: 2.5,
  envGlowHeight: 102.0,
  envGlowCoverage: 0.6,     // how much of the globe it wraps (0=limb only, 1=full)

  // ── Shader Lighting ──
  shaderAmbient: 0.07,
  shaderSunMult: 1.15,

  // ── Scene Lights ──
  ambientIntensity: 0.0,
  sunIntensity: 5.8,

  // ── Particles: Stars ──
  starTwinkleBase: 0.63,
  starTwinkleDepth: 0.6,
  starTwinkleSpeed: 1.5,
  starSize: 1.8,

  // ── Particles: Dust ──
  dustSize: 0.4,
  dustSpeed: 1.5,
  dustAmplitude: 2.8,

  // ── Particles: Mouse ──
  mouseRippleRadius: 14.5,

  // ── Cloud Mesh ──
  cloudMeshRadius: 100.8,
  cloudRotationSpeed: 0.012,

  // ── Time Control ──
  timeOverrideHour: -1, // -1 = real time (accurate sun position)

  // ── Animation ──
  animationPaused: false,

  // ── Globe Overflow ──
  globeOverflowTop: 0,

  // ── Visibility Toggles ──
  satellitesVisible: true,
  planesVisible: true,
  carsVisible: true,
  wispsVisible: true,
  cloudsVisible: true,
  lensFlareVisible: true,
  dustVisible: true,
  starsVisible: true,

  // ── Object Speeds & Scales ──
  satelliteSpeed: 1.0,
  planeSpeed: 1.0,
  wispSpeed: 1.0,
  satelliteScale: 1.0,
  planeScale: 1.0,
  carScale: 1.0,
  wispScale: 1.0,

  // ── Overlay Graphics ──
  arcStroke: 0.5,
  arcDashLength: 0.4,
  arcDashGap: 0.2,
  arcDashAnimateTime: 2000,
  ringMaxRadius: 2.0,
  ringPropagationSpeed: 1.0,
  ringRepeatPeriod: 1000,
  labelSize: 1.2,
  labelDotRadius: 0.3,

  // ── Prism Bop Effector (controls what the prism character bop does) ──
  bopDecayRate: 0.08,       // how fast prismPulse decays
  bopParticleBurst: 1.2,    // particle size explosion
  bopColorShift: 0.4,       // prismatic color blend on particles
  bopGlowBoost: 3.0,        // prismatic glow layer intensity multiplier
  bopAuroraBoost: 2.0,      // aurora brightness spike
  bopCloudFlash: 0.15,      // cloud brightness flash
  bopWaterRipple: 0.3,      // water prismatic distortion
  bopStarBurst: 1.0,        // star size multiplier on bop
  bopEnvGlowBoost: 2.0,     // environment glow layer boost
  bopLightShow: false,       // enable strobing color cycle on bop
};
