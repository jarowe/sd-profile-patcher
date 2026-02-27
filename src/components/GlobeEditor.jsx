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

    // Material accessors
    const getCloudMat = () => globeRef.current?.cloudMesh?.material;
    const getRimMat = () => globeRef.current?.atmosShell?.rim?.material;
    const getHaloMat = () => globeRef.current?.atmosShell?.halo?.material;
    const getParticleMat = () => globeRef.current?.particleSystem?.material;
    const getAuroraMat = () => globeRef.current?.auroraMesh?.material;
    const getPrismGlowMat = () => globeRef.current?.prismGlowMesh?.material;

    // ══════════════════════════════════════════
    // CONTROLS / TIME
    // ══════════════════════════════════════════
    const controlsFolder = gui.addFolder('Controls');
    controlsFolder.add(proxy, 'animationPaused').name('Pause Animation').onChange(updateParam('animationPaused'));
    controlsFolder.add(proxy, 'timeOverrideHour', -1, 24, 0.25).name('Time of Day (UTC)').onChange(updateParam('timeOverrideHour'))
      .listen();
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

    const sunsetFolder = surfaceFolder.addFolder('Sunset');
    sunsetFolder.addColor(proxy, 'sunsetColor').name('Color').onChange(updateSurfaceColor('sunsetColor'));
    sunsetFolder.add(proxy, 'sunsetStrength', 0.0, 1.0, 0.01).name('Strength').onChange(updateSurfaceUniform('sunsetStrength'));
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
    prismFolder.add(proxy, 'prismGlowIntensity', 0.0, 2.0, 0.01).name('Intensity').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowIntensity'));
    prismFolder.add(proxy, 'prismGlowSpeed', 0.0, 3.0, 0.05).name('Speed').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowSpeed'));
    prismFolder.add(proxy, 'prismGlowNoiseScale', 0.5, 10.0, 0.1).name('Noise Scale').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowNoiseScale'));
    prismFolder.add(proxy, 'prismGlowFresnelPow', 0.5, 8.0, 0.1).name('Fresnel Power').onChange(updateShaderUniform(getPrismGlowMat, 'prismGlowFresnelPow'));
    prismFolder.close();

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
    objectsFolder.close();

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
        getAuroraMat(), getPrismGlowMat()
      ].filter(Boolean);
      for (const [key, val] of Object.entries(data)) {
        for (const mat of mats) {
          if (!mat?.uniforms?.[key]) continue;
          if (Array.isArray(val)) mat.uniforms[key].value.set(...val);
          else mat.uniforms[key].value = val;
        }
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
