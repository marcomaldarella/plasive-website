'use client';

import { useEffect } from 'react';
import * as THREE from 'three';
import type { HomepageContent } from '@/types/content';

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════ */
type RGB = [number, number, number];
interface FluidConfig { iterations: number; cursorSize: number; mouseForce: number; resolution: number; dyeDissipation: number; velocityDissipation: number; c1: RGB; c2: RGB; c3: RGB; }
interface GhostConfig { ax: number; ay: number; fx: number; fy: number; ph: number; cr: RGB; ca: RGB; ci: number; }
interface SharedState { currentX: number; }

/* ═══════════════════════════════════════════════════════════════════════
   GLSL SHADERS
═══════════════════════════════════════════════════════════════════════ */
const VS = `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const ADVECT = `precision highp float; uniform sampler2D velocity; uniform sampler2D source; uniform vec2 px; uniform float dt; uniform float scale; uniform float time; varying vec2 vUv; vec3 _m2(vec3 x){return x-floor(x*(1./289.))*289.;} vec2 _m2v2(vec2 x){return x-floor(x*(1./289.))*289.;} vec3 _p(vec3 x){return _m2(((x*34.)+1.)*x);} float snoise2(vec2 v){ const vec4 C=vec4(.211324865,.366025403,-.577350269,.024390243); vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx); vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.); vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=_m2v2(i); vec3 p=_p(_p(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.)); vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m;m=m*m; vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5; vec3 ox=floor(x+.5);vec3 a0=x-ox; m*=1.79284291-.85373472*(a0*a0+h*h); vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g);} void main(){ vec2 vel = texture2D(velocity, vUv).xy; float n1 = snoise2(vUv * 2.8 + time * 0.08); float n2 = snoise2(vUv * 2.8 + 100. + time * 0.08); vec2 pos = vUv - vel * px * dt + vec2(n1, n2) * 0.0018; gl_FragColor = texture2D(source, pos) * scale; }`;
const ADDFORCE = `precision highp float; uniform sampler2D velocity; uniform vec2 force; uniform vec2 center; uniform vec2 scale; uniform vec2 px; varying vec2 vUv; void main(){ vec4 vel = texture2D(velocity, vUv); float d = length((vUv - center) / scale); float f = max(0., 1. - d); f = f*f*f; vel.xy += force * f; gl_FragColor = vel; }`;
const DIVERGENCE = `precision highp float; uniform sampler2D velocity; uniform vec2 px; varying vec2 vUv; void main(){ float x0=texture2D(velocity,vUv-vec2(px.x,0.)).x; float x1=texture2D(velocity,vUv+vec2(px.x,0.)).x; float y0=texture2D(velocity,vUv-vec2(0.,px.y)).y; float y1=texture2D(velocity,vUv+vec2(0.,px.y)).y; gl_FragColor=vec4((x1-x0+y1-y0)*.5,0.,0.,1.); }`;
const JACOBI = `precision highp float; uniform sampler2D pressure; uniform sampler2D divergence; uniform float alpha; uniform float beta; uniform vec2 px; varying vec2 vUv; void main(){ float x0=texture2D(pressure,vUv-vec2(px.x,0.)).r; float x1=texture2D(pressure,vUv+vec2(px.x,0.)).r; float y0=texture2D(pressure,vUv-vec2(0.,px.y)).r; float y1=texture2D(pressure,vUv+vec2(0.,px.y)).r; float d=texture2D(divergence,vUv).r; gl_FragColor=vec4((x0+x1+y0+y1+alpha*d)*beta,0.,0.,1.); }`;
const SUBPRESSURE = `precision highp float; uniform sampler2D pressure; uniform sampler2D velocity; uniform vec2 px; uniform float scale; varying vec2 vUv; void main(){ float x0=texture2D(pressure,vUv-vec2(px.x,0.)).r; float x1=texture2D(pressure,vUv+vec2(px.x,0.)).r; float y0=texture2D(pressure,vUv-vec2(0.,px.y)).r; float y1=texture2D(pressure,vUv+vec2(0.,px.y)).r; vec2 vel=texture2D(velocity,vUv).xy; gl_FragColor=vec4((vel-vec2(x1-x0,y1-y0)*.5)*scale,0.,1.); }`;
const SPLAT = `precision highp float; uniform sampler2D source; uniform vec3 color; uniform vec2 center; uniform vec2 scale; varying vec2 vUv; void main(){ vec3 s=texture2D(source,vUv).rgb; float d=length((vUv-center)/scale); float f=max(0.,1.-d);f=f*f*f; gl_FragColor=vec4(s+color*f,1.); }`;
const ADVECT_DYE = `precision highp float; uniform sampler2D velocity; uniform sampler2D source; uniform vec2 px; uniform float dt; uniform float dissipation; varying vec2 vUv; void main(){ vec2 vel=texture2D(velocity,vUv).xy; vec2 pos=vUv-vel*px*dt; gl_FragColor=vec4(texture2D(source,pos).rgb*dissipation,1.); }`;
const DISPLAY = `precision highp float; uniform sampler2D dye; uniform sampler2D velocity; uniform vec2 px; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; varying vec2 vUv; void main(){ vec3 dc=vec3(0.),dh=vec3(0.); vec2 v=vec2(0.); float sc=0.,sh=0.; for(float x=-2.;x<=2.;x+=1.){ for(float y=-2.;y<=2.;y+=1.){ float wc=1.-length(vec2(x,y))*.10; float wh=1.-length(vec2(x,y))*.06; dc+=texture2D(dye,vUv+vec2(x,y)*px*3.5).rgb*wc; sc+=wc; dh+=texture2D(dye,vUv+vec2(x,y)*px*9.0).rgb*wh; sh+=wh; v+=texture2D(velocity,vUv+vec2(x,y)*px*3.5).xy*wc; }} dc/=sc; dh/=sh; v/=sc; vec3 d=dc*0.72+dh*0.28; vec3 col=d.r*uC1+d.g*uC2+d.b*uC3; col+=mix(uC1,uC3,0.5)*length(v)*0.10; float conc=(d.r+d.g+d.b)*0.33; vec3 warmW=vec3(0.93,0.91,0.82); col=mix(col,warmW,smoothstep(0.10,0.38,conc)*0.42); float lum=max(col.r,max(col.g,col.b)); if(lum>0.80) col*=0.80/lum; float total=dc.r+dc.g+dc.b; float alpha=sqrt(smoothstep(0.0,0.30,total))*0.68; gl_FragColor=vec4(col,alpha); }`;

const FLUID_CFG: FluidConfig = { iterations: 50, cursorSize: 160, mouseForce: 2.0, resolution: 0.5, dyeDissipation: 0.991, velocityDissipation: 0.987, c1: [0.19, 0.50, 1.00], c2: [0.00, 0.82, 0.58], c3: [0.67, 0.29, 1.00] };

function mkRT(w: number, h: number, type: THREE.TextureDataType): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping });
}

function setupFluid(shared: SharedState): { resize: () => void; cleanup: () => void } | null {
  const canvas = document.getElementById('blob-canvas') as HTMLCanvasElement | null;
  if (!canvas) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: false });
  renderer.autoClear = false; renderer.setPixelRatio(1); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setClearColor(0x000000, 0);
  let W = Math.floor(window.innerWidth * FLUID_CFG.resolution); let H = Math.floor(window.innerHeight * FLUID_CFG.resolution);
  const px = new THREE.Vector2(1 / W, 1 / H);
  const textureType: THREE.TextureDataType = (renderer.capabilities.isWebGL2 || renderer.extensions.has('OES_texture_half_float')) ? THREE.HalfFloatType : (renderer.capabilities.isWebGL2 || renderer.extensions.has('OES_texture_float')) ? THREE.FloatType : THREE.UnsignedByteType;
  let vFBO0 = mkRT(W,H,textureType), vFBO1 = mkRT(W,H,textureType), pFBO0 = mkRT(W,H,textureType), pFBO1 = mkRT(W,H,textureType), dFBO0 = mkRT(W,H,textureType), dFBO1 = mkRT(W,H,textureType), divFBO = mkRT(W,H,textureType);
  const mAdvect = new THREE.ShaderMaterial({ uniforms: { velocity:{value:null}, source:{value:null}, px:{value:px}, dt:{value:1/60}, scale:{value:1}, time:{value:0} }, vertexShader:VS, fragmentShader:ADVECT });
  const mForce  = new THREE.ShaderMaterial({ uniforms: { velocity:{value:null}, force:{value:new THREE.Vector2()}, center:{value:new THREE.Vector2(0.5,0.5)}, scale:{value:new THREE.Vector2(0.1,0.1)}, px:{value:px} }, vertexShader:VS, fragmentShader:ADDFORCE });
  const mDiv    = new THREE.ShaderMaterial({ uniforms: { velocity:{value:null}, px:{value:px} }, vertexShader:VS, fragmentShader:DIVERGENCE });
  const mJacobi = new THREE.ShaderMaterial({ uniforms: { pressure:{value:null}, divergence:{value:null}, alpha:{value:-1}, beta:{value:0.25}, px:{value:px} }, vertexShader:VS, fragmentShader:JACOBI });
  const mSubP   = new THREE.ShaderMaterial({ uniforms: { pressure:{value:null}, velocity:{value:null}, px:{value:px}, scale:{value:1} }, vertexShader:VS, fragmentShader:SUBPRESSURE });
  const mSplat  = new THREE.ShaderMaterial({ uniforms: { source:{value:null}, color:{value:new THREE.Vector3(1,0,0)}, center:{value:new THREE.Vector2(0.5,0.5)}, scale:{value:new THREE.Vector2(0.1,0.1)} }, vertexShader:VS, fragmentShader:SPLAT });
  const mAdvDye = new THREE.ShaderMaterial({ uniforms: { velocity:{value:null}, source:{value:null}, px:{value:px}, dt:{value:1/60}, dissipation:{value:FLUID_CFG.dyeDissipation} }, vertexShader:VS, fragmentShader:ADVECT_DYE });
  const mDisplay= new THREE.ShaderMaterial({ uniforms: { dye:{value:null}, velocity:{value:null}, px:{value:px}, uC1:{value:new THREE.Vector3(...FLUID_CFG.c1)}, uC2:{value:new THREE.Vector3(...FLUID_CFG.c2)}, uC3:{value:new THREE.Vector3(...FLUID_CFG.c3)} }, vertexShader:VS, fragmentShader:DISPLAY, transparent:true });
  const camera = new THREE.Camera(); const scene = new THREE.Scene(); const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), mAdvect); scene.add(mesh);
  const swapV = () => { [vFBO0,vFBO1]=[vFBO1,vFBO0]; }; const swapP = () => { [pFBO0,pFBO1]=[pFBO1,pFBO0]; }; const swapD = () => { [dFBO0,dFBO1]=[dFBO1,dFBO0]; };
  const lerpC = (a:RGB,b:RGB,t:number):RGB => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  function splatDye(cx:number,cy:number,cr:RGB,intensity:number){ mesh.material=mSplat; mSplat.uniforms.source.value=dFBO0.texture; mSplat.uniforms.color.value.set(cr[0]*intensity,cr[1]*intensity,cr[2]*intensity); mSplat.uniforms.center.value.set(cx,cy); mSplat.uniforms.scale.value.set(FLUID_CFG.cursorSize*px.x*0.7,FLUID_CFG.cursorSize*px.y*0.7); renderer.setRenderTarget(dFBO1); renderer.render(scene,camera); swapD(); }
  function addForce(cx:number,cy:number,fx:number,fy:number,rm=1){ mesh.material=mForce; mForce.uniforms.velocity.value=vFBO0.texture; mForce.uniforms.force.value.set(fx,fy); mForce.uniforms.center.value.set(cx,cy); mForce.uniforms.scale.value.set(FLUID_CFG.cursorSize*rm*px.x,FLUID_CFG.cursorSize*rm*px.y); renderer.setRenderTarget(vFBO1); renderer.render(scene,camera); swapV(); }
  const seeds=[{x:W*0.20,y:H*0.75,c:FLUID_CFG.c1},{x:W*0.78,y:H*0.25,c:FLUID_CFG.c3},{x:W*0.50,y:H*0.50,c:FLUID_CFG.c2},{x:W*0.35,y:H*0.35,c:FLUID_CFG.c1},{x:W*0.65,y:H*0.68,c:FLUID_CFG.c3}];
  seeds.forEach(s=>{ mesh.material=mSplat; mSplat.uniforms.source.value=dFBO0.texture; mSplat.uniforms.center.value.set(s.x*px.x,s.y*px.y); mSplat.uniforms.scale.value.set(FLUID_CFG.cursorSize*3*px.x,FLUID_CFG.cursorSize*3*px.y*(W/H)); mSplat.uniforms.color.value.set(s.c[0]*0.20,s.c[1]*0.20,s.c[2]*0.20); renderer.setRenderTarget(dFBO1); renderer.render(scene,camera); swapD(); });
  let mX=0,mY=0,pmX=0,pmY=0; const spotlight = document.getElementById('spotlight') as HTMLDivElement|null; let spRawX=window.innerWidth*0.5,spRawY=window.innerHeight*0.5,spX=spRawX,spY=spRawY;
  const onPointerMove=(e:PointerEvent)=>{ pmX=mX;pmY=mY; mX=e.clientX*FLUID_CFG.resolution; mY=(window.innerHeight-e.clientY)*FLUID_CFG.resolution; spRawX=e.clientX; spRawY=e.clientY; };
  const onPointerDown=(e:PointerEvent)=>{ mX=pmX=e.clientX*FLUID_CFG.resolution; mY=pmY=(window.innerHeight-e.clientY)*FLUID_CFG.resolution; spRawX=e.clientX; spRawY=e.clientY; };
  window.addEventListener('pointermove',onPointerMove); window.addEventListener('pointerdown',onPointerDown);
  let colorPhase=0;
  function cycleColor(dt:number):RGB{ colorPhase=(colorPhase+dt*0.18)%1; const t=colorPhase; if(t<0.33) return lerpC(FLUID_CFG.c1,FLUID_CFG.c2,t/0.33); if(t<0.66) return lerpC(FLUID_CFG.c2,FLUID_CFG.c3,(t-0.33)/0.33); return lerpC(FLUID_CFG.c3,FLUID_CFG.c1,(t-0.66)/0.34); }
  const DT=1/60; let lastTime=performance.now();
  const GHOSTS:GhostConfig[]=[{ax:0.38,ay:0.30,fx:0.10,fy:0.14,ph:0,cr:FLUID_CFG.c1,ca:FLUID_CFG.c3,ci:0.09},{ax:0.30,ay:0.36,fx:0.08,fy:0.11,ph:Math.PI,cr:FLUID_CFG.c2,ca:FLUID_CFG.c1,ci:0.07},{ax:0.28,ay:0.28,fx:0.06,fy:0.09,ph:Math.PI*0.5,cr:FLUID_CFG.c3,ca:FLUID_CFG.c2,ci:0.08},{ax:0.22,ay:0.32,fx:0.05,fy:0.07,ph:Math.PI*1.5,cr:FLUID_CFG.c1,ca:FLUID_CFG.c2,ci:0.06}];
  const BIRTH_POSITIONS:Array<[number,number]>=[[0.18,0.78],[0.82,0.22],[0.50,0.52],[0.68,0.72],[0.30,0.30],[0.75,0.58],[0.42,0.18],[0.62,0.42]];
  let fluidRafId: number;
  (function tick():void{
    fluidRafId=requestAnimationFrame(tick); const now=performance.now(); const elapsed=Math.min((now-lastTime)/1000,0.05); lastTime=now; const t=now*0.001;
    mesh.material=mAdvect; mAdvect.uniforms.velocity.value=vFBO0.texture; mAdvect.uniforms.source.value=vFBO0.texture; mAdvect.uniforms.dt.value=DT; mAdvect.uniforms.scale.value=FLUID_CFG.velocityDissipation; mAdvect.uniforms.time.value=t; renderer.setRenderTarget(vFBO1); renderer.render(scene,camera); swapV();
    const dx=mX-pmX,dy=mY-pmY; if(Math.abs(dx)>0.1||Math.abs(dy)>0.1){ addForce(mX*px.x,mY*px.y,dx*px.x*FLUID_CFG.cursorSize*0.38,dy*px.y*FLUID_CFG.cursorSize*0.38,0.35); splatDye(mX*px.x,mY*px.y,cycleColor(elapsed*3),0.12); pmX=mX;pmY=mY; } else { pmX=mX;pmY=mY; }
    GHOSTS.forEach(g=>{ const gx=(0.5+Math.cos(t*g.fx+g.ph)*g.ax)*W; const gy=(0.5+Math.sin(t*g.fy+g.ph)*g.ay)*H; addForce(gx*px.x,gy*px.y,-Math.sin(t*g.fx+g.ph)*g.ax*g.fx*3,Math.cos(t*g.fy+g.ph)*g.ay*g.fy*3,2.4); splatDye(gx*px.x,gy*px.y,lerpC(g.cr,g.ca,(Math.sin(t*g.ci)+1)*0.5),0.07); });
    const bSlot=Math.floor(t/5.0)%BIRTH_POSITIONS.length; const bFrac=(t%5.0)/5.0; if(bFrac<0.06){ const bp=BIRTH_POSITIONS[bSlot]; splatDye(bp[0],bp[1],lerpC(FLUID_CFG.c1,FLUID_CFG.c3,(bSlot%3)/2),Math.sin((bFrac/0.06)*Math.PI)*0.14); }
    mesh.material=mAdvDye; mAdvDye.uniforms.velocity.value=vFBO0.texture; mAdvDye.uniforms.source.value=dFBO0.texture; mAdvDye.uniforms.dissipation.value=FLUID_CFG.dyeDissipation; renderer.setRenderTarget(dFBO1); renderer.render(scene,camera); swapD();
    mesh.material=mDiv; mDiv.uniforms.velocity.value=vFBO0.texture; renderer.setRenderTarget(divFBO); renderer.render(scene,camera);
    mesh.material=mJacobi; for(let i=0;i<FLUID_CFG.iterations;i++){ mJacobi.uniforms.pressure.value=pFBO0.texture; mJacobi.uniforms.divergence.value=divFBO.texture; renderer.setRenderTarget(pFBO1); renderer.render(scene,camera); swapP(); }
    mesh.material=mSubP; mSubP.uniforms.pressure.value=pFBO0.texture; mSubP.uniforms.velocity.value=vFBO0.texture; renderer.setRenderTarget(vFBO1); renderer.render(scene,camera); swapV();
    mesh.material=mDisplay; mDisplay.uniforms.dye.value=dFBO0.texture; mDisplay.uniforms.velocity.value=vFBO0.texture; renderer.setRenderTarget(null); renderer.clear(); renderer.render(scene,camera);
    spX+=(spRawX-spX)*0.055; spY+=(spRawY-spY)*0.055;
    if(spotlight){ const isLight=document.body.classList.contains('light'); const inner=isLight?'rgba(60,110,200,0.065)':'rgba(29,78,216,0.15)'; spotlight.style.background=`radial-gradient(600px at ${spX}px ${spY}px, ${inner} 0%, transparent 80%)`; }
  })();
  shared.currentX=0;
  return {
    resize(){ W=Math.floor(window.innerWidth*FLUID_CFG.resolution); H=Math.floor(window.innerHeight*FLUID_CFG.resolution); renderer.setSize(window.innerWidth,window.innerHeight); px.set(1/W,1/H); const d=[vFBO0,vFBO1,pFBO0,pFBO1,dFBO0,dFBO1,divFBO]; vFBO0=mkRT(W,H,textureType);vFBO1=mkRT(W,H,textureType);pFBO0=mkRT(W,H,textureType);pFBO1=mkRT(W,H,textureType);dFBO0=mkRT(W,H,textureType);dFBO1=mkRT(W,H,textureType);divFBO=mkRT(W,H,textureType); d.forEach(r=>r.dispose()); },
    cleanup(){ cancelAnimationFrame(fluidRafId); window.removeEventListener('pointermove',onPointerMove); window.removeEventListener('pointerdown',onPointerDown); renderer.dispose(); }
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function SiteClient({ content }: { content: HomepageContent | null }) {
  const c = content;

  useEffect(() => {
    /* ── Cookie banner ── */
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAccept = document.getElementById('cookie-accept') as HTMLButtonElement | null;
    if (cookieBanner && !localStorage.getItem('plasive_cookie')) {
      setTimeout(() => cookieBanner.classList.remove('hidden'), 1200);
      cookieAccept?.addEventListener('click', () => { localStorage.setItem('plasive_cookie','1'); cookieBanner.classList.add('hidden'); });
    }

    const shared: SharedState = { currentX: 0 };
    let fluidHandle: { resize: () => void; cleanup: () => void } | null = null;
    try { fluidHandle = setupFluid(shared); } catch { /* WebGL unavailable */ }

    const container      = document.getElementById('container') as HTMLElement;
    const scroller       = document.getElementById('scroller') as HTMLElement;
    const bookmarksEl    = document.querySelectorAll<HTMLElement>('.bookmark');
    const summaryOverlay = document.getElementById('summary-overlay') as HTMLElement;
    const summaryToggle  = document.getElementById('summary-toggle') as HTMLButtonElement;
    const summaryClose   = document.getElementById('summary-close') as HTMLButtonElement;
    const summaryLinks   = document.querySelectorAll<HTMLAnchorElement>('.so-link');
    const themeToggle    = document.getElementById('theme-toggle') as HTMLButtonElement;

    const SECTIONS=5, LERP=0.082;
    let targetX=0, currentX=0, activeIdx=0;
    let scrollRafId: number|null=null, snapTimer: ReturnType<typeof setTimeout>|null=null;
    let touchActive=false, touchPrevX=0, touchPrevY=0, touchTime=0, touchVel=0;
    let isVertical=false, targetY=0, currentY=0;

    const progressLine = document.createElement('div'); progressLine.className='progress-line'; document.body.appendChild(progressLine);

    const pageSize  = () => isVertical ? window.innerHeight : window.innerWidth;
    const maxScroll = () => (SECTIONS-1)*pageSize();
    const lerp      = (a:number,b:number,t:number) => a+(b-a)*t;
    const clamp     = (v:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,v));

    function setTransform(val:number){ scroller.style.transform=isVertical?`translateY(${-val}px)`:`translateX(${-val}px)`; }
    function updateProgress(val:number){ const max=maxScroll(); progressLine.style.transform=`scaleX(${max>0?val/max:0})`; }
    function updateBookmarks(idx:number){ activeIdx=Math.max(0,Math.min(SECTIONS-1,idx)); bookmarksEl.forEach((bm,i)=>{ bm.classList.remove('active','visited'); if(i===activeIdx) bm.classList.add('active'); else if(i<activeIdx) bm.classList.add('visited'); }); }

    function animate(){ if(isVertical){ currentY=lerp(currentY,targetY,LERP); shared.currentX=currentY; setTransform(currentY); updateProgress(currentY); const n=Math.round(currentY/window.innerHeight); if(n!==activeIdx) updateBookmarks(n); if(Math.abs(targetY-currentY)<0.18){currentY=targetY;setTransform(currentY);updateProgress(currentY);scrollRafId=null;return;} } else { currentX=lerp(currentX,targetX,LERP); shared.currentX=currentX; setTransform(currentX); updateProgress(currentX); const n=Math.round(currentX/window.innerWidth); if(n!==activeIdx) updateBookmarks(n); if(Math.abs(targetX-currentX)<0.18){currentX=targetX;setTransform(currentX);updateProgress(currentX);scrollRafId=null;return;} } scrollRafId=requestAnimationFrame(animate); }
    function startAnimate(){ if(!scrollRafId) scrollRafId=requestAnimationFrame(animate); }
    function goTo(idx:number){ const i=clamp(Math.round(idx),0,SECTIONS-1); if(isVertical) targetY=i*window.innerHeight; else targetX=i*window.innerWidth; updateBookmarks(i); startAnimate(); }
    function snapNearest(){ goTo(Math.round((isVertical?targetY:targetX)/pageSize())); }
    function scheduleSnap(){ if(snapTimer) clearTimeout(snapTimer); snapTimer=setTimeout(snapNearest,220); }

    const onWheel=(e:WheelEvent)=>{ e.preventDefault(); const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY; if(isVertical) targetY=clamp(targetY+delta,0,maxScroll()); else targetX=clamp(targetX+delta,0,maxScroll()); scheduleSnap(); startAnimate(); };
    const onTouchStart=(e:TouchEvent)=>{ touchActive=true; touchPrevX=e.touches[0].clientX; touchPrevY=e.touches[0].clientY; touchTime=Date.now(); touchVel=0; if(snapTimer) clearTimeout(snapTimer); };
    const onTouchMove=(e:TouchEvent)=>{ if(!touchActive) return; const now=Date.now(),dt=now-touchTime; if(isVertical){const y=e.touches[0].clientY,dy=touchPrevY-y; if(dt>0) touchVel=(dy/dt)*14; touchPrevY=y;touchTime=now; targetY=clamp(targetY+dy*1.6,0,maxScroll());} else {const x=e.touches[0].clientX,dx=touchPrevX-x; if(dt>0) touchVel=(dx/dt)*14; touchPrevX=x;touchTime=now; targetX=clamp(targetX+dx*1.6,0,maxScroll());} startAnimate(); };
    const onTouchEnd=()=>{ touchActive=false; if(Math.abs(touchVel)>0.4){ const coast=():void=>{ touchVel*=0.9; if(isVertical) targetY=clamp(targetY+touchVel,0,maxScroll()); else targetX=clamp(targetX+touchVel,0,maxScroll()); Math.abs(touchVel)>0.1?requestAnimationFrame(coast):snapNearest(); }; requestAnimationFrame(coast); } else snapNearest(); };
    const onKeyDown=(e:KeyboardEvent)=>{ if(summaryOverlay.classList.contains('open')){ if(e.key==='Escape') summaryOverlay.classList.remove('open'); return; } if(e.key==='ArrowRight'||e.key==='ArrowDown') goTo(activeIdx+1); if(e.key==='ArrowLeft'||e.key==='ArrowUp') goTo(activeIdx-1); };
    const onResize=()=>{ if(isVertical){currentY=activeIdx*window.innerHeight;targetY=currentY;shared.currentX=currentY;setTransform(currentY);}else{currentX=activeIdx*window.innerWidth;targetX=currentX;shared.currentX=currentX;setTransform(currentX);} fluidHandle?.resize(); };

    container.addEventListener('wheel',onWheel,{passive:false});
    container.addEventListener('touchstart',onTouchStart,{passive:true});
    container.addEventListener('touchmove',onTouchMove,{passive:true});
    container.addEventListener('touchend',onTouchEnd);
    document.addEventListener('keydown',onKeyDown);
    window.addEventListener('resize',onResize);

    bookmarksEl.forEach(bm=>{ bm.addEventListener('click',()=>goTo(parseInt(bm.dataset['idx']??'0',10))); });
    summaryToggle.addEventListener('click',()=>summaryOverlay.classList.add('open'));
    summaryClose.addEventListener('click',()=>summaryOverlay.classList.remove('open'));
    summaryLinks.forEach(link=>{ link.addEventListener('click',(e:Event)=>{ e.preventDefault(); summaryOverlay.classList.remove('open'); goTo(parseInt(link.dataset['target']??'0',10)); }); });
    themeToggle.addEventListener('click',()=>document.body.classList.toggle('light'));

    const layoutToggle=document.getElementById('layout-toggle') as HTMLButtonElement|null;
    if(layoutToggle){ layoutToggle.addEventListener('click',()=>{ isVertical=!isVertical; document.body.classList.toggle('scroll-v',isVertical); layoutToggle.classList.toggle('active',isVertical); layoutToggle.title=isVertical?'Switch to horizontal scroll':'Switch to vertical scroll'; (layoutToggle.querySelector('.layout-icon-v') as HTMLElement).style.display=isVertical?'none':'block'; (layoutToggle.querySelector('.layout-icon-h') as HTMLElement).style.display=isVertical?'block':'none'; currentX=isVertical?0:activeIdx*window.innerWidth; currentY=isVertical?activeIdx*window.innerHeight:0; targetX=currentX;targetY=currentY; setTransform(isVertical?currentY:currentX); }); }

    updateBookmarks(0); updateProgress(0);

    return () => {
      fluidHandle?.cleanup();
      if(scrollRafId) cancelAnimationFrame(scrollRafId);
      if(snapTimer) clearTimeout(snapTimer);
      container.removeEventListener('wheel',onWheel);
      container.removeEventListener('touchstart',onTouchStart);
      container.removeEventListener('touchmove',onTouchMove);
      container.removeEventListener('touchend',onTouchEnd);
      document.removeEventListener('keydown',onKeyDown);
      window.removeEventListener('resize',onResize);
      progressLine.remove();
    };
  }, []);

  return (
    <>
      <div id="spotlight" />
      <canvas id="blob-canvas" />
      <div id="grain" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noise-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves={8} stitchTiles="stitch"/>
            <feComponentTransfer><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-filter)" opacity="0.55"/>
        </svg>
      </div>

      <header className="site-header"><span className="logo">Plasive</span></header>

      <nav className="bookmarks" id="bookmarks">
        <div className="bookmark active" data-idx="0"><span className="bm-label">Home</span><span className="bm-num">01</span></div>
        <div className="bookmark" data-idx="1"><span className="bm-label">R&amp;D</span><span className="bm-num">02</span></div>
        <div className="bookmark" data-idx="2"><span className="bm-label">Mission</span><span className="bm-num">03</span></div>
        <div className="bookmark" data-idx="3"><span className="bm-label">Services</span><span className="bm-num">04</span></div>
        <div className="bookmark" data-idx="4"><span className="bm-label">Let&apos;s Talk</span><span className="bm-num">05</span></div>
      </nav>

      <div className="site-footer">
        <a href="/privacy" className="footer-link">Privacy</a>
        <span className="footer-divider" />
        <a href="mailto:info@plasive.tech" className="footer-link">Contact</a>
        <span className="footer-divider" />
        <button className="footer-link" id="summary-toggle">Summary</button>
        <span className="footer-divider" />
        <button className="footer-layout" id="layout-toggle" aria-label="Toggle scroll direction" title="Switch to vertical scroll">
          <svg className="layout-icon-v" width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0.6" y="0.6" width="5.8" height="10.8" rx="1.4" stroke="currentColor" strokeWidth="1.2"/><rect x="9.6" y="0.6" width="5.8" height="10.8" rx="1.4" stroke="currentColor" strokeWidth="1.2" opacity="0.35"/><path d="M7.5 6h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <svg className="layout-icon-h" width="12" height="16" viewBox="0 0 12 16" fill="none" style={{display:'none'}}><rect x="0.6" y="0.6" width="10.8" height="5.8" rx="1.4" stroke="currentColor" strokeWidth="1.2"/><rect x="0.6" y="9.6" width="10.8" height="5.8" rx="1.4" stroke="currentColor" strokeWidth="1.2" opacity="0.35"/><path d="M6 7.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
        <span className="footer-divider" />
        <button className="footer-theme" id="theme-toggle" aria-label="Toggle theme">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
      </div>

      <div className="summary-overlay" id="summary-overlay">
        <div className="so-header">
          <span className="logo so-logo">Plasive</span>
          <button className="so-close" id="summary-close">Close</button>
        </div>
        <nav className="so-nav">
          <a href="#" className="so-link" data-target="0">Home</a>
          <a href="#" className="so-link" data-target="1">Research &amp; Development</a>
          <a href="#" className="so-link" data-target="2">Our Mission</a>
          <a href="#" className="so-link" data-target="3">What We Do</a>
          <a href="#" className="so-link" data-target="4">Let&apos;s Talk</a>
        </nav>
        <div className="so-footer">
          <div className="so-tagline">{c?.companyName ?? 'Plasive Technologies S.r.l.'}</div>
          <div className="so-address">{c?.address ?? 'Via Cesare Battisti 26'}<br />{c?.city ?? '40123 Bologna, Italy'}</div>
          <div className="so-links">
            <a href={`mailto:${c?.email ?? 'info@plasive.tech'}`}>Contact</a>
            <a href={c?.linkedinUrl ?? 'https://www.linkedin.com/company/plasivetech'} target="_blank" rel="noopener">Linkedin</a>
          </div>
        </div>
      </div>

      <div className="container" id="container">
        <div className="scroller" id="scroller">

          {/* 01 HOME */}
          <section className="panel panel-home" data-idx="0">
            <div className="panel-content">
              <h1 className="home-h" id="home-title">{c?.homeTitle ?? 'Plasive Tech.'}</h1>
              <p className="home-p" id="home-subtitle">{c?.homeSubtitle ?? 'We craft technologies that helps you to safely play with data, discover insights, and do the right thing.'}</p>
              <div className="home-ctas">
                <a href="mailto:info@plasive.tech" className="cta-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.08 2.18 2 2 0 012.06 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  Book a call
                </a>
                <a href="#" className="cta-secondary">View industries →</a>
              </div>
            </div>
          </section>

          {/* 02 R&D */}
          <section className="panel panel-work" data-idx="1">
            <div className="panel-content">
              <p className="work-eyebrow" id="work-eyebrow">{c?.rdEyebrow ?? 'Research & Development'}</p>
              <h2 className="work-h" id="work-title">{c?.rdTitle ?? "From project management to analytics, we're shaping the future of data."}</h2>
              <p className="work-p" id="work-subtitle">{c?.rdSubtitle ?? 'Research and development for data-heavy, regulated environments. We design, build, and operate systems you can trust.'}</p>
            </div>
          </section>

          {/* 03 MISSION */}
          <section className="panel panel-mission" data-idx="2">
            <div className="panel-content">
              <div className="mission-row">
                <h2 className="mission-h" id="mission-title">
                  {c?.missionTitle ?? <>Build resilient,<br />privacy-first<br />data products.</>}
                </h2>
                <div className="mission-side">
                  <p className="mission-p" id="mission-subtitle">{c?.missionSubtitle ?? 'Governance, cloud architecture, and security engineering delivered with measurable outcomes.'}</p>
                  <ul className="industries" id="industries-list">
                    {(c?.industries ?? ['Agroforestry & Foodchain','Legal & Privacy','Healthcare & Digital Signature','Streaming & VOD']).map((ind, i) => (
                      <li key={i}>{ind}</li>
                    ))}
                  </ul>
                  <div className="mission-ctas">
                    <a href="mailto:info@plasive.tech" className="cta-primary">Book a call →</a>
                    <a href="#" className="cta-ghost">View industries</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 04 SERVICES */}
          <section className="panel panel-services" data-idx="3">
            <div className="panel-content">
              <p className="svc-eyebrow" id="svc-eyebrow">{c?.servicesEyebrow ?? 'Research & Development'}</p>
              <div className="svc-grid">
                {(c?.services ?? [
                  {_key:'analytics',title:'Data Analytics',description:'Harness the power of analysis to derive actionable insights from your data.'},
                  {_key:'cloud',title:'Cloud Architecture',description:'Planet scale, resilient, and efficient solutions built for the modern cloud ecosystem.'},
                  {_key:'security',title:'Enterprise-Grade Security',description:'OSCP state-of-the-art security measures to protect your most valuable assets.'},
                  {_key:'perf',title:'High-Performance Systems',description:'Optimized for speed and efficiency, our solutions deliver unparalleled performance.'},
                ]).map((svc, idx) => (
                  <div className="svc-item" data-svc-idx={idx} key={svc._key}>
                    <div className="svc-icon">
                      {idx===0 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M8 8h4M8 16h6"/><circle cx="17" cy="7" r="3"/></svg>}
                      {idx===1 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>}
                      {idx===2 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                      {idx===3 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                    </div>
                    <h3>{svc.title}</h3>
                    <p>{svc.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 05 CONTACT */}
          <section className="panel panel-contact" data-idx="4">
            <div className="panel-content">
              <div className="contact-main">
                <p className="contact-eyebrow" id="contact-eyebrow">{c?.contactEyebrow ?? "Let's Talk"}</p>
                <h2 className="contact-h" id="contact-title">{c?.contactTitle ?? 'Build resilient, privacy-first data products.'}</h2>
                <p className="contact-sub" id="contact-subtitle">
                  {c?.contactSubtitle ?? <>Governance, cloud architecture, and security engineering<br />delivered with measurable outcomes.</>}
                </p>
                <div className="contact-ctas">
                  <a href="mailto:info@plasive.tech" className="cta-primary">Book a call →</a>
                  <a href="#" className="cta-ghost">View industries</a>
                </div>
              </div>
              <div className="contact-info" id="contact-info">
                <div className="contact-info-item">
                  <span className="contact-info-label">Company</span>
                  <span className="contact-info-val" id="ci-company-name">{c?.companyName ?? 'Plasive Technologies S.r.l.'}</span>
                  <span className="contact-info-sub" id="ci-tax-id">{c?.taxId ?? 'TAX ID 03736701206'}</span>
                  <span className="contact-info-sub">© 2026</span>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-label">Address</span>
                  <span className="contact-info-val" id="ci-address">{c?.address ?? 'Via Cesare Battisti 26'}</span>
                  <span className="contact-info-sub" id="ci-city">{c?.city ?? '40123 Bologna, Italy'}</span>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-label">Contact</span>
                  <a href={`mailto:${c?.email ?? 'info@plasive.tech'}`} className="contact-info-val" id="ci-email">{c?.email ?? 'info@plasive.tech'}</a>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-label">Network</span>
                  <a href={c?.linkedinUrl ?? 'https://www.linkedin.com/company/plasivetech'} target="_blank" rel="noopener" className="contact-info-val" id="ci-linkedin">LinkedIn →</a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <div className="cookie-banner hidden" id="cookie-banner" role="alertdialog" aria-label="Cookie notice">
        <p className="cookie-text">Utilizziamo cookie tecnici essenziali per garantire il funzionamento del sito. <a href="/privacy">Privacy Policy</a></p>
        <button className="cookie-accept" id="cookie-accept">Accetta</button>
      </div>
    </>
  );
}
