import { useEffect, useRef } from 'react';
import GUI from 'lil-gui';
import * as THREE from 'three';
import { GLOBE_DEFAULTS } from '../utils/globeDefaults';

const STORAGE_KEY = 'jarowe_globe_editor_preset';

// Convert [r,g,b] float array to hex string for lil-gui color picker
function rgbToHex(arr) {
  const r = Math.round(Math.min(1, Math.max(0, arr[0])) * 255);
  const g = Math.round(Math.min(1, Math.max(0, arr[1])) * 255);
  const b = Math.round(Math.min(1, Math.max(0, arr[2])) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Convert hex string to [r,g,b] float array
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export default function GlobeEditor({ editorParams, globeRef, globeShaderMaterial }) {
  const guiRef = useRef(null);

  useEffect(() => {
    if (guiRef.current) return; // already created

    const p = editorParams.current;

    // Build a proxy object for lil-gui — scalar values are direct,
    // colors are hex strings that get converted on change
    const proxy = {};
    const colorKeys = new Set();
    for (const [key, val] of Object.entries(p)) {
      if (Array.isArray(val)) {
        proxy[key] = rgbToHex(val);
        colorKeys.add(key);
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

    // Helper: update a float uniform on the surface material
    const updateSurfaceUniform = (key) => (v) => {
      p[key] = v;
      if (globeShaderMaterial?.uniforms?.[key]) {
        globeShaderMaterial.uniforms[key].value = v;
      }
    };

    // Helper: update a vec3 color uniform on the surface material from hex
    const updateSurfaceColor = (key) => (hex) => {
      const rgb = hexToRgb(hex);
      p[key] = rgb;
      if (globeShaderMaterial?.uniforms?.[key]) {
        globeShaderMaterial.uniforms[key].value.set(...rgb);
      }
    };

    // Helper: update a uniform on a named shader (cloud, rim, halo, particles)
    const updateShaderUniform = (getMaterial, key) => (v) => {
      p[key] = v;
      const mat = getMaterial();
      if (mat?.uniforms?.[key]) {
        mat.uniforms[key].value = v;
      }
    };

    const updateShaderColor = (getMaterial, key) => (hex) => {
      const rgb = hexToRgb(hex);
      p[key] = rgb;
      const mat = getMaterial();
      if (mat?.uniforms?.[key]) {
        mat.uniforms[key].value.set(...rgb);
      }
    };

    // Material accessors
    const getCloudMat = () => globeRef.current?.cloudMesh?.material;
    const getRimMat = () => globeRef.current?.atmosShell?.rim?.material;
    const getHaloMat = () => globeRef.current?.atmosShell?.halo?.material;
    const getParticleMat = () => globeRef.current?.particleSystem?.material;

    // ── Surface ──
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

    // ── Water ──
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

    // ── Clouds ──
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

    // ── Atmosphere Rim ──
    const rimFolder = gui.addFolder('Atmosphere Rim');
    rimFolder.add(proxy, 'rimFresnelPow', 0.5, 10.0, 0.1).name('Fresnel Pow').onChange(updateShaderUniform(getRimMat, 'rimFresnelPow'));
    rimFolder.add(proxy, 'rimGlowMult', 0.0, 20.0, 0.1).name('Glow Mult').onChange(updateShaderUniform(getRimMat, 'rimGlowMult'));
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

    // ── Atmosphere Halo ──
    const haloFolder = gui.addFolder('Atmosphere Halo');
    haloFolder.add(proxy, 'haloFresnelPow', 0.1, 8.0, 0.1).name('Fresnel Pow').onChange(updateShaderUniform(getHaloMat, 'haloFresnelPow'));
    haloFolder.add(proxy, 'haloGlowMult', 0.0, 3.0, 0.01).name('Glow Mult').onChange(updateShaderUniform(getHaloMat, 'haloGlowMult'));
    haloFolder.addColor(proxy, 'haloDayColor').name('Day Color').onChange(updateShaderColor(getHaloMat, 'haloDayColor'));
    haloFolder.addColor(proxy, 'haloTwilightColor').name('Twilight').onChange(updateShaderColor(getHaloMat, 'haloTwilightColor'));
    haloFolder.add(proxy, 'haloBlendMin', -1.0, 1.0, 0.01).name('Blend Min').onChange(updateShaderUniform(getHaloMat, 'haloBlendMin'));
    haloFolder.add(proxy, 'haloBlendMax', 0.0, 2.0, 0.01).name('Blend Max').onChange(updateShaderUniform(getHaloMat, 'haloBlendMax'));
    haloFolder.add(proxy, 'haloSunMaskMin', -2.0, 1.0, 0.01).name('Sun Mask Min').onChange(updateShaderUniform(getHaloMat, 'haloSunMaskMin'));
    haloFolder.add(proxy, 'haloSunMaskMax', -1.0, 2.0, 0.01).name('Sun Mask Max').onChange(updateShaderUniform(getHaloMat, 'haloSunMaskMax'));
    haloFolder.close();

    // ── Particles ──
    const particleFolder = gui.addFolder('Particles');
    const starFolder = particleFolder.addFolder('Stars');
    starFolder.add(proxy, 'starTwinkleBase', 0.0, 1.0, 0.01).name('Twinkle Base').onChange(updateShaderUniform(getParticleMat, 'starTwinkleBase'));
    starFolder.add(proxy, 'starTwinkleDepth', 0.0, 1.0, 0.01).name('Twinkle Depth').onChange(updateShaderUniform(getParticleMat, 'starTwinkleDepth'));
    starFolder.add(proxy, 'starTwinkleSpeed', 0.0, 10.0, 0.1).name('Twinkle Speed').onChange(updateShaderUniform(getParticleMat, 'starTwinkleSpeed'));
    starFolder.add(proxy, 'starSize', 0.1, 10.0, 0.1).name('Size').onChange(updateShaderUniform(getParticleMat, 'starSize'));

    const dustFolder = particleFolder.addFolder('Dust');
    dustFolder.add(proxy, 'dustSize', 0.1, 5.0, 0.1).name('Size').onChange(updateShaderUniform(getParticleMat, 'dustSize'));
    dustFolder.add(proxy, 'dustSpeed', 0.0, 5.0, 0.1).name('Speed').onChange(updateShaderUniform(getParticleMat, 'dustSpeed'));
    dustFolder.add(proxy, 'dustAmplitude', 0.0, 10.0, 0.1).name('Amplitude').onChange(updateShaderUniform(getParticleMat, 'dustAmplitude'));

    const mouseFolder = particleFolder.addFolder('Mouse');
    mouseFolder.add(proxy, 'mouseRippleRadius', 1.0, 30.0, 0.5).name('Ripple Radius').onChange(updateShaderUniform(getParticleMat, 'mouseRippleRadius'));
    particleFolder.close();

    // ── Lighting ──
    const lightFolder = gui.addFolder('Lighting');
    lightFolder.add(proxy, 'ambientIntensity', 0.0, 2.0, 0.01).name('Ambient').onChange((v) => {
      p.ambientIntensity = v;
      if (globeRef.current?._ambientLight) globeRef.current._ambientLight.intensity = v;
    });
    lightFolder.add(proxy, 'sunIntensity', 0.0, 10.0, 0.1).name('Sun').onChange((v) => {
      p.sunIntensity = v;
      if (globeRef.current?._sunLight) globeRef.current._sunLight.intensity = v;
    });
    lightFolder.close();

    // ── Presets ──
    const presetFolder = gui.addFolder('Presets');

    const presetActions = {
      save() {
        // Serialize current params
        const data = {};
        for (const [key, val] of Object.entries(p)) {
          data[key] = Array.isArray(val) ? [...val] : val;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('[GlobeEditor] Preset saved to localStorage');
      },
      load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { console.warn('[GlobeEditor] No saved preset found'); return; }
        try {
          const data = JSON.parse(raw);
          applyPreset(data);
          console.log('[GlobeEditor] Preset loaded');
        } catch (e) { console.error('[GlobeEditor] Failed to load preset:', e); }
      },
      exportJSON() {
        const data = {};
        for (const [key, val] of Object.entries(p)) {
          data[key] = Array.isArray(val) ? [...val] : val;
        }
        const json = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(json).then(
          () => console.log('[GlobeEditor] Exported to clipboard'),
          () => {
            // Fallback: open in new tab
            const w = window.open('', '_blank');
            if (w) { w.document.write(`<pre>${json}</pre>`); }
          }
        );
      },
      reset() {
        applyPreset(GLOBE_DEFAULTS);
        console.log('[GlobeEditor] Reset to defaults');
      }
    };

    presetFolder.add(presetActions, 'save').name('Save to localStorage');
    presetFolder.add(presetActions, 'load').name('Load from localStorage');
    presetFolder.add(presetActions, 'exportJSON').name('Export JSON (clipboard)');
    presetFolder.add(presetActions, 'reset').name('Reset to Defaults');

    function applyPreset(data) {
      for (const [key, val] of Object.entries(data)) {
        if (!(key in p)) continue;
        if (Array.isArray(val)) {
          p[key] = [...val];
          proxy[key] = rgbToHex(val);
        } else {
          p[key] = val;
          proxy[key] = val;
        }
      }
      // Push all values to uniforms
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          // Update vec3 uniforms
          if (globeShaderMaterial?.uniforms?.[key]) globeShaderMaterial.uniforms[key].value.set(...val);
          const cm = getCloudMat(); if (cm?.uniforms?.[key]) cm.uniforms[key].value.set(...val);
          const rm = getRimMat(); if (rm?.uniforms?.[key]) rm.uniforms[key].value.set(...val);
          const hm = getHaloMat(); if (hm?.uniforms?.[key]) hm.uniforms[key].value.set(...val);
          const pm = getParticleMat(); if (pm?.uniforms?.[key]) pm.uniforms[key].value.set(...val);
        } else {
          // Update float uniforms
          if (globeShaderMaterial?.uniforms?.[key]) globeShaderMaterial.uniforms[key].value = val;
          const cm = getCloudMat(); if (cm?.uniforms?.[key]) cm.uniforms[key].value = val;
          const rm = getRimMat(); if (rm?.uniforms?.[key]) rm.uniforms[key].value = val;
          const hm = getHaloMat(); if (hm?.uniforms?.[key]) hm.uniforms[key].value = val;
          const pm = getParticleMat(); if (pm?.uniforms?.[key]) pm.uniforms[key].value = val;
        }
      }
      // Update lights
      if (data.ambientIntensity != null && globeRef.current?._ambientLight) {
        globeRef.current._ambientLight.intensity = data.ambientIntensity;
      }
      if (data.sunIntensity != null && globeRef.current?._sunLight) {
        globeRef.current._sunLight.intensity = data.sunIntensity;
      }
      // Refresh GUI controls to show new values
      gui.controllersRecursive().forEach(c => c.updateDisplay());
    }

    // Auto-load saved preset on startup
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Delay slightly to ensure materials are initialized
        setTimeout(() => applyPreset(data), 1500);
      } catch (_) {}
    }

    return () => {
      gui.destroy();
      guiRef.current = null;
    };
  }, [editorParams, globeRef, globeShaderMaterial]);

  return null; // lil-gui manages its own DOM
}
