import * as THREE from 'three';
import {RoomEnvironment} from '../vendor/jsm/environments/RoomEnvironment.js';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture; scene.environmentIntensity=.95;
const cam = new THREE.PerspectiveCamera(32, 1, .1, 100); cam.position.set(0,0,12);
scene.add(new THREE.HemisphereLight(0xeef7ff, 0x263b55, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(3,5,6); scene.add(key);
const rim = new THREE.DirectionalLight(0x83cfff, 1.3); rim.position.set(-5,-2,-3); scene.add(rim);

// ---- crisp logo texture for sky rod close-up (text runs along cylinder axis V)
function logoTex(txt, bg, fg){
  const c = document.createElement('canvas'); c.width=256; c.height=1024;
  const g = c.getContext('2d'); g.fillStyle=bg; g.fillRect(0,0,256,1024);
  g.save(); g.translate(128,512); g.rotate(-Math.PI/2);
  g.fillStyle=fg; g.font='300 54px "Helvetica Neue",Arial,sans-serif';
  g.textAlign='center'; g.textBaseline='middle';
  for(const y of [-64, 64]) g.fillText(txt, 0, y);
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

// ---- unified sleek procedural rod (length ~15 along +X, handle at -X)
const rod = new THREE.Group();
const blankMat = new THREE.MeshPhysicalMaterial({color:0x1b4278, roughness:.22, metalness:.55, clearcoat:.85, clearcoatRoughness:.15});
const wrapMat  = new THREE.MeshStandardMaterial({color:0x2b6cb8, roughness:.3, metalness:.5});
const guideMat = new THREE.MeshStandardMaterial({color:0xb8c3d0, roughness:.18, metalness:.95});
const corkMat  = new THREE.MeshStandardMaterial({color:0xd8a87e, roughness:.82, metalness:.04});
const seatMat  = new THREE.MeshStandardMaterial({color:0x404752, roughness:.34, metalness:.72});
const silverMat= new THREE.MeshStandardMaterial({color:0xc9d2dc, roughness:.2, metalness:.92});
const logoMat  = new THREE.MeshPhysicalMaterial({map:logoTex('TIDEWRIGHT','#1b4278','#e4f4ff'), roughness:.22, metalness:.45, clearcoat:.8});

function cylRod(parent, rt, rb, len, mat, x){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, len, 32, 1), mat);
  m.rotation.z = -Math.PI/2; m.position.x = x; parent.add(m); return m;
}
// tapered blank from x=-0.8 to x=12.6
const x0 = -0.8, L = 13.4, segs = 10;
for(let i=0;i<segs;i++){
  const a=i/segs, b=(i+1)/segs;
  const r0=.14*(1-a)+.028*a, r1=.14*(1-b)+.028*b;
  cylRod(rod, r1, r0, L/segs+.005, blankMat, x0 + L*(a+b)/2);
}
// logo sleeve around x=1.6..4.4 (visible in sky close-up)
const logoMesh = cylRod(rod, .128, .136, 2.8, logoMat, 2.6);
logoMesh.rotation.x = Math.PI + .48;
// handle: cork rear + dark machined seat + cork fore + silver winding check (no clunky spinning reel)
cylRod(rod, .185, .205, 2.8, corkMat, -4.6);
cylRod(rod, .20, .20, .22, silverMat, -3.12);
cylRod(rod, .19, .19, 1.35, seatMat, -2.35);
cylRod(rod, .21, .21, .22, silverMat, -1.58);
cylRod(rod, .185, .155, .95, corkMat, -1.0);
// guides along blank (angled gracefully)
for(let i=0;i<7;i++){
  const x = 1.4 + i*1.75;
  const t = 1 - (x - x0)/L;
  const r = .065 + .075*t;
  const g = new THREE.Mesh(new THREE.TorusGeometry(r, .013, 10, 24), guideMat);
  g.position.set(x, .11 + .07*t, 0); g.rotation.y = Math.PI/2; g.rotation.x = .28; rod.add(g);
  const leg = cylRod(rod, .011, .014, .18 + .07*t, guideMat, x - .08);
  leg.rotation.z = -.45; leg.position.set(x - .06, .06 + .04*t, 0);
  cylRod(rod, .14*(1-t)+.03, .14*(1-t)+.03, .16, wrapMat, x - .12);
}
scene.add(rod);

// second parallel rod for precision section (s=4)
const rod2 = rod.clone();
rod2.children.forEach(ch=>{ if(ch.material===logoMat) ch.visible=false; });
scene.add(rod2);

// ---- lure: sleek chrome minnow with back shading and treble hook
const lure = new THREE.Group();
const bodyG = new THREE.LatheGeometry([[0,-1.55],[.06,-1.3],[.12,-.7],[.14,.05],[.12,.78],[.06,1.28],[0,1.5]].map(p=>new THREE.Vector2(p[0],p[1])),32);
const lureM = new THREE.MeshPhysicalMaterial({color:0xf4f9fd, roughness:.1, metalness:1, clearcoat:1, clearcoatRoughness:.08, envMapIntensity:1.3});
const lb = new THREE.Mesh(bodyG, lureM); lb.scale.set(1,1,.46); lure.add(lb);
const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,1.65,24,1,true,Math.PI*.7,Math.PI*.6), new THREE.MeshStandardMaterial({color:0x1b6896, roughness:.28, metalness:.55, side:THREE.DoubleSide}));
stripe.scale.set(1,1,.5); stripe.position.set(0,.02,-.02); lure.add(stripe);
for(const s of [-1,1]){
  const e = new THREE.Mesh(new THREE.SphereGeometry(.026,12,12), new THREE.MeshStandardMaterial({color:0x101418}));
  e.position.set(s*.062, 1.15, .07); lure.add(e);
}
// compact 3-prong treble hook at tail
const hookGrp = new THREE.Group(); hookGrp.position.set(0, -1.55, 0);
for(let i=0;i<3;i++){
  const h = new THREE.Mesh(new THREE.TorusGeometry(.11,.014,8,16,Math.PI*1.25), guideMat);
  h.rotation.y = i*(Math.PI*2/3); h.rotation.z = Math.PI*.65; h.position.y = -.11; hookGrp.add(h);
}
lure.add(hookGrp);
const line = new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,32,4), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.68}));
line.position.y = 16.4; lure.add(line);
lure.scale.setScalar(.62);
scene.add(lure);

// ---- sculpted machined reel-seat assembly (grip macro scene, ref grip.png)
const nt = (()=>{const c=document.createElement('canvas');c.width=c.height=256;const g2=c.getContext('2d');
  g2.fillStyle='#808080';g2.fillRect(0,0,256,256);
  for(let i=0;i<6000;i++){const v=96+Math.random()*84|0;g2.fillStyle=`rgb(${v},${v},${v})`;g2.fillRect(Math.random()*256,Math.random()*256,2,2);}
  const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(6,3);return tx;})();
const M = {
  grip: new THREE.MeshStandardMaterial({color:0x4e545e, roughness:.76, metalness:.1, bumpMap:nt, bumpScale:.55}),
  body: new THREE.MeshPhysicalMaterial({color:0x586270, roughness:.26, metalness:.88, clearcoat:.5, clearcoatRoughness:.22}),
  alu:  new THREE.MeshStandardMaterial({color:0xd2d8e0, roughness:.22, metalness:.96, side:THREE.DoubleSide}),
  bore: new THREE.MeshStandardMaterial({color:0x0b0e13, roughness:.9})
};
const seat = new THREE.Group(), inner = new THREE.Group();
inner.position.x = -0.35; seat.add(inner);

// 1) Left flared ergonomic rear grip (x = -5.6 to -1.1)
const gripPts = [[-5.6,.56],[-4.4,.64],[-3.0,.78],[-2.1,.79],[-1.4,.70],[-1.1,.68]].map(p=>new THREE.Vector2(p[1], p[0]));
const gripMesh = new THREE.Mesh(new THREE.LatheGeometry(gripPts, 64), M.grip);
gripMesh.rotation.z = -Math.PI/2; inner.add(gripMesh);

// 2) Concave sculpted metallic reel-seat saddle + silver hood (x = -1.1 to +1.05)
const seatPts = [[-1.1,.68],[-.85,.69],[-.4,.54],[.15,.52],[.62,.68],[.88,.72]].map(p=>new THREE.Vector2(p[1], p[0]));
const seatBody = new THREE.Mesh(new THREE.LatheGeometry(seatPts, 64), M.body);
seatBody.rotation.z = -Math.PI/2; inner.add(seatBody);

// Silver flared front collar with hollow dark bore (x = +0.88 to +1.30)
const collarPts = [[.88,.72],[1.0,.76],[1.26,.78],[1.30,.71],[1.26,.54],[.88,.54]].map(p=>new THREE.Vector2(p[1], p[0]));
const collar = new THREE.Mesh(new THREE.LatheGeometry(collarPts, 64), M.alu);
collar.rotation.z = -Math.PI/2; inner.add(collar);
const bore = new THREE.Mesh(new THREE.CylinderGeometry(.53,.53,.1,32), M.bore);
bore.rotation.z = -Math.PI/2; bore.position.x = 1.24; inner.add(bore);

// 3) Small exploded-view gap (1.30 .. 1.65), then right male spigot + hex lock-nut (1.65 .. 5.2)
const spigPts = [[1.65,.54],[1.72,.58],[2.25,.58],[2.32,.66],[2.72,.66]].map(p=>new THREE.Vector2(p[1], p[0]));
const spigot = new THREE.Mesh(new THREE.LatheGeometry(spigPts, 48), M.alu);
spigot.rotation.z = -Math.PI/2; inner.add(spigot);
const hexNut = new THREE.Mesh(new THREE.CylinderGeometry(.76,.76,.62,6), M.alu);
hexNut.rotation.z = -Math.PI/2; hexNut.position.x = 2.95; inner.add(hexNut);
const rightTube = new THREE.Mesh(new THREE.CylinderGeometry(.66,.66,2.2,48), M.body);
rightTube.rotation.z = -Math.PI/2; rightTube.position.x = 4.35; inner.add(rightTube);
scene.add(seat);

// ---- sparse crisp bubbles
const N=28, pg=new THREE.BufferGeometry(), pa=new Float32Array(N*3), seed=[];
for(let i=0;i<N;i++){pa[i*3]=(Math.random()-.5)*11;pa[i*3+1]=(Math.random()-.5)*16;pa[i*3+2]=(Math.random()-.5)*4;seed.push(Math.random()*6.28);}
pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
const bc=document.createElement('canvas');bc.width=bc.height=64;const bg=bc.getContext('2d');
const gr=bg.createRadialGradient(26,24,2,32,32,28);
gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.45,'rgba(220,248,255,.55)');gr.addColorStop(.82,'rgba(180,238,255,.2)');gr.addColorStop(1,'rgba(255,255,255,0)');
bg.fillStyle=gr;bg.fillRect(0,0,64,64);
const bubbles=new THREE.Points(pg,new THREE.PointsMaterial({size:.22,map:new THREE.CanvasTexture(bc),transparent:true,depthWrite:false,opacity:0}));
scene.add(bubbles);

// ---- keyframes by scroll position s (in viewport heights)
const ss=t=>t*t*(3-2*t);
function kf(s,keys){ if(s<=keys[0][0])return keys[0].slice(1); for(let i=1;i<keys.length;i++){ if(s<=keys[i][0]){const a=keys[i-1],b=keys[i];const t=ss((s-a[0])/(b[0]-a[0]));return a.slice(1).map((v,j)=>v+(b[j+1]-v)*t);} } return keys.at(-1).slice(1); }

// rod: [s, x,y,z, rx,ry,rz, scale]
const ROD=[
  [0,   0,-8,-6, 3.0,0,.28, 1],
  [2.2,-6,-4,-4, 3.0,0,-.24, 1.8],
  [2.85,-6.1,-1.15,2.2, 3.05,0.06,-.24, 2.25],
  [3.4,-6.1,-1.12,2.2, 3.05,0.06,-.24, 2.3],
  [4.0,-0.3,-.28,-2.2, 0.14,0,0, 1.0],
  [4.65,-0.3,-.28,-2.2, 0.14,0,0, 1.0],
  [4.9, 0,14,-3, 0,0,0, .9]
];
const ROD2K=[
  [0,   24,-2.65,-2.2, .14,Math.PI,0, 1.0],
  [3.7, 24,-2.65,-2.2, .14,Math.PI,0, 1.0],
  [4.0, 16.4,-2.65,-2.2, .14,Math.PI,0, 1.0],
  [4.65,16.4,-2.65,-2.2, .14,Math.PI,0, 1.0],
  [4.95,24,-2.65,-2.2, .14,Math.PI,0, 1.0]
];
const CAMERA=[
  [0,   0,12,32],
  [2.6, 0,12,32],
  [4.0, 0,12,32],
  [4.8, 0,12,32],
  [5.0, 0,12,28],
  [6.1, 0,12,28],
  [6.5, 0,12,32],
  [12,  0,12,32]
];
const SEAT=[
  [4.65, 10,-0.85,-1.2, 0.06,0,0.08, .72],
  [4.95,  0,-0.85,-1.2, 0.06,0,0.08, .72],
  [6.1,   0,-0.85,-1.2, 0.06,0,0.08, .72],
  [6.45,-10,-0.85,-1.2, 0.06,0,0.08, .72]
];
const LURE=[
  [0,   .48,2.45,.7, .12,0,.15],
  [.8,  .32,1.95,.7, .12,0,.15],
  [6.55,1.05,12,0,   .08,0,.38],
  [6.95,1.05,1.2,.7, .08,0,.38],
  [7.6, 1.05,1.0,.7, .08,0,.38],
  [8.2, 0.72,0.35,.7,.08,.03,.38],
  [9.0, 0.85,-0.15,.7,.06,.04,.38],
  [9.8, 0.25,-2.8,.7,.06,.06,.38],
  [10.5,0,-7.5,.7,   .06,.08,.38]
];

const cur={s:0}; let tgt=0;
function readScroll(){tgt=scrollY/innerHeight}
addEventListener('scroll',readScroll,{passive:true});
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
const navEl=document.querySelector('nav');
const LIGHT=new Set([1,2,3,4,5,6,11]);
function navTheme(s){navEl.classList.toggle('light', LIGHT.has(Math.round(Math.min(s,12))));}
const q=new URLSearchParams(location.search);
if(q.has('s')){scrollTo(0,+q.get('s')*innerHeight);}
readScroll();cur.s=tgt;
let vis=true;document.addEventListener('visibilitychange',()=>vis=!document.hidden);
const clock=new THREE.Clock();

const C_NAVY=new THREE.Color(0x1b4278), C_SILVER=new THREE.Color(0xa6b2be);
const C_WRAP_BLUE=new THREE.Color(0x2b6cb8), C_WRAP_SILV=new THREE.Color(0x7c8a98);

function frame(){
  requestAnimationFrame(frame); if(!vis) return;
  const t=clock.getElapsedTime();
  cur.s = reduce||q.has('s') ? tgt : cur.s+(tgt-cur.s)*.12;
  const s=cur.s, wide=innerWidth>innerHeight, k=wide?1:.62;
  const cc=kf(s,CAMERA); cam.position.set(0,0,cc[1]); cam.lookAt(0,cc[0],0);
  cam.fov = wide ? cc[2] : cc[2] + 14; cam.updateProjectionMatrix();
  navTheme(tgt);

  // Rod & Rod2 visibility & material blend (navy+logo in Sky -> brushed titanium in Precision)
  const r=kf(s,ROD);
  rod.visible = s>2.3 && s<4.85;
  rod.position.set(r[0]*k, r[1], r[2]);
  rod.rotation.set(r[3], r[4], r[5]);
  rod.scale.setScalar(r[6]*(wide?1:.76));
  if(!reduce && s<4.85) rod.position.y += Math.sin(t*.8)*.03;

  const precBlend = ss(Math.max(0, Math.min(1, (s - 3.55) / .35)));
  blankMat.color.copy(C_NAVY).lerp(C_SILVER, precBlend);
  blankMat.metalness = THREE.MathUtils.lerp(.55, .86, precBlend);
  wrapMat.color.copy(C_WRAP_BLUE).lerp(C_WRAP_SILV, precBlend);
  logoMesh.visible = precBlend < 0.65;

  const r2=kf(s,ROD2K);
  rod2.visible = s>3.72 && s<4.88;
  rod2.position.set(r2[0]*k, r2[1], r2[2]);
  rod2.rotation.set(r2[3], r2[4], r2[5]);
  rod2.scale.setScalar(r2[6]*(wide?1:.76));

  // Grip Macro Seat
  const st=kf(s,SEAT);
  seat.visible = s>4.68 && s<6.42;
  seat.position.set(st[0]*k, st[1], st[2]);
  seat.rotation.set(st[3], st[4], st[5]);
  seat.scale.setScalar(st[6]*(wide?1:.88));

  // Lure (hero + underwater)
  const l=kf(s,LURE);
  lure.visible = (s<.9) || (s>6.6 && s<10.5);
  lure.position.set(l[0]*k, l[1], l[2]);
  lure.rotation.set(0, (reduce?0:t*.12)+l[4], l[3]);
  lure.scale.setScalar(l[5]);
  line.visible = s<7.4 || s>8.4;
  hookGrp.visible = s>6.5;

  // Bubbles
  const bo = tgt>=10.5 ? 0 : (s<1.6 ? Math.max(.35,Math.min(1,(s+.3)/.6))*(1-Math.max(0,(s-1.2)/.4)) : (s>6.6&&s<10.4?.72:(s>11.6?.65:0)));
  bubbles.material.opacity = bo*.85; bubbles.visible = bo>.01;
  if(!reduce){
    const a=pg.attributes.position;
    for(let i=0;i<N;i++){let y=a.getY(i)+.018+Math.sin(t+seed[i])*.003;if(y>8)y=-8;a.setY(i,y);}
    a.needsUpdate=true;
  }
  renderer.render(scene,cam);
}
frame();
