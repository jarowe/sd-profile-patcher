import { useEffect, useRef } from 'react';
import GUI from 'lil-gui';
import * as THREE from 'three';
import { GLOBE_DEFAULTS } from '../utils/globeDefaults';

const STORAGE_KEY = 'jarowe_globe_editor_preset';

function rgbToHex(arr) {
  const r = Math.round(Math.min(1, Math.max(0, arr[0])) * 255);
  const g = Math.round(Math.min(1, Math.max(0, arr[1])) * 255);
  const b = Math.round(Math.min(1, Math.max(0, arr[2])) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export default function GlobeEditor({ editorParams, globeRef, globeShaderMaterial, setOverlayParams }) {
  const guiRef = useRef(null);

  useEffect(() => {
    if (guiRef.current) return;

    const p = editorParams.current;

    // Build proxy: scalars direct, colors as hex, booleans as-is
    const proxy = {};
    for (const [key, val] of Object.entries(p)) {
      if (Array.isArray(val)) {
        proxy[key] = rgbToHex(val);
      } else {
        proxy[key] = val;
      }
    }

    const gui = new GUI({ title: 'Globe Editor', width: 320 });
    gui.domElement.style.position = 'fixed';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
    gui.domElement.style.zIndex = '10000';
    gui.domElement.style.maxHeight = '92vh';
    gui.domElement.style.overflowY = 'auto';
    guiRef.current = gui;

    // ── Helpers ──
    const updateSurfaceUniform = (key) => (v) => {
      p[key] = v;
      if (globeShaderMaterial?.uniforms?.[key]) globeShaderMaterial.uniforms[key].value = v;
    };
    const updateSurfaceColor = (key) => (hex) => {
      const rgb = hexToRgb(hex);
      p[key] = rgb;
      if (globeShaderMaterial?.uniforms?.[key]) globeShaderMaterial.uniforms[key].value.set(...rgb);
    };
    const updateShaderUniform = (getMat, key) => (v) => {
      p[key] = v;
      const mat = getMat();
      if (mat?.uniforms?.[key]) mat.uniforms[key].value = v;
    };
    const updateShaderColor = (getMat, key) => (hex) => {
      const rgb = hexToRgb(hex);
      p[key] = rgb;
      const mat = getMat();
      if (mat?.uniforms?.[key]) mat.uniforms[key].value.set(...rgb);
    };
    const updateParam = (key) => (v) => { p[key] = v; };
    const updatePPColor = (key) => (hex) => {
      const rgb = hexToRgb(hex);
      p[key] = rgb;
      const pp = globeRef.current?.ppPass;
      if (pp?.uniforms?.tint) pp.uniforms.tint.value.set(...rgb);
    };

    // Material accessors
    const getCloudMat = () => globeRef.current?.cloudMesh?.material;
    const getRimMat = () => globeRef.current?.atmosShell?.rim?.material;
    const getHaloMat = () => globeRef.current?.atmosShell?.halo?.material;
    const getParticleMat = () => globeRef.current?.particleSystem?.material;
    const getAuroraMat = () => globeRef.current?.auroraMesh?.material;
    const getPrismGlowMat = () => globeRef.current?.prismGlowMesh?.material;
    const getEnvGlowMat = () => globeRef.current?.envGlowMesh?.material;
    const getLavaLampMat = () => globeRef.current?.lavaLampMesh?.material;

    // ══════════════════════════════════════════
    // CONTROLS / TIME
    // ══════════════════════════════════════════
    const controlsFolder = gui.addFolder('Controls');
    controlsFolder.add(proxy, 'animationPaused').name('Pause Animation').onChange(updateParam('animationPaused'));
    controlsFolder.add(proxy, 'timeOverrideHour', -1, 24, 0.25).name('Time of Day (UTC)').onChange(updateParam('timeOverrideHour'))
      .listen();

    // Timezone quick-presets: sets UTC hour so noon falls over that region
    // Formula: UTC hour = 12 + longitude/15 (solar noon at longitude)
    const tzPresets = {
      'Real-time': -1,
      'Noon in New York (EST)': 17,      // -75° → 12+5=17
      'Noon in Chicago (CST)': 18,       // -90° → 12+6=18
      'Noon in Denver (MST)': 19,        // -105° → 12+7=19
      'Noon in LA (PST)': 20,            // -120° → 12+8=20
      'Noon in London (GMT)': 12,        // 0° → 12
      'Noon in Paris (CET)': 11,         // 15° → 12-1=11
      'Noon in Dubai (GST)': 8,          // 60° → 12-4=8
      'Noon in Mumbai (IST)': 6.5,       // 82.5° → 12-5.5=6.5
      'Noon in Tokyo (JST)': 3,          // 135° → 12-9=3
      'Noon in Sydney (AEST)': 2,        // 150° → 12-10=2
      'Noon in Auckland (NZST)': 0,      // 180° → 12-12=0
    };
    const tzProxy = { timezone: 'Real-time' };
    controlsFolder.add(tzProxy, 'timezone', Object.keys(tzPresets)).name('Timezone Presets').onChange((tz) => {
      const utcHour = tzPresets[tz];
      proxy.timeOverrideHour = utcHour;
      p.timeOverrideHour = utcHour;
    });

    controlsFolder.add(proxy, 'globeOverflowTop', 0, 200, 1).name('Globe Overflow Top (px)').onChange((v) => {
      p.globeOverflowTop = v;
      const cell = document.querySelector('.cell-map');
      if (cell) {
        if (v > 0) {
          cell.classList.add('globe-overflow');
          cell.style.setProperty('--globe-overflow-top', `${v}px`);
        } else {
          cell.classList.remove('globe-overflow');
        }
      }
    });

    // ── Visibility Toggles ──
    const visFolder = controlsFolder.addFolder('Visibility');
    visFolder.add(proxy, 'cloudsVisible').name('Clouds').onChange(updateParam('cloudsVisible'));
    visFolder.add(proxy, 'auroraEnabled').name('Aurora').onChange(updateParam('auroraEnabled'));
    visFolder.add(proxy, 'prismGlowEnabled').name('Prismatic Glow').onChange(updateParam('prismGlowEnabled'));
    visFolder.add(proxy, 'envGlowEnabled').name('Env Glow').onChange(updateParam('envGlowEnabled'));
    visFolder.add(proxy, 'lavaLampEnabled').name('Lava Lamp').onChange(updateParam('lavaLampEnabled'));
    visFolder.add(proxy, 'lensFlareVisible').name('Lens Flare').onChange(updateParam('lensFlareVisible'));
    visFolder.add(proxy, 'starsVisible').name('Stars').onChange(updateParam('starsVisible'));
    visFolder.add(proxy, 'dustVisible').name('Dust').onChange(updateParam('dustVisible'));
    visFolder.add(proxy, 'satellitesVisible').name('Satellites').onChange(updateParam('satellitesVisible'));
    visFolder.add(proxy, 'planesVisible').name('Planes').onChange(updateParam('planesVisible'));
    visFolder.add(proxy, 'carsVisible').name('Cars').onChange(updateParam('carsVisible'));
    visFolder.add(proxy, 'wispsVisible').name('Wisps').onChange(updateParam('wispsVisible'));

    // ══════════════════════════════════════════
    // SHADER LIGHTING
    // ══════════════════════════════════════════
    const lightFolder = gui.addFolder('Lighting');
    lightFolder.add(proxy, 'shaderAmbient', 0.0, 0.5, 0.005).name('Shader Ambient').onChange(updateSurfaceUniform('shaderAmbient'));
    lightFolder.add(proxy, 'shaderSunMult', 0.0, 5.0, 0.05).name('Shader Sun Mult').onChange(updateSurfaceUniform('shaderSunMult'));
    lightFolder.add(proxy, 'ambientIntensity', 0.0, 2.0, 0.01).name('Scene Ambient').onChange((v) => {
      p.ambientIntensity = v;
      if (globeRef.current?._ambientLight) globeRef.current._ambientLight.intensity = v;
    });
    lightFolder.add(proxy, 'sunIntensity', 0.0, 10.0, 0.1).name('Scene Sun').onChange((v) => {
      p.sunIntensity = v;
      if (globeRef.current?._sunLight) globeRef.current._sunLight.intensity = v;
    });
    lightFolder.close();

    // ══════════════════════════════════════════
    // SURFACE
    // ══════════════════════════════════════════
    const surfaceFolder = gui.addFolder('Surface');

    const dayNightFolder = surfaceFolder.addFolder('Day/Night Blend');
    dayNightFolder.add(proxy, 'dayStrengthMin', -1.0, 0.5, 0.01).name('Day Min').onChange(updateSurfaceUniform('dayStrengthMin'));
    dayNightFolder.add(proxy, 'dayStrengthMax', 0.0, 2.0, 0.01).name('Day Max').onChange(updateSurfaceUniform('dayStrengthMax'));

    const cityFolder = surfaceFolder.addFolder('City Lights');
    cityFolder.add(proxy, 'cityGateMin', 0.0, 0.5, 0.005).name('Gate Min').onChange(updateSurfaceUniform('cityGateMin'));
    cityFolder.add(proxy, 'cityGateMax', 0.0, 1.0, 0.01).name('Gate Max').onChange(updateSurfaceUniform('cityGateMax'));
    cityFolder.addColor(proxy, 'cityLightColor').name('Light Color').onChange(updateSurfaceColor('cityLightColor'));
    cityFolder.addColor(proxy, 'cityLightBoost').name('Boost Color').onChange(updateSurfaceColor('cityLightBoost'));
    cityFolder.add(proxy, 'cityGlowPow', 0.5, 8.0, 0.1).name('Glow Power').onChange(updateSurfaceUniform('cityGlowPow'));
    cityFolder.add(proxy, 'cityGlowMult', 0.0, 10.0, 0.1).name('Glow Mult').onChange(updateSurfaceUniform('cityGlowMult'));

    const landFolder = surfaceFolder.addFolder('Land Material');
    landFolder.add(proxy, 'landFresnelPow', 0.5, 10.0, 0.1).name('Fresnel Pow').onChange(updateSurfaceUniform('landFresnelPow'));
    landFolder.add(proxy, 'landFresnelMult', 0.0, 1.0, 0.01).name('Fresnel Mult').onChange(updateSurfaceUniform('landFresnelMult'));
    landFolder.add(proxy, 'landSpecPow', 1.0, 200.0, 1.0).name('Spec Power').onChange(updateSurfaceUniform('landSpecPow'));
    landFolder.add(proxy, 'landSpecMult', 0.0, 1.0, 0.01).name('Spec Mult').onChange(updateSurfaceUniform('landSpecMult'));
    landFolder.add(proxy, 'bumpStrength', 0.0, 2.0, 0.01).name('Bump').onChange(updateSurfaceUniform('bumpStrength'));

    const surfAtmosFolder = surfaceFolder.addFolder('Surface Atmosphere');
    surfAtmosFolder.addColor(proxy, 'atmosDayColor').name('Day Color').onChange(updateSurfaceColor('atmosDayColor'));
    surfAtmosFolder.addColor(proxy, 'atmosTwilightColor').name('Twilight Color').onChange(updateSurfaceColor('atmosTwilightColor'));
    surfAtmosFolder.add(proxy, 'atmosBlendMin', -1.0, 1.0, 0.01).name('Blend Min').onChange(updateSurfaceUniform('atmosBlendMin'));
    surfAtmosFolder.add(proxy, 'atmosBlendMax', -0.5, 2.0, 0.01).name('Blend Max').onChange(updateSurfaceUniform('atmosBlendMax'));
    surfAtmosFolder.add(proxy, 'atmosMixMin', -2.0, 1.0, 0.01).name('Mix Min').onChange(updateSurfaceUniform('atmosMixMin'));
    surfAtmosFolder.add(proxy, 'atmosMixMax', 0.0, 3.0, 0.01).name('Mix Max').onChange(updateSurfaceUniform('atmosMixMax'));
    surfAtmosFolder.add(proxy, 'atmosFresnelPow', 0.5, 8.0, 0.1).name('Fresnel Pow').onChange(updateSurfaceUniform('atmosFresnelPow'));
    surfAtmosFolder.add(proxy, 'atmosStrength', 0.0, 1.0, 0.01).name('Strength').onChange(updateSurfaceUniform('atmosStrength'));

    const sunsetFolder = surfaceFolder.addFolder('Sunset / Terminator');
    sunsetFolder.addColor(proxy, 'sunsetColor').name('Color').onChange(updateSurfaceColor('sunsetColor'));
    sunsetFolder.add(proxy, 'sunsetStrength', 0.0, 1.0, 0.01).name('Strength').onChange(updateSurfaceUniform('sunsetStrength'));
    sunsetFolder.add(proxy, 'terminatorSoftness', 0.0, 1.0, 0.01).name('Softness').onChange(updateSurfaceUniform('terminatorSoftness'));
    sunsetFolder.add(proxy, 'terminatorGlow', 0.0, 1.0, 0.01).name('Glow Band').onChange(updateSurfaceUniform('terminatorGlow'));
    surfaceFolder.close();

    // ══════════════════════════════════════════
    // WATER
    // ══════════════════════════════════════════
    const waterFolder = gui.addFolder('Water');
    waterFolder.add(proxy, 'waterThresholdMin', 0.0, 1.0, 0.01).name('Detect Min').onChange(updateSurfaceUniform('waterThresholdMin'));
    waterFolder.add(proxy, 'waterThresholdMax', 0.0, 1.0, 0.01).name('Detect Max').onChange(updateSurfaceUniform('waterThresholdMax'));
    waterFolder.addColor(proxy, 'deepSeaColor').name('Deep Sea').onChange(updateSurfaceColor('deepSeaColor'));
    waterFolder.addColor(proxy, 'midSeaColor').name('Mid Sea').onChange(updateSurfaceColor('midSeaColor'));
    waterFolder.addColor(proxy, 'shallowSeaColor').name('Shallow Sea').onChange(updateSurfaceColor('shallowSeaColor'));
    waterFolder.add(proxy, 'waterSpecPow', 1.0, 300.0, 1.0).name('Spec Power').onChange(updateSurfaceUniform('waterSpecPow'));
    waterFolder.add(proxy, 'waterSpecMult', 0.0, 10.0, 0.1).name('Spec Mult').onChange(updateSurfaceUniform('waterSpecMult'));
    waterFolder.add(proxy, 'waterGlarePow', 1.0, 50.0, 0.5).name('Glare Power').onChange(updateSurfaceUniform('waterGlarePow'));
    waterFolder.add(proxy, 'waterGlareMult', 0.0, 5.0, 0.05).name('Glare Mult').onChange(updateSurfaceUniform('waterGlareMult'));
    waterFolder.add(proxy, 'waterFresnelPow', 0.5, 10.0, 0.1).name('Fresnel Pow').onChange(updateSurfaceUniform('waterFresnelPow'));
    waterFolder.add(proxy, 'waterWaveSpeed', 0.0, 5.0, 0.05).name('Wave Speed').onChange(updateSurfaceUniform('waterWaveSpeed'));
    waterFolder.add(proxy, 'waterWaveScale', 0.1, 3.0, 0.05).name('Wave Scale').onChange(updateSurfaceUniform('waterWaveScale'));
    waterFolder.add(proxy, 'waterCurrentStrength', 0.0, 3.0, 0.05).name('Current Strength').onChange(updateSurfaceUniform('waterCurrentStrength'));
    waterFolder.close();

    // ══════════════════════════════════════════
    // CLOUDS
    // ══════════════════════════════════════════
    const cloudFolder = gui.addFolder('Clouds');
    cloudFolder.add(proxy, 'cloudAlphaMin', 0.0, 1.0, 0.01).name('Alpha Min').onChange(updateShaderUniform(getCloudMat, 'cloudAlphaMin'));
    cloudFolder.add(proxy, 'cloudAlphaMax', 0.0, 1.0, 0.01).name('Alpha Max').onChange(updateShaderUniform(getCloudMat, 'cloudAlphaMax'));
    cloudFolder.add(proxy, 'cloudOpacity', 0.0, 1.0, 0.01).name('Opacity').onChange(updateShaderUniform(getCloudMat, 'cloudOpacity'));
    cloudFolder.addColor(proxy, 'cloudLitColor').name('Lit Color').onChange(updateShaderColor(getCloudMat, 'cloudLitColor'));
    cloudFolder.addColor(proxy, 'cloudShadowColor').name('Shadow Color').onChange(updateShaderColor(getCloudMat, 'cloudShadowColor'));
    cloudFolder.add(proxy, 'cloudDayFactorMin', -1.0, 1.0, 0.01).name('Day Min').onChange(updateShaderUniform(getCloudMat, 'cloudDayFactorMin'));
    cloudFolder.add(proxy, 'cloudDayFactorMax', 0.0, 2.0, 0.01).name('Day Max').onChange(updateShaderUniform(getCloudMat, 'cloudDayFactorMax'));
    cloudFolder.addColor(proxy, 'cloudTerminatorColor').name('Terminator').onChange(updateShaderColor(getCloudMat, 'cloudTerminatorColor'));
    cloudFolder.add(proxy, 'cloudTerminatorMult', 0.0, 10.0, 0.1).name('Term. Mult').onChange(updateShaderUniform(getCloudMat, 'cloudTerminatorMult'));
    cloudFolder.add(proxy, 'cloudRimPow', 0.5, 10.0, 0.1).name('Rim Power').onChange(updateShaderUniform(getCloudMat, 'cloudRimPow'));
    cloudFolder.add(proxy, 'cloudRimStrength', 0.0, 2.0, 0.01).name('Rim Strength').onChange(updateShaderUniform(getCloudMat, 'cloudRimStrength'));
    cloudFolder.addColor(proxy, 'cloudSubsurfaceColor').name('Subsurface').onChange(updateShaderColor(getCloudMat, 'cloudSubsurfaceColor'));
    cloudFolder.addColor(proxy, 'cloudSilverLiningColor').name('Silver Lining').onChange(updateShaderColor(getCloudMat, 'cloudSilverLiningColor'));
    cloudFolder.add(proxy, 'cloudRotationSpeed', 0.0, 0.1, 0.001).name('Rotation Speed');
    cloudFolder.close();

    // ══════════════════════════════════════════
    // AURORA BOREALIS
    // ══════════════════════════════════════════
    const auroraFolder = gui.addFolder('Aurora Borealis');
    auroraFolder.addColor(proxy, 'auroraColor1').name('Primary (Green)').onChange(updateShaderColor(getAuroraMat, 'auroraColor1'));
    auroraFolder.addColor(proxy, 'auroraColor2').name('Secondary (Blue)').onChange(updateShaderColor(getAuroraMat, 'auroraColor2'));
    auroraFolder.addColor(proxy, 'auroraColor3').name('Tertiary (Purple)').onChange(updateShaderColor(getAuroraMat, 'auroraColor3'));
    auroraFolder.add(proxy, 'auroraIntensity', 0.0, 5.0, 0.05).name('Intensity').onChange(updateShaderUniform(getAuroraMat, 'auroraIntensity'));
    auroraFolder.add(proxy, 'auroraSpeed', 0.0, 3.0, 0.05).name('Speed').onChange(updateShaderUniform(getAuroraMat, 'auroraSpeed'));
    auroraFolder.add(proxy, 'auroraLatitude', 40, 85, 1).name('Latitude (deg)').onChange(updateShaderUniform(getAuroraMat, 'auroraLatitude'));
    auroraFolder.add(proxy, 'auroraWidth', 5, 40, 1).name('Width (deg)').onChange(updateShaderUniform(getAuroraMat, 'auroraWidth'));
    auroraFolder.add(proxy, 'auroraNoiseScale', 0.5, 10.0, 0.1).name('Noise Scale').onChange(updateShaderUniform(getAuroraMat, 'auroraNoiseScale'));
    auroraFolder.add(proxy, 'auroraCurtainPow', 0.5, 5.0, 0.1).name('Curtain Power').onChange(updateShaderUniform(getAuroraMat, 'auroraCurtainPow'));
    auroraFolder.add(proxy, 'auroraEvolution', 0.0, 2.0, 0.05).name('Evolution Speed').onChange(updateShaderUniform(getAuroraMat, 'auroraEvolution'));
    auroraFolder.add(proxy, 'auroraWaveSpeed', 0.0, 3.0, 0.05).name('Wave Speed').onChange(updateShaderUniform(getAuroraMat, 'auroraWaveSpeed'));
    auroraFolder.close();

    // ══════════════════════════════════════════
    // PRISMATIC GLOW LAYER
    // ══════════════════════════════════════════
    const prismFolder = gui.addFolder('Prismatic Glow');
    prismFolder.addColor(proxy, 'prismGlowColor1').name('Color 1 (Blue)').onChange(updateShaderColor(getPrismGlowMat, 'prismGlowColor1'));
    prismFolder.addColor(proxy, 'prismGlowColor2').name('Color 2 (Purple)').onChange(updateShaderColor(getPrismGlowMat, 'prismGlowColor2'));
    prismFolder.addColor(proxy, 'prismGlowColor3').name('Color 3 (Green)').onChange(updateShaderColor(getPrismGlowMat, 'prismGlowColor3'));
    prismFolder.add(proxy, 'prismGlowIntensity', 0.0, 3.0, 0.01).name('Intensity').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowIntensity'));
    prismFolder.add(proxy, 'prismGlowSpeed', 0.0, 3.0, 0.05).name('Speed').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowSpeed'));
    prismFolder.add(proxy, 'prismGlowNoiseScale', 0.5, 10.0, 0.1).name('Noise Scale').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowNoiseScale'));
    prismFolder.add(proxy, 'prismGlowFresnelPow', 0.5, 8.0, 0.1).name('Fresnel Power').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowFresnelPow'));
    prismFolder.add(proxy, 'prismGlowRotSpeed', -0.5, 0.5, 0.005).name('Rotation Speed').onChange(updateParam('prismGlowRotSpeed'));
    prismFolder.add(proxy, 'prismGlowTiltX', -3.14, 3.14, 0.01).name('Tilt X').onChange(updateParam('prismGlowTiltX'));
    prismFolder.add(proxy, 'prismGlowTiltZ', -3.14, 3.14, 0.01).name('Tilt Z').onChange(updateParam('prismGlowTiltZ'));
    prismFolder.close();

    // ══════════════════════════════════════════
    // ENVIRONMENT GLOW LAYER
    // ══════════════════════════════════════════
    const envFolder = gui.addFolder('Environment Glow');
    envFolder.addColor(proxy, 'envGlowColor1').name('Color 1').onChange(updateShaderColor(getEnvGlowMat, 'envGlowColor1'));
    envFolder.addColor(proxy, 'envGlowColor2').name('Color 2').onChange(updateShaderColor(getEnvGlowMat, 'envGlowColor2'));
    envFolder.addColor(proxy, 'envGlowColor3').name('Color 3').onChange(updateShaderColor(getEnvGlowMat, 'envGlowColor3'));
    envFolder.add(proxy, 'envGlowIntensity', 0.0, 1.0, 0.005).name('Intensity').onChange(updateShaderUniform(getEnvGlowMat, 'envGlowIntensity'));
    envFolder.add(proxy, 'envGlowSpeed', 0.0, 2.0, 0.01).name('Speed').onChange(updateShaderUniform(getEnvGlowMat, 'envGlowSpeed'));
    envFolder.add(proxy, 'envGlowNoiseScale', 0.5, 10.0, 0.1).name('Noise Scale').onChange(updateShaderUniform(getEnvGlowMat, 'envGlowNoiseScale'));
    envFolder.add(proxy, 'envGlowCoverage', 0.0, 1.0, 0.01).name('Coverage').onChange(updateShaderUniform(getEnvGlowMat, 'envGlowCoverage'));
    envFolder.add(proxy, 'envGlowTiltX', -3.14, 3.14, 0.01).name('Tilt X').onChange(updateParam('envGlowTiltX'));
    envFolder.add(proxy, 'envGlowTiltZ', -3.14, 3.14, 0.01).name('Tilt Z').onChange(updateParam('envGlowTiltZ'));
    envFolder.close();

    // ══════════════════════════════════════════
    // LAVA LAMP LAYER
    // ══════════════════════════════════════════
    const lavaFolder = gui.addFolder('Lava Lamp');
    lavaFolder.addColor(proxy, 'lavaLampColor1').name('Color 1').onChange(updateShaderColor(getLavaLampMat, 'lavaLampColor1'));
    lavaFolder.addColor(proxy, 'lavaLampColor2').name('Color 2').onChange(updateShaderColor(getLavaLampMat, 'lavaLampColor2'));
    lavaFolder.addColor(proxy, 'lavaLampColor3').name('Color 3').onChange(updateShaderColor(getLavaLampMat, 'lavaLampColor3'));
    lavaFolder.add(proxy, 'lavaLampIntensity', 0.0, 0.5, 0.005).name('Intensity').onChange(updateShaderUniform(getLavaLampMat, 'lavaLampIntensity'));
    lavaFolder.add(proxy, 'lavaLampSpeed', 0.0, 1.0, 0.01).name('Speed').onChange(updateShaderUniform(getLavaLampMat, 'lavaLampSpeed'));
    lavaFolder.add(proxy, 'lavaLampScale', 0.5, 5.0, 0.1).name('Scale').onChange(updateShaderUniform(getLavaLampMat, 'lavaLampScale'));
    lavaFolder.add(proxy, 'lavaLampBlobSize', 0.5, 10.0, 0.1).name('Blob Size').onChange(updateShaderUniform(getLavaLampMat, 'lavaLampBlobSize'));
    lavaFolder.add(proxy, 'lavaLampFeather', 0.0, 1.0, 0.01).name('Feather (Softness)').onChange(updateShaderUniform(getLavaLampMat, 'lavaLampFeather'));
    lavaFolder.close();

    // ══════════════════════════════════════════
    // ATMOSPHERE RIM
    // ══════════════════════════════════════════
    const rimFolder = gui.addFolder('Atmosphere Rim');
    rimFolder.add(proxy, 'rimFresnelPow', 0.5, 10.0, 0.1).name('Fresnel Pow').onChange(updateShaderUniform(getRimMat, 'rimFresnelPow'));
    rimFolder.add(proxy, 'rimGlowMult', 0.0, 20.0, 0.1).name('Glow Mult').onChange(updateShaderUniform(getRimMat, 'rimGlowMult'));
    rimFolder.add(proxy, 'rimFadeout', 0.0, 1.0, 0.01).name('Soft Edge').onChange(updateShaderUniform(getRimMat, 'rimFadeout'));
    rimFolder.addColor(proxy, 'rimDayColor').name('Day Color').onChange(updateShaderColor(getRimMat, 'rimDayColor'));
    rimFolder.addColor(proxy, 'rimTwilightColor').name('Twilight').onChange(updateShaderColor(getRimMat, 'rimTwilightColor'));
    rimFolder.addColor(proxy, 'rimNightColor').name('Night Color').onChange(updateShaderColor(getRimMat, 'rimNightColor'));
    rimFolder.add(proxy, 'rimNightToTwilightMin', -2.0, 1.0, 0.01).name('N>T Min').onChange(updateShaderUniform(getRimMat, 'rimNightToTwilightMin'));
    rimFolder.add(proxy, 'rimNightToTwilightMax', -1.0, 2.0, 0.01).name('N>T Max').onChange(updateShaderUniform(getRimMat, 'rimNightToTwilightMax'));
    rimFolder.add(proxy, 'rimTwilightToDayMin', -1.0, 1.0, 0.01).name('T>D Min').onChange(updateShaderUniform(getRimMat, 'rimTwilightToDayMin'));
    rimFolder.add(proxy, 'rimTwilightToDayMax', 0.0, 2.0, 0.01).name('T>D Max').onChange(updateShaderUniform(getRimMat, 'rimTwilightToDayMax'));
    rimFolder.add(proxy, 'rimSunMaskMin', -2.0, 1.0, 0.01).name('Sun Mask Min').onChange(updateShaderUniform(getRimMat, 'rimSunMaskMin'));
    rimFolder.add(proxy, 'rimSunMaskMax', -1.0, 2.0, 0.01).name('Sun Mask Max').onChange(updateShaderUniform(getRimMat, 'rimSunMaskMax'));
    rimFolder.add(proxy, 'rimBacklitMin', -1.0, 0.5, 0.01).name('Backlit Min').onChange(updateShaderUniform(getRimMat, 'rimBacklitMin'));
    rimFolder.add(proxy, 'rimBacklitMax', -1.0, 0.5, 0.01).name('Backlit Max').onChange(updateShaderUniform(getRimMat, 'rimBacklitMax'));
    rimFolder.add(proxy, 'rimBacklitFadeMin', -2.0, 0.5, 0.01).name('Backlit Fade Min').onChange(updateShaderUniform(getRimMat, 'rimBacklitFadeMin'));
    rimFolder.add(proxy, 'rimBacklitFadeMax', -1.0, 0.5, 0.01).name('Backlit Fade Max').onChange(updateShaderUniform(getRimMat, 'rimBacklitFadeMax'));
    rimFolder.add(proxy, 'rimBacklitWeight', 0.0, 3.0, 0.01).name('Backlit Weight').onChange(updateShaderUniform(getRimMat, 'rimBacklitWeight'));
    rimFolder.close();

    // ══════════════════════════════════════════
    // ATMOSPHERE HALO
    // ══════════════════════════════════════════
    const haloFolder = gui.addFolder('Atmosphere Halo');
    haloFolder.add(proxy, 'haloFresnelPow', 0.1, 8.0, 0.1).name('Fresnel Pow').onChange(updateShaderUniform(getHaloMat, 'haloFresnelPow'));
    haloFolder.add(proxy, 'haloGlowMult', 0.0, 3.0, 0.01).name('Glow Mult').onChange(updateShaderUniform(getHaloMat, 'haloGlowMult'));
    haloFolder.add(proxy, 'haloFadeout', 0.0, 1.0, 0.01).name('Soft Edge').onChange(updateShaderUniform(getHaloMat, 'haloFadeout'));
    haloFolder.addColor(proxy, 'haloDayColor').name('Day Color').onChange(updateShaderColor(getHaloMat, 'haloDayColor'));
    haloFolder.addColor(proxy, 'haloTwilightColor').name('Twilight').onChange(updateShaderColor(getHaloMat, 'haloTwilightColor'));
    haloFolder.add(proxy, 'haloBlendMin', -1.0, 1.0, 0.01).name('Blend Min').onChange(updateShaderUniform(getHaloMat, 'haloBlendMin'));
    haloFolder.add(proxy, 'haloBlendMax', 0.0, 2.0, 0.01).name('Blend Max').onChange(updateShaderUniform(getHaloMat, 'haloBlendMax'));
    haloFolder.add(proxy, 'haloSunMaskMin', -2.0, 1.0, 0.01).name('Sun Mask Min').onChange(updateShaderUniform(getHaloMat, 'haloSunMaskMin'));
    haloFolder.add(proxy, 'haloSunMaskMax', -1.0, 2.0, 0.01).name('Sun Mask Max').onChange(updateShaderUniform(getHaloMat, 'haloSunMaskMax'));
    haloFolder.close();

    // ══════════════════════════════════════════
    // LENS FLARE
    // ══════════════════════════════════════════
    const flareFolder = gui.addFolder('Lens Flare');
    flareFolder.add(proxy, 'flareEdgeDiffraction', 0.0, 2.0, 0.01).name('Edge Diffraction').onChange(updateParam('flareEdgeDiffraction'));
    flareFolder.add(proxy, 'flareStarburstStrength', 0.0, 2.0, 0.01).name('Starburst').onChange(updateParam('flareStarburstStrength'));
    flareFolder.add(proxy, 'flareAnamorphicStrength', 0.0, 2.0, 0.01).name('Anamorphic').onChange(updateParam('flareAnamorphicStrength'));
    flareFolder.close();

    // ══════════════════════════════════════════
    // PARTICLES
    // ══════════════════════════════════════════
    const particleFolder = gui.addFolder('Particles');
    const starFolder = particleFolder.addFolder('Stars');
    starFolder.add(proxy, 'starTwinkleBase', 0.0, 1.0, 0.01).name('Twinkle Base').onChange(updateShaderUniform(getParticleMat, 'starTwinkleBase'));
    starFolder.add(proxy, 'starTwinkleDepth', 0.0, 1.0, 0.01).name('Twinkle Depth').onChange(updateShaderUniform(getParticleMat, 'starTwinkleDepth'));
    starFolder.add(proxy, 'starTwinkleSpeed', 0.0, 10.0, 0.1).name('Twinkle Speed').onChange(updateShaderUniform(getParticleMat, 'starTwinkleSpeed'));
    starFolder.add(proxy, 'starSize', 0.1, 10.0, 0.1).name('Size').onChange(updateShaderUniform(getParticleMat, 'starSize'));
    const dustFolder2 = particleFolder.addFolder('Dust');
    dustFolder2.add(proxy, 'dustSize', 0.1, 5.0, 0.1).name('Size').onChange(updateShaderUniform(getParticleMat, 'dustSize'));
    dustFolder2.add(proxy, 'dustSpeed', 0.0, 5.0, 0.1).name('Speed').onChange(updateShaderUniform(getParticleMat, 'dustSpeed'));
    dustFolder2.add(proxy, 'dustAmplitude', 0.0, 10.0, 0.1).name('Amplitude').onChange(updateShaderUniform(getParticleMat, 'dustAmplitude'));
    const mouseFolder = particleFolder.addFolder('Mouse');
    mouseFolder.add(proxy, 'mouseRippleRadius', 1.0, 30.0, 0.5).name('Ripple Radius').onChange(updateShaderUniform(getParticleMat, 'mouseRippleRadius'));
    particleFolder.close();

    // ══════════════════════════════════════════
    // OBJECTS (satellites, planes, wisps)
    // ══════════════════════════════════════════
    const objectsFolder = gui.addFolder('Orbiting Objects');
    objectsFolder.add(proxy, 'satelliteSpeed', 0.0, 5.0, 0.1).name('Satellite Speed').onChange(updateParam('satelliteSpeed'));
    objectsFolder.add(proxy, 'planeSpeed', 0.0, 5.0, 0.1).name('Plane Speed').onChange(updateParam('planeSpeed'));
    objectsFolder.add(proxy, 'wispSpeed', 0.0, 5.0, 0.1).name('Wisp Speed').onChange(updateParam('wispSpeed'));
    objectsFolder.add(proxy, 'satelliteScale', 0.1, 15.0, 0.1).name('Satellite Scale').onChange(updateParam('satelliteScale'));
    objectsFolder.add(proxy, 'planeScale', 0.1, 15.0, 0.1).name('Plane Scale').onChange(updateParam('planeScale'));
    objectsFolder.add(proxy, 'carScale', 0.1, 15.0, 0.1).name('Car Scale').onChange(updateParam('carScale'));
    objectsFolder.add(proxy, 'wispScale', 0.1, 15.0, 0.1).name('Wisp Scale').onChange(updateParam('wispScale'));
    objectsFolder.close();

    // ══════════════════════════════════════════
    // PRISM BOP EFFECTOR
    // ══════════════════════════════════════════
    const bopFolder = gui.addFolder('Prism Bop Effects');
    bopFolder.add(proxy, 'bopDecayRate', 0.01, 0.5, 0.005).name('Decay Rate').onChange(updateParam('bopDecayRate'));
    bopFolder.add(proxy, 'bopParticleBurst', 0.0, 5.0, 0.1).name('Particle Burst').onChange(updateShaderUniform(getParticleMat, 'bopParticleBurst'));
    bopFolder.add(proxy, 'bopColorShift', 0.0, 1.0, 0.01).name('Color Shift').onChange(updateShaderUniform(getParticleMat, 'bopColorShift'));
    bopFolder.add(proxy, 'bopStarBurst', 0.0, 5.0, 0.1).name('Star Burst').onChange(updateShaderUniform(getParticleMat, 'bopStarBurst'));
    bopFolder.add(proxy, 'bopGlowBoost', 0.0, 10.0, 0.1).name('Glow Boost').onChange(updateShaderUniform(getPrismGlowMat, 'bopGlowBoost'));
    bopFolder.add(proxy, 'bopAuroraBoost', 0.0, 5.0, 0.1).name('Aurora Boost').onChange(updateShaderUniform(getAuroraMat, 'bopAuroraBoost'));
    bopFolder.add(proxy, 'bopCloudFlash', 0.0, 1.0, 0.01).name('Cloud Flash').onChange(updateShaderUniform(getCloudMat, 'bopCloudFlash'));
    bopFolder.add(proxy, 'bopWaterRipple', 0.0, 2.0, 0.01).name('Water Ripple').onChange(updateSurfaceUniform('bopWaterRipple'));
    bopFolder.add(proxy, 'bopEnvGlowBoost', 0.0, 10.0, 0.1).name('Env Glow Boost').onChange(updateShaderUniform(getEnvGlowMat, 'bopEnvGlowBoost'));
    bopFolder.add(proxy, 'bopLightShow').name('Light Show Mode').onChange(updateParam('bopLightShow'));
    bopFolder.add({ fire() {
      const g = globeRef.current;
      if (g?.customUniforms?.prismPulse) g.customUniforms.prismPulse.value = 1.0;
    } }, 'fire').name('Simulate Bop');
    bopFolder.close();

    // ══════════════════════════════════════════
    // POST-PROCESSING (Cinematic VFX)
    // ══════════════════════════════════════════
    const ppFolder = gui.addFolder('Post-Processing');
    ppFolder.add(proxy, 'ppEnabled').name('Enable').onChange(updateParam('ppEnabled'));

    const colorFolder = ppFolder.addFolder('Color Grading');
    colorFolder.add(proxy, 'ppBrightness', -0.5, 0.5, 0.005).name('Brightness').onChange(updateParam('ppBrightness'));
    colorFolder.add(proxy, 'ppContrast', 0.5, 2.0, 0.01).name('Contrast').onChange(updateParam('ppContrast'));
    colorFolder.add(proxy, 'ppSaturation', 0.0, 2.0, 0.01).name('Saturation').onChange(updateParam('ppSaturation'));
    colorFolder.add(proxy, 'ppGamma', 0.5, 2.0, 0.01).name('Gamma').onChange(updateParam('ppGamma'));
    colorFolder.addColor(proxy, 'ppTint').name('Color Tint').onChange(updatePPColor('ppTint'));

    const lensFolder = ppFolder.addFolder('Lens Effects');
    lensFolder.add(proxy, 'ppChromaticAberration', 0.0, 0.02, 0.0005).name('Chromatic Aberr.').onChange(updateParam('ppChromaticAberration'));
    lensFolder.add(proxy, 'ppVignetteStrength', 0.0, 1.0, 0.01).name('Vignette Strength').onChange(updateParam('ppVignetteStrength'));
    lensFolder.add(proxy, 'ppVignetteRadius', 0.3, 1.0, 0.01).name('Vignette Radius').onChange(updateParam('ppVignetteRadius'));
    lensFolder.add(proxy, 'ppFilmGrain', 0.0, 0.15, 0.001).name('Film Grain').onChange(updateParam('ppFilmGrain'));
    lensFolder.add(proxy, 'ppScanLines', 0.0, 1.0, 0.01).name('Scan Lines').onChange(updateParam('ppScanLines'));
    lensFolder.add(proxy, 'ppScanLineSpeed', 0.0, 5.0, 0.1).name('Scan Speed').onChange(updateParam('ppScanLineSpeed'));
    ppFolder.close();

    // ══════════════════════════════════════════
    // TV / CAMERA EFFECTS
    // ══════════════════════════════════════════
    const tvFolder = gui.addFolder('TV / Camera FX');
    tvFolder.add(proxy, 'tvEnabled').name('Enable TV Mode').onChange(updateParam('tvEnabled'));
    tvFolder.add(proxy, 'tvGlitch', 0.0, 1.0, 0.01).name('Glitch').onChange(updateParam('tvGlitch'));
    tvFolder.add(proxy, 'tvGlitchSpeed', 0.0, 5.0, 0.1).name('Glitch Speed').onChange(updateParam('tvGlitchSpeed'));
    tvFolder.add(proxy, 'tvScanLineJitter', 0.0, 1.0, 0.01).name('Scan Jitter').onChange(updateParam('tvScanLineJitter'));
    tvFolder.add(proxy, 'tvColorBleed', 0.0, 1.0, 0.01).name('Color Bleed').onChange(updateParam('tvColorBleed'));
    tvFolder.add(proxy, 'tvStaticNoise', 0.0, 1.0, 0.01).name('Static Noise').onChange(updateParam('tvStaticNoise'));
    tvFolder.add(proxy, 'tvBarrelDistortion', 0.0, 0.5, 0.005).name('Barrel Distort').onChange(updateParam('tvBarrelDistortion'));
    tvFolder.add(proxy, 'tvRGBShift', 0.0, 1.0, 0.01).name('RGB Shift').onChange(updateParam('tvRGBShift'));
    tvFolder.close();

    // ══════════════════════════════════════════
    // OVERLAY GRAPHICS (arcs, rings, labels)
    // ══════════════════════════════════════════
    const overlayFolder = gui.addFolder('Overlay Graphics');
    const overlayKeys = ['arcStroke', 'arcDashLength', 'arcDashGap', 'arcDashAnimateTime',
      'ringMaxRadius', 'ringPropagationSpeed', 'ringRepeatPeriod', 'labelSize', 'labelDotRadius'];
    const updateOverlay = (key) => (v) => {
      p[key] = v;
      if (setOverlayParams) {
        const update = {};
        overlayKeys.forEach(k => { update[k] = p[k]; });
        setOverlayParams(update);
      }
    };
    overlayFolder.add(proxy, 'arcStroke', 0.0, 3.0, 0.1).name('Arc Stroke').onChange(updateOverlay('arcStroke'));
    overlayFolder.add(proxy, 'arcDashLength', 0.0, 2.0, 0.05).name('Dash Length').onChange(updateOverlay('arcDashLength'));
    overlayFolder.add(proxy, 'arcDashGap', 0.0, 2.0, 0.05).name('Dash Gap').onChange(updateOverlay('arcDashGap'));
    overlayFolder.add(proxy, 'arcDashAnimateTime', 0, 10000, 100).name('Dash Animate (ms)').onChange(updateOverlay('arcDashAnimateTime'));
    overlayFolder.add(proxy, 'ringMaxRadius', 0.0, 10.0, 0.1).name('Ring Max Radius').onChange(updateOverlay('ringMaxRadius'));
    overlayFolder.add(proxy, 'ringPropagationSpeed', 0.0, 5.0, 0.1).name('Ring Speed').onChange(updateOverlay('ringPropagationSpeed'));
    overlayFolder.add(proxy, 'ringRepeatPeriod', 0, 5000, 50).name('Ring Period (ms)').onChange(updateOverlay('ringRepeatPeriod'));
    overlayFolder.add(proxy, 'labelSize', 0.1, 5.0, 0.1).name('Label Size').onChange(updateOverlay('labelSize'));
    overlayFolder.add(proxy, 'labelDotRadius', 0.0, 2.0, 0.05).name('Label Dot Radius').onChange(updateOverlay('labelDotRadius'));
    overlayFolder.close();

    // ══════════════════════════════════════════
    // PRESETS
    // ══════════════════════════════════════════
    const presetFolder = gui.addFolder('Presets');
    const presetActions = {
      save() {
        const data = {};
        for (const [key, val] of Object.entries(p)) {
          data[key] = Array.isArray(val) ? [...val] : val;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('[GlobeEditor] Preset saved');
      },
      load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { console.warn('[GlobeEditor] No saved preset'); return; }
        try { applyPreset(JSON.parse(raw)); console.log('[GlobeEditor] Loaded'); }
        catch (e) { console.error('[GlobeEditor] Load failed:', e); }
      },
      exportJSON() {
        const data = {};
        for (const [key, val] of Object.entries(p)) {
          data[key] = Array.isArray(val) ? [...val] : val;
        }
        const json = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(json).then(
          () => console.log('[GlobeEditor] Exported to clipboard'),
          () => { const w = window.open('', '_blank'); if (w) w.document.write(`<pre>${json}</pre>`); }
        );
      },
      reset() { applyPreset(GLOBE_DEFAULTS); console.log('[GlobeEditor] Reset'); },
    };
    presetFolder.add(presetActions, 'save').name('Save to localStorage');
    presetFolder.add(presetActions, 'load').name('Load from localStorage');
    presetFolder.add(presetActions, 'exportJSON').name('Export JSON (clipboard)');
    presetFolder.add(presetActions, 'reset').name('Reset to Defaults');

    function applyPreset(data) {
      for (const [key, val] of Object.entries(data)) {
        if (!(key in p)) continue;
        if (Array.isArray(val)) { p[key] = [...val]; proxy[key] = rgbToHex(val); }
        else { p[key] = val; proxy[key] = val; }
      }
      // Push to all shader uniforms
      const mats = [
        globeShaderMaterial,
        getCloudMat(), getRimMat(), getHaloMat(), getParticleMat(),
        getAuroraMat(), getPrismGlowMat(), getEnvGlowMat(), getLavaLampMat()
      ].filter(Boolean);
      for (const [key, val] of Object.entries(data)) {
        for (const mat of mats) {
          if (!mat?.uniforms?.[key]) continue;
          if (Array.isArray(val)) mat.uniforms[key].value.set(...val);
          else mat.uniforms[key].value = val;
        }
      }
      // Post-processing tint
      if (data.ppTint) {
        const pp = globeRef.current?.ppPass;
        if (pp?.uniforms?.tint) pp.uniforms.tint.value.set(...data.ppTint);
      }
      // Scene lights
      if (data.ambientIntensity != null && globeRef.current?._ambientLight)
        globeRef.current._ambientLight.intensity = data.ambientIntensity;
      if (data.sunIntensity != null && globeRef.current?._sunLight)
        globeRef.current._sunLight.intensity = data.sunIntensity;
      // Overlay graphics (triggers React re-render)
      if (setOverlayParams) {
        const update = {};
        overlayKeys.forEach(k => { update[k] = p[k]; });
        setOverlayParams(update);
      }
      gui.controllersRecursive().forEach(c => c.updateDisplay());
    }

    // Auto-load saved preset
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTimeout(() => applyPreset(data), 1500);
      } catch (_) {}
    }

    return () => { gui.destroy(); guiRef.current = null; };
  }, [editorParams, globeRef, globeShaderMaterial, setOverlayParams]);

  return null;
}
