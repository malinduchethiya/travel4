import { useEffect, useRef } from "react"
import gsap from "gsap"

export type SkyAnimationState = {
  /** 0 -> 1 total scroll progress across the hero pin (0..0.45 = diurnal sky cycle, 0.45..1.0 = FPV drone flight) */
  progress: number
  /** Callback fired every animation tick with momentum-smoothed (flightProgress, skyProgress) */
  onFlightTick?: (flightProgress: number, skyProgress: number) => void
  /** Whether motion is paused via footer controls */
  paused: boolean
}

type HeroSkyCanvasProps = {
  stateRef: React.MutableRefObject<SkyAnimationState>
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uPhoto;
uniform sampler2D uEllaPhoto;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform vec2 uEllaImageSize;
uniform float uTime;
uniform float uProgress;
uniform float uFlight;

#define PI 3.14159265359
#define TAU 6.28318530718

mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

// High quality hash & value noise
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 4-octave FBM for fast, smooth cumulus structure
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p * 2.03 + vec2(17.1, 31.7);
    a *= 0.5;
  }
  return v;
}

// 4-octave billowy cumulus noise for puffy tropical cloud tops
float billowFbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    float n = noise(p);
    float billow = 1.0 - abs(n * 2.0 - 1.0);
    v += a * mix(n, billow * billow, 0.45);
    p = m * p * 2.05 + vec2(11.3, 23.9);
    a *= 0.5;
  }
  return v;
}

// Starfield layer with sequential magnitude thresholds
float starLayer(vec2 uv, float scale, float revealThreshold, float time) {
  vec2 gv = fract(uv * scale) - 0.5;
  vec2 id = floor(uv * scale);
  vec2 rnd = hash22(id);

  float mag = hash21(id + 19.37);
  float isVisible = smoothstep(1.0 - revealThreshold, 1.0 - revealThreshold + 0.18, mag);
  if (isVisible <= 0.001) return 0.0;

  vec2 offset = (rnd - 0.5) * 0.65;
  vec2 d = gv - offset;
  float dist = length(d);

  float twinkle = 0.68 + 0.32 * sin(time * (2.2 + rnd.x * 4.5) + rnd.y * TAU);
  float size = mix(0.018, 0.055, pow(mag, 3.0));
  float star = smoothstep(size, 0.0, dist);
  float glow = smoothstep(size * 3.2, 0.0, dist) * 0.25 * step(0.86, mag);

  return (star + glow) * isVisible * twinkle * pow(mag, 1.4);
}

// Sample Ella scene (/images/ella.webp) with object-fit: cover and subtle highland foliage breeze
vec3 sampleEllaScene(vec2 screenUv, float canvasAspect, float ellaAspect, float flight, float bankAngle, float time) {
  vec2 ellaScale = canvasAspect > ellaAspect
    ? vec2(1.0, ellaAspect / canvasAspect)
    : vec2(canvasAspect / ellaAspect, 1.0);

  vec2 ellaAnchor = vec2(0.5, 0.5);
  vec2 baseEllaUv = (screenUv - ellaAnchor) * ellaScale + ellaAnchor;

  // Smooth forward drone glide into Ella after passing through the "o" letter
  float ellaGlide = smoothstep(0.20, 0.98, flight);
  float ellaZoom = mix(1.22, 1.0, ellaGlide);
  vec2 ellaUv = ellaAnchor + rot(bankAngle * 0.5) * ((baseEllaUv - ellaAnchor) / ellaZoom);
  ellaUv = clamp(ellaUv, 0.001, 0.999);

  vec4 baseElla = texture2D(uEllaPhoto, ellaUv);
  // Detect green highland forest foliage (keeping the stone Nine Arch Bridge and blue train solid)
  float greenExcess = baseElla.g - max(baseElla.r * 0.92, baseElla.b * 1.02);
  float isFoliage = smoothstep(0.008, 0.055, greenExcess);

  float localWind = noise(ellaUv * 8.0 + vec2(2.7, 6.1));
  float localSpd = mix(0.75, 1.45, noise(ellaUv * 9.5 + vec2(12.4, 5.8)));
  float phase = noise(ellaUv * 12.0 + vec2(19.1, 27.3)) * TAU;

  vec2 sway = vec2(
    sin(time * 0.825 * localSpd + phase + ellaUv.x * 7.0) * 0.00085,
    cos(time * 0.630 * localSpd + phase + ellaUv.y * 6.0) * 0.00055
  ) * (0.35 + localWind * 0.65) * isFoliage;

  vec3 ellaColor = texture2D(uEllaPhoto, clamp(ellaUv + sway, 0.001, 0.999)).rgb;
  return ellaColor;
}

void main() {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  float flight = clamp(uFlight, 0.0, 1.0);
  float bankAngle = sin(flight * PI * 1.4) * 0.045 * smoothstep(0.0, 0.14, flight) * (1.0 - smoothstep(0.65, 0.95, flight));

  // Fast path: once Ella is 100% revealed, skip all Sigiriya sky/cloud/star shader work
  if (flight >= 0.65) {
    float ellaAspect = uEllaImageSize.x / max(uEllaImageSize.y, 1.0);
    vec3 ellaOnly = sampleEllaScene(vUv, canvasAspect, ellaAspect, flight, bankAngle, uTime);
    gl_FragColor = vec4(ellaOnly, 1.0);
    return;
  }

  // Match CSS object-fit: cover; object-position: center 47%
  float imageAspect = uImageSize.x / max(uImageSize.y, 1.0);
  vec2 scale = canvasAspect > imageAspect
    ? vec2(1.0, imageAspect / canvasAspect)
    : vec2(canvasAspect / imageAspect, 1.0);

  vec2 anchor = vec2(0.5, 0.47);
  vec2 baseImgUv = (vUv - anchor) * scale + anchor;
  vec2 sigiriyaApex = vec2(0.495, 0.435);

  // Forward drone acceleration through the "o" portal
  float flyThrough = smoothstep(0.0, 0.55, flight);
  float approachZoom = mix(1.0, 2.45, pow(flyThrough, 1.45));

  vec2 relToSummit = rot(bankAngle) * ((baseImgUv - sigiriyaApex) / approachZoom);
  vec2 imgUv = sigiriyaApex + relToSummit;

  // --- Natural Organic Wind & Living Foliage Dynamics ---
  vec4 baseSample = texture2D(uPhoto, clamp(imgUv, 0.001, 0.999));
  float greenExcess = baseSample.g - max(baseSample.r * 0.94, baseSample.b * 1.02);
  float foliageMask = smoothstep(0.006, 0.052, greenExcess);

  // Spatial noise mask: creates random quiet vs active pockets across different tree clusters
  float localWindFactor = noise(imgUv * 7.5 + vec2(3.1, 7.4));
  float localSpeedVar = mix(0.75, 1.45, noise(imgUv * 9.2 + vec2(14.1, 8.3)));
  float localPhase = noise(imgUv * 12.0 + vec2(18.2, 31.5)) * TAU;

  // 1.5x tuned, drifting wind gusts across the forest canopy
  float windGust = noise(imgUv * 3.2 + vec2(uTime * 0.33, uTime * 0.18));
  windGust = smoothstep(0.25, 0.85, windGust);

  // 1.5x speed branch sway with randomized spatial variations
  vec2 branchSway = vec2(
    sin(uTime * 0.825 * localSpeedVar + localPhase + imgUv.x * 6.0 + imgUv.y * 4.0) * 0.00095,
    cos(uTime * 0.630 * localSpeedVar + localPhase + imgUv.x * 5.0 - imgUv.y * 3.5) * 0.00055
  ) * (0.35 + localWindFactor * 0.65) * (0.5 + windGust * 0.5);

  // 1.5x speed leaf flutter across tree clusters
  vec2 leafFlutter = vec2(
    sin(uTime * 1.95 * localSpeedVar + localPhase * 2.0 + imgUv.x * 24.0) * 0.00055,
    cos(uTime * 1.65 * localSpeedVar + localPhase * 2.0 + imgUv.y * 20.0) * 0.00045
  ) * localWindFactor;

  vec2 windDisplacement = (branchSway + leafFlutter) * foliageMask;
  vec2 activeImgUv = clamp(imgUv + windDisplacement, 0.001, 0.999);

  vec4 photo = texture2D(uPhoto, activeImgUv);

  // Radial FPV optical flow blur as the drone accelerates through the "o" letter
  if (flight > 0.02 && flight < 0.54) {
    float radialDist = length(baseImgUv - sigiriyaApex);
    float climbBlur = sin(smoothstep(0.03, 0.52, flight) * PI) * 0.018 * radialDist;
    if (climbBlur > 0.0008) {
      vec2 radialDir = normalize(activeImgUv - sigiriyaApex + vec2(0.0001));
      vec2 blurVec = radialDir * climbBlur;
      vec4 tap1 = texture2D(uPhoto, clamp(activeImgUv - blurVec * 0.65, 0.001, 0.999));
      photo = mix(photo, tap1, 0.38);
    }
  }

  // 1.5x tuned leaf surface light glint as breeze moves through leaves
  float flutterShimmer = sin(uTime * 2.1 * localSpeedVar + localPhase + activeImgUv.x * 35.0);
  float leafGlint = max(0.0, flutterShimmer) * 0.032 * foliageMask * localWindFactor;
  photo.rgb += vec3(0.04, 0.06, 0.02) * leafGlint;

  // --- 1. Natural, Pixel-Accurate Sky vs Foreground Mask from sigiriya.webp ---
  float fgWarmOrGreen = max(photo.r - photo.b + 0.005, (photo.g - photo.b) * 1.15 + 0.005);
  float isSkyChroma = 1.0 - smoothstep(0.00, 0.042, fgWarmOrGreen);
  float isSkyLuma = smoothstep(0.32, 0.46, photo.b);
  float isAboveJungle = 1.0 - smoothstep(0.565, 0.588, activeImgUv.y);

  // Seamless, natural sky mask tracking the exact organic contour of Sigiriya rock
  float skyMask = clamp(isSkyChroma * isSkyLuma * isAboveJungle, 0.0, 1.0);

  // --- 2. Diurnal Scroll Timeline (0 -> 1) ---
  float p = clamp(uProgress, 0.0, 1.0);

  // Smooth bell curve for night: enters gently, peaks around p = 0.55, and recedes cleanly by p = 0.86
  float nightEnter = smoothstep(0.20, 0.44, p);
  float nightExit = 1.0 - smoothstep(0.66, 0.88, p);
  float nightAmount = nightEnter * nightExit;

  // Twilight pulses during dusk (p=0.10..0.36) and dawn (p=0.66..0.88)
  float duskAmount = smoothstep(0.08, 0.20, p) * (1.0 - smoothstep(0.22, 0.36, p));
  float dawnAmount = smoothstep(0.66, 0.76, p) * (1.0 - smoothstep(0.80, 0.89, p));
  float twilightAmount = max(duskAmount, dawnAmount);

  // Sequential cloud dissipation (0 = full daytime clouds, 1 = completely dissolved at night)
  float dissolveEnter = smoothstep(0.16, 0.46, p);
  float dissolveExit = 1.0 - smoothstep(0.70, 0.88, p);
  float cloudDissolve = dissolveEnter * dissolveExit;

  // Sequential star emergence (0 = no stars, 1 = full starfield)
  float starsEnter = smoothstep(0.28, 0.52, p);
  float starsExit = 1.0 - smoothstep(0.66, 0.84, p);
  float starReveal = starsEnter * starsExit;

  // One full 360-degree rotation (0 -> TAU) across scroll progress
  float spinPhase = smoothstep(0.0, 1.0, p);
  float spinAngle = spinPhase * TAU;

  // --- 3. 3D Perspective Sky Dome Pointing to Sigiriya ---
  vec2 skyPivot = vec2(0.495, 0.34);

  vec2 relSky = imgUv - skyPivot;
  float horizonFactor = clamp((0.60 - imgUv.y) / 0.60, 0.08, 1.0);
  vec2 domeCoord = vec2(relSky.x / pow(horizonFactor, 0.38), relSky.y * 1.65 / pow(horizonFactor, 0.25));

  vec2 spunDome = rot(spinAngle) * domeCoord;

  // Continuous realistic floating wind drift
  vec2 windDrift1 = vec2(uTime * 0.032, -uTime * 0.011);
  vec2 windDrift2 = vec2(uTime * 0.019, -uTime * 0.007);

  vec2 toSigiriya = imgUv - sigiriyaApex;
  vec2 rotatedRay = rot(spinAngle) * vec2(toSigiriya.x, toSigiriya.y * 1.55);
  float rayDist = length(rotatedRay);

  // --- 4. Base Atmospheric Sky Gradient (Day -> Sunset -> Night -> Day) ---
  float skyElev = clamp((0.58 - imgUv.y) / 0.58, 0.0, 1.0);

  // Exact daytime Ceylon sky blue matching sigiriya.webp
  vec3 dayZenith = vec3(0.015, 0.355, 0.785);
  vec3 dayHorizon = vec3(0.220, 0.555, 0.895);
  vec3 daySky = mix(dayHorizon, dayZenith, pow(skyElev, 0.65));

  // Golden hour / sunset sky behind Sigiriya
  vec3 sunsetZenith = vec3(0.09, 0.14, 0.34);
  vec3 sunsetMid = vec3(0.48, 0.26, 0.36);
  vec3 sunsetHorizon = vec3(0.88, 0.48, 0.24);
  float sunGlow = exp(-length((imgUv - sigiriyaApex) * vec2(1.4, 2.6)) * 2.6);
  vec3 twilightSky = mix(sunsetHorizon, sunsetMid, smoothstep(0.0, 0.45, skyElev));
  twilightSky = mix(twilightSky, sunsetZenith, smoothstep(0.35, 1.0, skyElev));
  twilightSky += vec3(0.22, 0.12, 0.04) * sunGlow;

  // Deep starlit night sky above Sigiriya
  vec3 nightZenith = vec3(0.012, 0.022, 0.065);
  vec3 nightHorizon = vec3(0.045, 0.085, 0.175);
  vec3 nightSky = mix(nightHorizon, nightZenith, pow(skyElev, 0.6));
  nightSky += vec3(0.03, 0.055, 0.11) * exp(-length((imgUv - sigiriyaApex) * vec2(1.6, 3.0)) * 3.0);

  vec3 skyColor = mix(daySky, twilightSky, twilightAmount);
  skyColor = mix(skyColor, nightSky, nightAmount);

  // --- 5. Realistic Multi-Layer Volumetric Clouds + Sequential Disappearance ---
  vec2 cloudUvA = spunDome * 2.35 + windDrift1;
  vec2 warpA = vec2(
    fbm(cloudUvA * 0.8 + vec2(0.0, uTime * 0.015)),
    fbm(cloudUvA * 0.8 + vec2(5.2, -uTime * 0.012))
  );
  float rawCloudA = billowFbm(cloudUvA + (warpA - 0.5) * 0.55);

  vec2 cloudUvB = spunDome * 1.45 - windDrift2 * 0.8 + vec2(3.7, 1.9);
  float rawCloudB = billowFbm(cloudUvB + (warpA - 0.5) * 0.35);
  float horizonCumulusBias = smoothstep(0.05, 0.42, 1.0 - skyElev) * 0.18;

  float sequentialOrderA = clamp(skyElev * 0.55 + rayDist * 0.45, 0.0, 1.0);
  float localDissolveA = smoothstep(0.0, 0.72, cloudDissolve * 1.35 - (1.0 - sequentialOrderA) * 0.35);

  float sequentialOrderB = clamp((1.0 - skyElev) * 0.5 + (1.0 - rayDist) * 0.5, 0.0, 1.0);
  float localDissolveB = smoothstep(0.18, 0.95, cloudDissolve * 1.25 - sequentialOrderB * 0.25);

  float thresholdA = mix(0.46, 0.92, localDissolveA);
  float densityA = smoothstep(thresholdA, thresholdA + 0.26, rawCloudA);

  float thresholdB = mix(0.49 - horizonCumulusBias, 0.94, localDissolveB);
  float densityB = smoothstep(thresholdB, thresholdB + 0.22, rawCloudB);

  float totalCloud = clamp(densityA * 0.78 + densityB * 0.85, 0.0, 1.0);

  vec2 sunDir = normalize(vec2(-0.45, -0.65));
  float shadowSample = billowFbm(cloudUvA + sunDir * 0.14 + (warpA - 0.5) * 0.55);
  float cloudLit = clamp(1.0 - max(0.0, shadowSample - rawCloudA) * 2.6, 0.25, 1.0);

  // Cloud colors across Day -> Sunset -> Night
  vec3 dayCloudBright = vec3(0.98, 0.99, 1.00);
  vec3 dayCloudShadow = vec3(0.66, 0.79, 0.93);
  vec3 dayCloudCol = mix(dayCloudShadow, dayCloudBright, cloudLit);

  vec3 sunsetCloudBright = vec3(0.96, 0.72, 0.50);
  vec3 sunsetCloudShadow = vec3(0.36, 0.24, 0.40);
  vec3 sunsetCloudCol = mix(sunsetCloudShadow, sunsetCloudBright, cloudLit);

  vec3 nightCloudCol = mix(vec3(0.06, 0.09, 0.17), vec3(0.18, 0.24, 0.36), cloudLit);

  vec3 cloudColor = mix(dayCloudCol, sunsetCloudCol, twilightAmount);
  cloudColor = mix(cloudColor, nightCloudCol, nightAmount);

  // Soft fringe shimmer only during twilight
  float fringe = smoothstep(0.05, 0.35, totalCloud) * (1.0 - smoothstep(0.45, 0.85, totalCloud));
  cloudColor += vec3(0.08, 0.09, 0.10) * fringe * twilightAmount;

  float horizonFade = smoothstep(0.0, 0.10, skyElev);
  float finalCloudAlpha = totalCloud * horizonFade * (1.0 - smoothstep(0.88, 1.0, cloudDissolve));

  // --- 6. Sequential Stars & Milky Way in the Night Sky ---
  if (starReveal > 0.001) {
    vec2 starUv = rot(spinAngle * 0.35) * (imgUv - sigiriyaApex) * vec2(canvasAspect, 1.0);

    float s1 = starLayer(starUv + 1.1, 18.0, clamp(starReveal * 1.45, 0.0, 1.0), uTime);
    float s2 = starLayer(starUv + 4.7, 34.0, clamp((starReveal - 0.18) * 1.35, 0.0, 1.0), uTime + 10.0);
    float s3 = starLayer(starUv + 9.3, 62.0, clamp((starReveal - 0.38) * 1.5, 0.0, 1.0), uTime + 23.0);

    vec3 starCol1 = vec3(0.92, 0.96, 1.00) * s1 * 1.35;
    vec3 starCol2 = vec3(1.00, 0.93, 0.84) * s2 * 1.05;
    vec3 starCol3 = vec3(0.80, 0.88, 1.00) * s3 * 0.85;

    float milkyBand = exp(-pow((starUv.x * 0.7 + starUv.y * 1.1 + 0.12) * 3.8, 2.0));
    float milkyNoise = fbm(starUv * 6.0 + vec2(2.1, 7.4));
    vec3 milkyWay = vec3(0.05, 0.08, 0.16) * milkyBand * milkyNoise * smoothstep(0.4, 1.0, starReveal);

    float starMask = (1.0 - finalCloudAlpha * 0.92) * smoothstep(0.03, 0.22, skyElev);
    skyColor += (starCol1 + starCol2 + starCol3 + milkyWay) * starMask;
  }

  vec3 renderedSky = mix(skyColor, cloudColor, finalCloudAlpha);

  // --- 7. Realistic, Smooth Moonlit Relighting on Foreground ---
  vec3 fgColor = photo.rgb;

  vec3 sunsetFg = fgColor * vec3(1.08, 0.88, 0.72);

  float luma = dot(fgColor, vec3(0.299, 0.587, 0.114));
  vec3 moonlitFg = fgColor * mix(vec3(0.15, 0.21, 0.32), vec3(0.22, 0.28, 0.38), luma);

  vec3 finalFg = mix(fgColor, sunsetFg, twilightAmount * 0.75);
  finalFg = mix(finalFg, moonlitFg, nightAmount);

  vec3 finalColor = mix(finalFg, renderedSky, skyMask);

  // --- 8. Transition into Ella (/images/ella.webp) After Drone Passes the Letter "o" ---
  if (flight > 0.22) {
    float ellaAspect = uEllaImageSize.x / max(uEllaImageSize.y, 1.0);
    vec3 ellaColor = sampleEllaScene(vUv, canvasAspect, ellaAspect, flight, bankAngle, uTime);

    // As the drone passes through the letter "o" (flight: 0.24 -> 0.56), reveal Ella expanding from the portal center
    vec2 portalOffset = (vUv - sigiriyaApex) * vec2(canvasAspect, 1.0);
    float portalDist = length(portalOffset);
    float mistNoise = billowFbm(portalOffset * 2.2 + vec2(uTime * 0.03, -uTime * 0.02));

    float portalRadius = mix(-0.15, 1.65, smoothstep(0.24, 0.58, flight));
    float ellaReveal = 1.0 - smoothstep(portalRadius - 0.22, portalRadius + 0.18, portalDist - (mistNoise - 0.5) * 0.18);
    ellaReveal = clamp(max(ellaReveal, smoothstep(0.54, 0.65, flight)), 0.0, 1.0);

    finalColor = mix(finalColor, ellaColor, ellaReveal);
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function HeroSkyCanvas({ stateRef }: HeroSkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }) || (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null)
    if (!gl) return

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    // Fullscreen quad
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const aPosition = gl.getAttribLocation(program, "aPosition")
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    const uPhoto = gl.getUniformLocation(program, "uPhoto")
    const uEllaPhoto = gl.getUniformLocation(program, "uEllaPhoto")
    const uResolution = gl.getUniformLocation(program, "uResolution")
    const uImageSize = gl.getUniformLocation(program, "uImageSize")
    const uEllaImageSize = gl.getUniformLocation(program, "uEllaImageSize")
    const uTime = gl.getUniformLocation(program, "uTime")
    const uProgress = gl.getUniformLocation(program, "uProgress")
    const uFlight = gl.getUniformLocation(program, "uFlight")

    // Texture 0: Front view (/images/sigiriya.webp)
    const texture0 = gl.createTexture()
    let imageWidth = 1920
    let imageHeight = 1280
    let texture0Ready = false

    const image0 = new Image()
    image0.crossOrigin = "anonymous"
    image0.src = "/images/sigiriya.webp"
    image0.onload = () => {
      imageWidth = image0.naturalWidth || 1920
      imageHeight = image0.naturalHeight || 1280
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture0)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image0)
      texture0Ready = true
    }

    // Texture 1: Ella view (/images/ella.webp) revealed after passing through the letter "o"
    const texture1 = gl.createTexture()
    let ellaImageWidth = 1920
    let ellaImageHeight = 1200
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture1)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([28, 52, 30, 255]),
    )

    const image1 = new Image()
    image1.crossOrigin = "anonymous"
    image1.src = "/images/ella.webp"
    image1.onload = () => {
      ellaImageWidth = image1.naturalWidth || 1920
      ellaImageHeight = image1.naturalHeight || 1200
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texture1)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1)
    }

    const resize = () => {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35)
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (Math.abs(canvas.width - width) > 1 || Math.abs(canvas.height - height) > 1) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    resize()
    window.addEventListener("resize", resize)

    // Pause WebGL draw calls when the hero section is scrolled out of the viewport
    let isHeroVisible = true
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          isHeroVisible = entries[0].isIntersecting
        }
      },
      { threshold: 0.01 },
    )
    observer.observe(canvas)

    let elapsed = 0
    let currentProgress = stateRef.current.progress
    let lastTime = performance.now()

    const renderTick = () => {
      const now = performance.now()
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      if (!texture0Ready) return

      const target = Math.max(0, Math.min(1, stateRef.current.progress))
      const delta = Math.abs(target - currentProgress)

      // Skip GPU work when hero is scrolled out of view and progress has settled
      if (!isHeroVisible && delta < 0.0005) {
        return
      }

      if (!stateRef.current.paused) {
        elapsed += dt
      }

      // Snappy inertia tracking (Lenis already provides physical scroll inertia)
      const damping = 1.0 - Math.exp(-16.0 * dt)
      currentProgress += (target - currentProgress) * damping
      if (delta < 0.0002) {
        currentProgress = target
      }

      // Split total hero progress into:
      // Act 1 (0.00 -> 0.45): Diurnal sky cycle (day -> night -> stars -> day)
      // Act 2 (0.45 -> 1.00): Drone flight through the letter "o" into Ella (/images/ella.webp)
      const skySplit = 0.45
      const skyProgress = Math.max(0, Math.min(1, currentProgress / skySplit))
      const flightProgress = Math.max(
        0,
        Math.min(1, (currentProgress - skySplit) / (1 - skySplit)),
      )

      stateRef.current.onFlightTick?.(flightProgress, skyProgress)

      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture0)
      gl.uniform1i(uPhoto, 0)

      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texture1)
      gl.uniform1i(uEllaPhoto, 1)

      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform2f(uImageSize, imageWidth, imageHeight)
      gl.uniform2f(uEllaImageSize, ellaImageWidth, ellaImageHeight)
      gl.uniform1f(uTime, elapsed)
      gl.uniform1f(uProgress, skyProgress)
      gl.uniform1f(uFlight, flightProgress)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    gsap.ticker.add(renderTick)

    return () => {
      observer.disconnect()
      gsap.ticker.remove(renderTick)
      window.removeEventListener("resize", resize)
      gl.deleteTexture(texture0)
      gl.deleteTexture(texture1)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [stateRef])

  return (
    <canvas
      ref={canvasRef}
      className="hero-sky-canvas"
      aria-hidden="true"
    />
  )
}
