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

  // ── Sunset/Terminator ──
  sunsetColor: [0.867, 0.447, 0.294],
  sunsetStrength: 0.14,
  terminatorSoftness: 0.35,
  terminatorGlow: 0.2,

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
  auroraEvolution: 1.05,
  auroraWaveSpeed: 0.8,

  // ── Prismatic Glow Layer ──
  prismGlowEnabled: true,
  prismGlowColor1: [0.2, 0.6, 1.0],
  prismGlowColor2: [0.5, 0.1, 0.9],
  prismGlowColor3: [0.1, 0.9, 0.4],
  prismGlowIntensity: 1.3,
  prismGlowSpeed: 0.6,
  prismGlowNoiseScale: 6.9,
  prismGlowFresnelPow: 2.0,
  prismGlowHeight: 101.2,
  prismGlowRotSpeed: 0.05,
  prismGlowTiltX: 0.0,
  prismGlowTiltZ: 0.0,

  // ── Environment Glow Layer ──
  envGlowEnabled: true,
  envGlowColor1: [0.1, 0.4, 1.0],
  envGlowColor2: [0.7, 0.1, 0.9],
  envGlowColor3: [0.1, 0.9, 0.5],
  envGlowIntensity: 0.62,
  envGlowSpeed: 0.25,
  envGlowNoiseScale: 4.9,
  envGlowHeight: 102.0,
  envGlowCoverage: 0.65,
  envGlowTiltX: 0.0,
  envGlowTiltZ: 0.0,

  // ── Lava Lamp Layer ──
  lavaLampEnabled: false,
  lavaLampColor1: [0.1, 0.8, 0.5],
  lavaLampColor2: [0.7, 0.1, 0.85],
  lavaLampColor3: [0.05, 0.3, 0.95],
  lavaLampIntensity: 0.08,
  lavaLampSpeed: 0.12,
  lavaLampScale: 1.5,
  lavaLampHeight: 102.5,
  lavaLampBlobSize: 3.0,
  lavaLampFeather: 0.6,

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
  timeOverrideHour: -1,

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
  satelliteScale: 0.4,
  planeScale: 3.5,
  carScale: 4.0,
  wispScale: 3.0,

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

  // ── Prism Bop Effector (tuned for subtle multi-effect pulse) ──
  bopDecayRate: 0.12,
  bopParticleBurst: 0.8,
  bopColorShift: 0.25,
  bopGlowBoost: 1.2,
  bopAuroraBoost: 1.5,
  bopCloudFlash: 0.08,
  bopWaterRipple: 0.15,
  bopStarBurst: 0.5,
  bopEnvGlowBoost: 1.0,
  bopLightShow: false,

  // ── Advanced Lens Flare ──
  flareEdgeDiffraction: 0.5,
  flareStarburstStrength: 0.6,
  flareAnamorphicStrength: 0.45,

  // ── Post-Processing ──
  ppEnabled: true,
  ppChromaticAberration: 0.0015,
  ppVignetteStrength: 0.3,
  ppVignetteRadius: 0.85,
  ppBrightness: 0.0,
  ppContrast: 1.0,
  ppSaturation: 1.05,
  ppGamma: 1.0,
  ppTint: [1.0, 1.0, 1.0],
  ppFilmGrain: 0.02,
  ppScanLines: 0.0,
  ppScanLineSpeed: 1.0,

  // ── TV/Camera Effects ──
  tvEnabled: false,
  tvGlitch: 0.0,
  tvGlitchSpeed: 1.0,
  tvScanLineJitter: 0.0,
  tvColorBleed: 0.0,
  tvStaticNoise: 0.0,
  tvBarrelDistortion: 0.0,
  tvRGBShift: 0.0,
};
