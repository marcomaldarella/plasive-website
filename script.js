/* =====================================================================
   PLASIVE — Navier-Stokes fluid simulation + horizontal scroll
   Adapted from studio_talent WebGL background (Onira)
   ===================================================================== */

/* ═══════════════════════════════════════════════════════════════════════
   GLSL SHADERS
═══════════════════════════════════════════════════════════════════════ */

const VS = `
  varying vec2 vUv;
  void main(){
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* Velocity advection with organic noise perturbation */
const ADVECT = `
  precision highp float;
  uniform sampler2D velocity;
  uniform sampler2D source;
  uniform vec2 px;
  uniform float dt;
  uniform float scale;
  uniform float time;
  varying vec2 vUv;

  vec3 _m2(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec2 _m2v2(vec2 x){return x-floor(x*(1./289.))*289.;}
  vec3 _p(vec3 x){return _m2(((x*34.)+1.)*x);}
  float snoise2(vec2 v){
    const vec4 C=vec4(.211324865,.366025403,-.577350269,.024390243);
    vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
    vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=_m2v2(i);
    vec3 p=_p(_p(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m=m*m;m=m*m;
    vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;
    vec3 ox=floor(x+.5);vec3 a0=x-ox;
    m*=1.79284291-.85373472*(a0*a0+h*h);
    vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
  }

  void main(){
    vec2 vel = texture2D(velocity, vUv).xy;
    float n1 = snoise2(vUv * 2.8 + time * 0.08);
    float n2 = snoise2(vUv * 2.8 + 100. + time * 0.08);
    vec2 pos = vUv - vel * px * dt + vec2(n1, n2) * 0.0018;
    gl_FragColor = texture2D(source, pos) * scale;
  }
`;

const ADDFORCE = `
  precision highp float;
  uniform sampler2D velocity;
  uniform vec2 force;
  uniform vec2 center;
  uniform vec2 scale;
  uniform vec2 px;
  varying vec2 vUv;
  void main(){
    vec4 vel = texture2D(velocity, vUv);
    float d = length((vUv - center) / scale);
    float f = max(0., 1. - d); f = f*f*f;
    vel.xy += force * f;
    gl_FragColor = vel;
  }
`;

const DIVERGENCE = `
  precision highp float;
  uniform sampler2D velocity;
  uniform vec2 px;
  varying vec2 vUv;
  void main(){
    float x0=texture2D(velocity,vUv-vec2(px.x,0.)).x;
    float x1=texture2D(velocity,vUv+vec2(px.x,0.)).x;
    float y0=texture2D(velocity,vUv-vec2(0.,px.y)).y;
    float y1=texture2D(velocity,vUv+vec2(0.,px.y)).y;
    gl_FragColor=vec4((x1-x0+y1-y0)*.5,0.,0.,1.);
  }
`;

const JACOBI = `
  precision highp float;
  uniform sampler2D pressure;
  uniform sampler2D divergence;
  uniform float alpha;
  uniform float beta;
  uniform vec2 px;
  varying vec2 vUv;
  void main(){
    float x0=texture2D(pressure,vUv-vec2(px.x,0.)).r;
    float x1=texture2D(pressure,vUv+vec2(px.x,0.)).r;
    float y0=texture2D(pressure,vUv-vec2(0.,px.y)).r;
    float y1=texture2D(pressure,vUv+vec2(0.,px.y)).r;
    float d=texture2D(divergence,vUv).r;
    gl_FragColor=vec4((x0+x1+y0+y1+alpha*d)*beta,0.,0.,1.);
  }
`;

const SUBPRESSURE = `
  precision highp float;
  uniform sampler2D pressure;
  uniform sampler2D velocity;
  uniform vec2 px;
  uniform float scale;
  varying vec2 vUv;
  void main(){
    float x0=texture2D(pressure,vUv-vec2(px.x,0.)).r;
    float x1=texture2D(pressure,vUv+vec2(px.x,0.)).r;
    float y0=texture2D(pressure,vUv-vec2(0.,px.y)).r;
    float y1=texture2D(pressure,vUv+vec2(0.,px.y)).r;
    vec2 vel=texture2D(velocity,vUv).xy;
    gl_FragColor=vec4((vel-vec2(x1-x0,y1-y0)*.5)*scale,0.,1.);
  }
`;

const SPLAT = `
  precision highp float;
  uniform sampler2D source;
  uniform vec3 color;
  uniform vec2 center;
  uniform vec2 scale;
  varying vec2 vUv;
  void main(){
    vec3 s=texture2D(source,vUv).rgb;
    float d=length((vUv-center)/scale);
    float f=max(0.,1.-d);f=f*f*f;
    gl_FragColor=vec4(s+color*f,1.);
  }
`;

const ADVECT_DYE = `
  precision highp float;
  uniform sampler2D velocity;
  uniform sampler2D source;
  uniform vec2 px;
  uniform float dt;
  uniform float dissipation;
  varying vec2 vUv;
  void main(){
    vec2 vel=texture2D(velocity,vUv).xy;
    vec2 pos=vUv-vel*px*dt;
    gl_FragColor=vec4(texture2D(source,pos).rgb*dissipation,1.);
  }
`;

/* Display: puffy cloud — wide blur + sqrt-alpha for soft cumulus edges */
const DISPLAY = `
  precision highp float;
  uniform sampler2D dye;
  uniform sampler2D velocity;
  uniform vec2 px;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  varying vec2 vUv;

  void main(){
    /* Two-pass accumulation: tight core + wide halo */
    vec3 dc=vec3(0.),dh=vec3(0.);
    vec2 v=vec2(0.); float sc=0.,sh=0.;
    for(float x=-2.;x<=2.;x+=1.){
      for(float y=-2.;y<=2.;y+=1.){
        float wc=1.-length(vec2(x,y))*.10;
        float wh=1.-length(vec2(x,y))*.06;
        dc+=texture2D(dye,     vUv+vec2(x,y)*px*3.5).rgb*wc; sc+=wc;
        dh+=texture2D(dye,     vUv+vec2(x,y)*px*9.0).rgb*wh; sh+=wh;
        v +=texture2D(velocity,vUv+vec2(x,y)*px*3.5).xy *wc;
      }
    }
    dc/=sc; dh/=sh; v/=sc;

    /* Blend core with a lighter halo — keep dark bg visible */
    vec3 d = dc * 0.72 + dh * 0.28;

    /* Palette mapping */
    vec3 col = d.r * uC1 + d.g * uC2 + d.b * uC3;

    /* Minimal velocity shimmer */
    col += mix(uC1, uC3, 0.5) * length(v) * 0.10;

    /* Warm-light brightening in dense areas — creamy core */
    float conc = (d.r + d.g + d.b) * 0.33;
    vec3 warmW = vec3(0.93, 0.91, 0.82);
    col = mix(col, warmW, smoothstep(0.10, 0.38, conc) * 0.42);

    /* Brightness cap — keep vivid but not blown out */
    float lum = max(col.r, max(col.g, col.b));
    if(lum > 0.80) col *= 0.80 / lum;

    /* sqrt alpha: only appear where dye is meaningfully concentrated */
    float total = dc.r + dc.g + dc.b;
    float alpha = sqrt(smoothstep(0.0, 0.30, total)) * 0.68;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════
   FLUID RENDERER
═══════════════════════════════════════════════════════════════════════ */

const FLUID_CFG = {
  iterations:           50,
  cursorSize:           160,         /* tighter clouds, dark bg shows through */
  mouseForce:           2.0,
  resolution:           0.5,
  dyeDissipation:       0.991,       /* fade faster so bg stays visible      */
  velocityDissipation:  0.987,
  c1: [0.19, 0.50, 1.00],            /* deep blue  #3080ff  */
  c2: [0.00, 0.82, 0.58],            /* teal       #00d294  */
  c3: [0.67, 0.29, 1.00],            /* purple     #ac4bff  */
};

function mkRT(w, h, type) {
  return new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
}

function setupFluid(shared) {
  if (typeof THREE === 'undefined') return null;

  const canvas = document.getElementById('blob-canvas');
  if (!canvas) return null;

  /* ── Renderer ─────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    premultipliedAlpha: false,
  });
  renderer.autoClear = false;
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  /* ── Simulation resolution ────────────────────────────────────── */
  let W = Math.floor(window.innerWidth  * FLUID_CFG.resolution);
  let H = Math.floor(window.innerHeight * FLUID_CFG.resolution);
  const px = new THREE.Vector2(1 / W, 1 / H);

  /* ── Texture type (half-float preferred) ─────────────────────── */
  const textureType = (renderer.capabilities.isWebGL2 || renderer.extensions.has('OES_texture_half_float'))
    ? THREE.HalfFloatType
    : (renderer.capabilities.isWebGL2 || renderer.extensions.has('OES_texture_float'))
      ? THREE.FloatType
      : THREE.UnsignedByteType;

  /* ── FBOs ─────────────────────────────────────────────────────── */
  let vFBO0 = mkRT(W, H, textureType), vFBO1 = mkRT(W, H, textureType);
  let pFBO0 = mkRT(W, H, textureType), pFBO1 = mkRT(W, H, textureType);
  let dFBO0 = mkRT(W, H, textureType), dFBO1 = mkRT(W, H, textureType);
  let divFBO = mkRT(W, H, textureType);

  /* ── Materials ────────────────────────────────────────────────── */
  const mAdvect = new THREE.ShaderMaterial({
    uniforms: { velocity:{value:null}, source:{value:null}, px:{value:px}, dt:{value:1/60}, scale:{value:1}, time:{value:0} },
    vertexShader: VS, fragmentShader: ADVECT,
  });
  const mForce = new THREE.ShaderMaterial({
    uniforms: { velocity:{value:null}, force:{value:new THREE.Vector2()}, center:{value:new THREE.Vector2(.5,.5)}, scale:{value:new THREE.Vector2(.1,.1)}, px:{value:px} },
    vertexShader: VS, fragmentShader: ADDFORCE,
  });
  const mDiv = new THREE.ShaderMaterial({
    uniforms: { velocity:{value:null}, px:{value:px} },
    vertexShader: VS, fragmentShader: DIVERGENCE,
  });
  const mJacobi = new THREE.ShaderMaterial({
    uniforms: { pressure:{value:null}, divergence:{value:null}, alpha:{value:-1}, beta:{value:.25}, px:{value:px} },
    vertexShader: VS, fragmentShader: JACOBI,
  });
  const mSubP = new THREE.ShaderMaterial({
    uniforms: { pressure:{value:null}, velocity:{value:null}, px:{value:px}, scale:{value:1} },
    vertexShader: VS, fragmentShader: SUBPRESSURE,
  });
  const mSplat = new THREE.ShaderMaterial({
    uniforms: { source:{value:null}, color:{value:new THREE.Vector3(1,0,0)}, center:{value:new THREE.Vector2(.5,.5)}, scale:{value:new THREE.Vector2(.1,.1)} },
    vertexShader: VS, fragmentShader: SPLAT,
  });
  const mAdvDye = new THREE.ShaderMaterial({
    uniforms: { velocity:{value:null}, source:{value:null}, px:{value:px}, dt:{value:1/60}, dissipation:{value:FLUID_CFG.dyeDissipation} },
    vertexShader: VS, fragmentShader: ADVECT_DYE,
  });
  const mDisplay = new THREE.ShaderMaterial({
    uniforms: {
      dye:{value:null}, velocity:{value:null}, px:{value:px},
      uC1:{ value: new THREE.Vector3(...FLUID_CFG.c1) },
      uC2:{ value: new THREE.Vector3(...FLUID_CFG.c2) },
      uC3:{ value: new THREE.Vector3(...FLUID_CFG.c3) },
    },
    vertexShader: VS, fragmentShader: DISPLAY,
    transparent: true,
  });

  /* ── Scene ────────────────────────────────────────────────────── */
  const camera = new THREE.Camera();
  const scene  = new THREE.Scene();
  const mesh   = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mAdvect);
  scene.add(mesh);

  /* ── Swap helpers ─────────────────────────────────────────────── */
  const swapV = () => { [vFBO0, vFBO1] = [vFBO1, vFBO0]; };
  const swapP = () => { [pFBO0, pFBO1] = [pFBO1, pFBO0]; };
  const swapD = () => { [dFBO0, dFBO1] = [dFBO1, dFBO0]; };

  /* ── Splat helper ─────────────────────────────────────────────── */
  function splatDye(cx, cy, cr, intensity) {
    mesh.material = mSplat;
    mSplat.uniforms.source.value = dFBO0.texture;
    mSplat.uniforms.color.value.set(cr[0] * intensity, cr[1] * intensity, cr[2] * intensity);
    mSplat.uniforms.center.value.set(cx, cy);
    mSplat.uniforms.scale.value.set(FLUID_CFG.cursorSize * px.x * .7, FLUID_CFG.cursorSize * px.y * .7);
    renderer.setRenderTarget(dFBO1);
    renderer.render(scene, camera);
    swapD();
  }

  function addForce(cx, cy, fx, fy, radiusMult = 1) {
    mesh.material = mForce;
    mForce.uniforms.velocity.value = vFBO0.texture;
    mForce.uniforms.force.value.set(fx, fy);
    mForce.uniforms.center.value.set(cx, cy);
    mForce.uniforms.scale.value.set(FLUID_CFG.cursorSize * radiusMult * px.x, FLUID_CFG.cursorSize * radiusMult * px.y);
    renderer.setRenderTarget(vFBO1);
    renderer.render(scene, camera);
    swapV();
  }

  /* ── Initial warm-up splats ───────────────────────────────────── */
  function initialSplats() {
    const cr = FLUID_CFG.cursorSize * 3.0;   /* moderate seed clouds */
    [
      { x: W * .20, y: H * .75, c: FLUID_CFG.c1 },
      { x: W * .78, y: H * .25, c: FLUID_CFG.c3 },
      { x: W * .50, y: H * .50, c: FLUID_CFG.c2 },
      { x: W * .35, y: H * .35, c: FLUID_CFG.c1 },
      { x: W * .65, y: H * .68, c: FLUID_CFG.c3 },
    ].forEach(s => {
      mesh.material = mSplat;
      mSplat.uniforms.source.value = dFBO0.texture;
      mSplat.uniforms.center.value.set(s.x * px.x, s.y * px.y);
      mSplat.uniforms.scale.value.set(cr * px.x, cr * px.y * (W / H));
      mSplat.uniforms.color.value.set(s.c[0] * .20, s.c[1] * .20, s.c[2] * .20);
      renderer.setRenderTarget(dFBO1);
      renderer.render(scene, camera);
      swapD();
    });
  }

  /* Seed fluid with warm-up splats immediately */
  initialSplats();

  /* ── Mouse state ──────────────────────────────────────────────── */
  let mX = 0, mY = 0, pmX = 0, pmY = 0;

  /* ── Spotlight glow ───────────────────────────────────────────── */
  const spotlight = document.getElementById('spotlight');
  let spRawX = window.innerWidth  * 0.5;
  let spRawY = window.innerHeight * 0.5;
  let spX    = spRawX, spY = spRawY;

  window.addEventListener('pointermove', e => {
    pmX = mX; pmY = mY;
    mX = e.clientX * FLUID_CFG.resolution;
    mY = (window.innerHeight - e.clientY) * FLUID_CFG.resolution;
    spRawX = e.clientX;
    spRawY = e.clientY;
  });
  window.addEventListener('pointerdown', e => {
    mX = pmX = e.clientX * FLUID_CFG.resolution;
    mY = pmY = (window.innerHeight - e.clientY) * FLUID_CFG.resolution;
    spRawX = e.clientX;
    spRawY = e.clientY;
  });

  /* ── Autonomous animation state ───────────────────────────────── */
  let colorPhase = 0;
  function cycleColor(dt) {
    colorPhase = (colorPhase + dt * .18) % 1;
    const t = colorPhase;
    if (t < .33) return lerpC(FLUID_CFG.c1, FLUID_CFG.c2, t / .33);
    if (t < .66) return lerpC(FLUID_CFG.c2, FLUID_CFG.c3, (t - .33) / .33);
    return lerpC(FLUID_CFG.c3, FLUID_CFG.c1, (t - .66) / .34);
  }
  function lerpC(a, b, t) { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }

  /* ── Animation loop ───────────────────────────────────────────── */
  const dt = 1 / 60;
  let lastTime = performance.now();

  (function tick() {
    requestAnimationFrame(tick);
    const now = performance.now();
    const elapsed = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;
    const t = now * .001;

    /* 1 — Advect velocity */
    mesh.material = mAdvect;
    mAdvect.uniforms.velocity.value = vFBO0.texture;
    mAdvect.uniforms.source.value   = vFBO0.texture;
    mAdvect.uniforms.dt.value    = dt;
    mAdvect.uniforms.scale.value = FLUID_CFG.velocityDissipation;
    mAdvect.uniforms.time.value  = t;
    renderer.setRenderTarget(vFBO1);
    renderer.render(scene, camera);
    swapV();

    /* 2 — Mouse force + dye (very light touch — just a whisper) */
    const dx = mX - pmX, dy = mY - pmY;
    if (Math.abs(dx) > .1 || Math.abs(dy) > .1) {
      addForce(mX * px.x, mY * px.y,
        dx * px.x * FLUID_CFG.cursorSize * 0.38,
        dy * px.y * FLUID_CFG.cursorSize * 0.38,
        0.35);                                /* small radius */
      const col = cycleColor(elapsed * 3);
      splatDye(mX * px.x, mY * px.y, col, .12);  /* very light dye */
      pmX = mX; pmY = mY;
    } else {
      pmX = mX; pmY = mY;
    }

    /* 3 — Four slow cloud generators (Lissajous orbits) */
    const ghosts = [
      { ax:.38, ay:.30, fx:.10, fy:.14, ph:0,        cr:FLUID_CFG.c1, ca:FLUID_CFG.c3, ci:.09 },
      { ax:.30, ay:.36, fx:.08, fy:.11, ph:Math.PI,  cr:FLUID_CFG.c2, ca:FLUID_CFG.c1, ci:.07 },
      { ax:.28, ay:.28, fx:.06, fy:.09, ph:Math.PI*.5, cr:FLUID_CFG.c3, ca:FLUID_CFG.c2, ci:.08 },
      { ax:.22, ay:.32, fx:.05, fy:.07, ph:Math.PI*1.5,cr:FLUID_CFG.c1, ca:FLUID_CFG.c2, ci:.06 },
    ];

    ghosts.forEach(g => {
      const gx = (.5 + Math.cos(t * g.fx + g.ph) * g.ax) * W;
      const gy = (.5 + Math.sin(t * g.fy + g.ph) * g.ay) * H;
      const gdx = -Math.sin(t * g.fx + g.ph) * g.ax * g.fx;
      const gdy =  Math.cos(t * g.fy + g.ph) * g.ay * g.fy;
      addForce(gx * px.x, gy * px.y, gdx * 3.0, gdy * 3.0, 2.4);
      splatDye(gx * px.x, gy * px.y, lerpC(g.cr, g.ca, (Math.sin(t * g.ci) + 1) * .5), .07);
    });

    /* 3b — Periodic cloud birth: large autonomous splat every ~5 s */
    const BIRTH_POSITIONS = [
      [.18,.78], [.82,.22], [.50,.52], [.68,.72],
      [.30,.30], [.75,.58], [.42,.18], [.62,.42],
    ];
    const birthSlot = Math.floor(t / 5.0) % BIRTH_POSITIONS.length;
    const birthFrac = (t % 5.0) / 5.0;
    if (birthFrac < 0.06) {           /* inject for first 6% of each 5s window */
      const bp = BIRTH_POSITIONS[birthSlot];
      const birthIntensity = Math.sin(birthFrac / 0.06 * Math.PI) * 0.14;
      const birthColor = lerpC(FLUID_CFG.c1, FLUID_CFG.c3, (birthSlot % 3) / 2);
      splatDye(bp[0], bp[1], birthColor, birthIntensity);
    }

    /* 4 — Advect dye */
    mesh.material = mAdvDye;
    mAdvDye.uniforms.velocity.value    = vFBO0.texture;
    mAdvDye.uniforms.source.value      = dFBO0.texture;
    mAdvDye.uniforms.dissipation.value = FLUID_CFG.dyeDissipation;
    renderer.setRenderTarget(dFBO1);
    renderer.render(scene, camera);
    swapD();

    /* 5 — Divergence */
    mesh.material = mDiv;
    mDiv.uniforms.velocity.value = vFBO0.texture;
    renderer.setRenderTarget(divFBO);
    renderer.render(scene, camera);

    /* 6 — Jacobi pressure */
    mesh.material = mJacobi;
    for (let i = 0; i < FLUID_CFG.iterations; i++) {
      mJacobi.uniforms.pressure.value   = pFBO0.texture;
      mJacobi.uniforms.divergence.value = divFBO.texture;
      renderer.setRenderTarget(pFBO1);
      renderer.render(scene, camera);
      swapP();
    }

    /* 7 — Subtract pressure gradient */
    mesh.material = mSubP;
    mSubP.uniforms.pressure.value = pFBO0.texture;
    mSubP.uniforms.velocity.value = vFBO0.texture;
    renderer.setRenderTarget(vFBO1);
    renderer.render(scene, camera);
    swapV();

    /* 8 — Display to screen (transparent) */
    mesh.material = mDisplay;
    mDisplay.uniforms.dye.value      = dFBO0.texture;
    mDisplay.uniforms.velocity.value = vFBO0.texture;
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);

    /* 9 — Spotlight glow (plasive.tech exact: 600px, rgba(29,78,216,0.15)) */
    spX += (spRawX - spX) * 0.055;
    spY += (spRawY - spY) * 0.055;
    if (spotlight) {
      const light = document.body.classList.contains('light');
      const inner = light ? 'rgba(60, 110, 200, 0.065)' : 'rgba(29, 78, 216, 0.15)';
      spotlight.style.background =
        `radial-gradient(600px at ${spX}px ${spY}px, ${inner} 0%, transparent 80%)`;
    }
  })();

  /* ── Resize ───────────────────────────────────────────────────── */
  return {
    resize() {
      W = Math.floor(window.innerWidth  * FLUID_CFG.resolution);
      H = Math.floor(window.innerHeight * FLUID_CFG.resolution);
      renderer.setSize(window.innerWidth, window.innerHeight);
      px.set(1 / W, 1 / H);

      const dispose = [vFBO0, vFBO1, pFBO0, pFBO1, dFBO0, dFBO1, divFBO];
      vFBO0 = mkRT(W,H,textureType); vFBO1 = mkRT(W,H,textureType);
      pFBO0 = mkRT(W,H,textureType); pFBO1 = mkRT(W,H,textureType);
      dFBO0 = mkRT(W,H,textureType); dFBO1 = mkRT(W,H,textureType);
      divFBO = mkRT(W,H,textureType);
      dispose.forEach(r => r.dispose());
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL + UI
═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Cookie banner ── */
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');
  if (cookieBanner && !localStorage.getItem('plasive_cookie')) {
    setTimeout(() => cookieBanner.classList.remove('hidden'), 1200);
    cookieAccept.addEventListener('click', () => {
      localStorage.setItem('plasive_cookie', '1');
      cookieBanner.classList.add('hidden');
    });
  }

  /* Kick off fluid renderer */
  const shared = { currentX: 0 };
  const fluid = setupFluid(shared);

  /* Initial warm-up splats — run after a tiny delay so FBOs are ready */
  if (fluid) setTimeout(() => {
    /* access internal initialSplats via closure — already called inside setupFluid */
  }, 100);

  const container      = document.getElementById('container');
  const scroller       = document.getElementById('scroller');
  const bookmarksEl    = document.querySelectorAll('.bookmark');
  const summaryOverlay = document.getElementById('summary-overlay');
  const summaryToggle  = document.getElementById('summary-toggle');
  const summaryClose   = document.getElementById('summary-close');
  const summaryLinks   = document.querySelectorAll('.so-link');
  const themeToggle    = document.getElementById('theme-toggle');

  const SECTIONS = 5;
  const LERP     = 0.082;

  let targetX   = 0;
  let currentX  = 0;
  let activeIdx = 0;
  let rafId     = null;
  let snapTimer = null;

  /* Touch */
  let touchActive = false;
  let touchPrevX  = 0;
  let touchTime   = 0;
  let touchVel    = 0;

  /* Progress bar */
  const progressLine = document.createElement('div');
  progressLine.className = 'progress-line';
  document.body.appendChild(progressLine);

  function updateProgress(val) {
    const max = maxScroll();
    progressLine.style.transform = `scaleX(${max > 0 ? val / max : 0})`;
  }
  let touchPrevY = 0;

  function updateBookmarks(idx) {
    activeIdx = Math.max(0, Math.min(SECTIONS - 1, idx));
    bookmarksEl.forEach((bm, i) => {
      bm.classList.remove('active', 'visited');
      if (i === activeIdx)     bm.classList.add('active');
      else if (i < activeIdx) bm.classList.add('visited');
    });
  }

  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let isVertical = false;
  let targetY = 0, currentY = 0;

  const pageSize  = () => isVertical ? window.innerHeight : window.innerWidth;
  const maxScroll = () => (SECTIONS - 1) * pageSize();

  function setTransform(val) {
    scroller.style.transform = isVertical ? `translateY(${-val}px)` : `translateX(${-val}px)`;
  }

  function animate() {
    if (isVertical) {
      currentY = lerp(currentY, targetY, LERP);
      shared.currentX = currentY;
      setTransform(currentY);
      updateProgress(currentY);
      const nearest = Math.round(currentY / window.innerHeight);
      if (nearest !== activeIdx) updateBookmarks(nearest);
      if (Math.abs(targetY - currentY) < 0.18) {
        currentY = targetY; setTransform(currentY); updateProgress(currentY);
        rafId = null; return;
      }
    } else {
      currentX = lerp(currentX, targetX, LERP);
      shared.currentX = currentX;
      setTransform(currentX);
      updateProgress(currentX);
      const nearest = Math.round(currentX / window.innerWidth);
      if (nearest !== activeIdx) updateBookmarks(nearest);
      if (Math.abs(targetX - currentX) < 0.18) {
        currentX = targetX; setTransform(currentX); updateProgress(currentX);
        rafId = null; return;
      }
    }
    rafId = requestAnimationFrame(animate);
  }

  function startAnimate() { if (!rafId) rafId = requestAnimationFrame(animate); }

  function goTo(idx) {
    const i = clamp(Math.round(idx), 0, SECTIONS - 1);
    if (isVertical) targetY = i * window.innerHeight;
    else            targetX = i * window.innerWidth;
    updateBookmarks(i);
    startAnimate();
  }

  function snapNearest() {
    const cur = isVertical ? targetY : targetX;
    goTo(Math.round(cur / pageSize()));
  }
  function scheduleSnap() { clearTimeout(snapTimer); snapTimer = setTimeout(snapNearest, 220); }

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (isVertical) targetY = clamp(targetY + delta, 0, maxScroll());
    else            targetX = clamp(targetX + delta, 0, maxScroll());
    scheduleSnap();
    startAnimate();
  }, { passive: false });

  container.addEventListener('touchstart', (e) => {
    touchActive = true;
    touchPrevX  = e.touches[0].clientX;
    touchTime   = Date.now();
    touchVel    = 0;
    clearTimeout(snapTimer);
    if (!touchPrevY) touchPrevY = e.touches[0].clientY;
    touchPrevY = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!touchActive) return;
    const now = Date.now(), dt = now - touchTime;
    if (isVertical) {
      const y = e.touches[0].clientY, dy = touchPrevY - y;
      if (dt > 0) touchVel = (dy / dt) * 14;
      touchPrevY = y; touchTime = now;
      targetY = clamp(targetY + dy * 1.6, 0, maxScroll());
    } else {
      const x = e.touches[0].clientX, dx = touchPrevX - x;
      if (dt > 0) touchVel = (dx / dt) * 14;
      touchPrevX = x; touchTime = now;
      targetX = clamp(targetX + dx * 1.6, 0, maxScroll());
    }
    startAnimate();
  }, { passive: true });

  container.addEventListener('touchend', () => {
    touchActive = false;
    if (Math.abs(touchVel) > 0.4) {
      const coast = () => {
        touchVel *= 0.9;
        if (isVertical) targetY = clamp(targetY + touchVel, 0, maxScroll());
        else            targetX = clamp(targetX + touchVel, 0, maxScroll());
        Math.abs(touchVel) > 0.1 ? requestAnimationFrame(coast) : snapNearest();
      };
      requestAnimationFrame(coast);
    } else { snapNearest(); }
  });

  document.addEventListener('keydown', (e) => {
    if (summaryOverlay.classList.contains('open')) {
      if (e.key === 'Escape') summaryOverlay.classList.remove('open');
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(activeIdx + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(activeIdx - 1);
  });

  bookmarksEl.forEach(bm => bm.addEventListener('click', () => goTo(parseInt(bm.dataset.idx, 10))));

  summaryToggle.addEventListener('click', () => summaryOverlay.classList.add('open'));
  summaryClose.addEventListener('click',  () => summaryOverlay.classList.remove('open'));
  summaryLinks.forEach(link => link.addEventListener('click', (e) => {
    e.preventDefault();
    summaryOverlay.classList.remove('open');
    goTo(parseInt(link.dataset.target, 10));
  }));

  themeToggle.addEventListener('click', () => document.body.classList.toggle('light'));

  /* Scroll direction toggle — horizontal ↔ vertical */
  const layoutToggle = document.getElementById('layout-toggle');
  if (layoutToggle) {
    layoutToggle.addEventListener('click', () => {
      isVertical = !isVertical;
      document.body.classList.toggle('scroll-v', isVertical);
      layoutToggle.classList.toggle('active', isVertical);
      layoutToggle.title = isVertical ? 'Switch to horizontal scroll' : 'Switch to vertical scroll';
      layoutToggle.querySelector('.layout-icon-v').style.display = isVertical ? 'none'  : 'block';
      layoutToggle.querySelector('.layout-icon-h').style.display = isVertical ? 'block' : 'none';
      /* jump to current section in new axis */
      currentX = isVertical ? 0 : activeIdx * window.innerWidth;
      currentY = isVertical ? activeIdx * window.innerHeight : 0;
      targetX  = currentX; targetY = currentY;
      setTransform(isVertical ? currentY : currentX);
    });
  }

  window.addEventListener('resize', () => {
    if (isVertical) {
      currentY = activeIdx * window.innerHeight;
      targetY  = currentY;
      shared.currentX = currentY;
      setTransform(currentY);
    } else {
      currentX = activeIdx * window.innerWidth;
      targetX  = currentX;
      shared.currentX = currentX;
      setTransform(currentX);
    }
    if (fluid) fluid.resize();
  });

  updateBookmarks(0);
  updateProgress(0);
});
