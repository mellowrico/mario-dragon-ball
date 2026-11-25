import {rect,poly} from './landscape.mjs';

function noise(n){
  let h=Math.imul(n^0x345631,0x45d9f3b);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}
const cache=new WeakMap();
function stone(ctx,x,y,w,h,tint,n){
  const palettes=[
    ['#845436','#a37343','#c99452','#e8ba6b'],
    ['#75472e','#a3673a','#bc8547','#dba55b'],
    ['#71482f','#98693d','#bc8a4a','#d7a65a']
  ];
  const [dark,base,light,lit]=palettes[tint];
  const notch=2+Math.round(noise(n)*3);
  poly(ctx,[x+notch,y,x+w-4,y,x+w,y+2,x+w,y+h-3,x+w-4,y+h,x+3,y+h,x,y+h-3,x,y+3],dark);
  poly(ctx,[x+notch,y,x+w-4,y,x+w-2,y+2,x+w-3,y+h-4,x+w-6,y+h-2,x+4,y+h-2,x+1,y+h-4,x+1,y+3],base);
  rect(ctx,x+notch,y,w-notch-4,1,light);
  rect(ctx,x+2,y+2,Math.max(2,w*.39),1,light);
  if(n%3===0)rect(ctx,x+notch,y,Math.max(2,w*.23),1,lit);
  if(n%4===0){
    rect(ctx,x+3,y+3,2,1,light);
    rect(ctx,x+5,y+4,1,1,light);
  }
  if(n%7===0 && w>13){
    rect(ctx,x+w-5,y+1,1,2,dark);
    rect(ctx,x+w-6,y+3,1,1,dark);
  }
  if(w>13){
    rect(ctx,x+w-7,y+h-4,3,1,dark);
    if(n%2===0)rect(ctx,x+w-10,y+h-3,3,1,dark);
  }
}
function grass(ctx,w,seed){
  rect(ctx,0,0,w,6,'#316a3a');
  rect(ctx,0,0,w,2,'#d1e76a');
  rect(ctx,0,2,w,2,'#97cf43');
  for(let i=-8,j=0;i<w;j++){
    const n=noise(seed+j*21);
    const size=5+Math.floor(n*10), drop=2+Math.floor(noise(seed+j+8)*5);
    poly(ctx,[i,3,i+size,3,i+size,4,i+size-2,4,i+size-2,6,i+size-4,6,i+size-4,5+drop,i+3,5+drop,i+3,4+drop,i,4+drop],'#654b2f');
    poly(ctx,[i,3,i+size,3,i+size,4,i+size-3,4,i+size-3,5,i+size-5,5,i+size-5,3+drop,i+3,3+drop,i+3,2+drop,i,2+drop],'#498c3e');
    rect(ctx,i+1,3,Math.max(3,size*.6),2,'#6ab03d');
    if(j%2===0)rect(ctx,i+4,1,2,2,'#a1d648');
    if(j%3===0)rect(ctx,i,0,4,1,'#f1ed87');
    if(j%2===0){rect(ctx,i+3,3,2,1,'#b3d94f');rect(ctx,i+5,2,1,1,'#d6e967');}
    i+=size;
  }
}
function groundBitmap(p){
  const w=Math.round(p.w/2),h=Math.round(p.h/2);
  const cv=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');
  cv.width=w;cv.height=h;
  const c=cv.getContext('2d');
  rect(c,0,0,w,h,'#765135');
  let k=p.x+9;
  for(let row=0;row<Math.ceil(h/9);row++){
    let x=-Math.round(noise(k+row)*13);
    while(x<w){
      const sw=11+Math.floor(noise(k++)*13);
      stone(c,x,3+row*9,sw-1,8,Math.floor(noise(k+25)*3),k);
      x+=sw;
    }
  }
  grass(c,w,p.x+834);
  return cv;
}
function ledgeBitmap(p){
  const w=Math.round(p.w/2),h=Math.round(p.h/2);
  const cv=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h+4):document.createElement('canvas');
  cv.width=w;cv.height=h+4;
  const c=cv.getContext('2d');
  poly(c,[0,0,w,0,w,7,w-4,7,w-4,10,w-10,10,w-10,12,7,12,7,10,3,10,3,7,0,7],'#674a37');
  for(let x=4;x<w-9;x+=7){
    let h=2+noise(x+p.x)*4;
    rect(c,x,5,5,h,'#b2834b');rect(c,x,5,2,h-1,'#d2a459');
  }
  grass(c,w,p.x);
  return cv;
}
function brick(c,x,y){
  rect(c,x,y,20,20,'#5d3d32');
  const blocks=[[1,1,8,8],[10,1,9,8],[-3,10,8,8],[6,10,9,8],[16,10,7,8]];
  c.save();c.beginPath();c.rect(x+1,y+1,18,18);c.clip();
  for(const [dx,dy,w,h] of blocks){
    rect(c,x+dx,y+dy,w,h,'#a55e3c');
    rect(c,x+dx,y+dy,w-1,2,'#e8a761');
    rect(c,x+dx,y+dy+2,1,h-3,'#c6854c');
    rect(c,x+dx+2,y+dy+3,w-4,1,'#b77244');
    rect(c,x+dx+2,y+dy+h-1,w-2,1,'#7c4938');
  }
  c.restore();
}
function mystery(c,x,y,used){
  const dark=used?'#705036':'#a45222',face=used?'#a67c52':'#f8b52f',light=used?'#c69c67':'#ffe476';
  rect(c,x,y,20,20,'#5d4030');
  rect(c,x+1,y+1,18,18,dark);
  rect(c,x+1,y+1,17,16,light);
  rect(c,x+2,y+3,15,13,face);
  rect(c,x+3,y+2,14,1,face);
  rect(c,x+3,y+16,14,1,used?'#9d734e':'#df8a28');
  for(const dx of [2,16]) for(const dy of [2,16])rect(c,x+dx,y+dy,1,1,dark);
  if(used)return;
  const symbol=['011110','110011','000011','000110','001100','001100','000000','001100'];
  for(let i=0;i<symbol.length;i++)for(let j=0;j<6;j++)if(symbol[i][j]==='1'){
    rect(c,x+6+j,y+5+i,2,2,'#a05d27');
  }
  for(let i=0;i<symbol.length;i++)for(let j=0;j<6;j++)if(symbol[i][j]==='1'){
    rect(c,x+6+j,y+4+i,1,1,'#fff9cf');
  }
}
export function platform(ctx,p){
  const x=Math.round(p.x/2),y=Math.round(p.y/2-4*Math.sin((p.bump||0)/.2*Math.PI));
  if(p.type==='ground'||p.type==='ledge'){
    if(!cache.has(p))cache.set(p,p.type==='ground'?groundBitmap(p):ledgeBitmap(p));
    ctx.drawImage(cache.get(p),x,y);
  } else if(p.type==='mystery')mystery(ctx,x,y,p.used);
  else brick(ctx,x,y);
}
function shrub(ctx,x,y,s){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  poly(ctx,[-12,0,-12,-3,-10,-3,-10,-7,-8,-7,-8,-9,-5,-9,-5,-8,-3,-8,-3,-13,0,-13,0,-15,3,-15,3,-12,4,-12,4,-8,7,-8,7,-10,10,-10,10,-7,12,-7,12,-3,14,-3,14,0],'#287749');
  poly(ctx,[-11,-3,-9,-4,-9,-7,-7,-8,-5,-7,-5,-4,-3,-3,-1,-7,-2,-12,1,-13,2,-12,2,-8,1,-5,4,-5,7,-8,9,-8,8,-5,5,-3],'#65aa49');
  rect(ctx,-1,-12,1,4,'#a4cf60');rect(ctx,-8,-7,2,1,'#a4cf60');
  ctx.restore();
}
function canopy(c,x,y,s) {
  c.save();c.translate(x,y);c.scale(s,s);
  poly(c,[-20,-1,-20,-6,-18,-6,-18,-9,-14,-9,-14,-12,-9,-12,-9,-14,-1,-14,-1,-15,5,-15,5,-14,11,-14,11,-12,16,-12,16,-9,19,-9,19,-5,22,-5,22,0,19,0,19,3,13,3,13,5,5,5,5,6,-6,6,-6,5,-12,5,-12,3,-17,3,-17,1,-20,1], '#1b6553');
  poly(c,[-19,-4,-17,-7,-14,-8,-14,-11,-8,-11,-8,-13,0,-13,0,-14,5,-14,5,-13,11,-13,11,-11,15,-11,15,-8,18,-8,18,-5,20,-5,20,-2,17,-2,17,0,12,0,12,2,3,2,3,3,-7,3,-7,1,-12,1,-12,-1,-19,-1], '#269276');
  poly(c,[-16,-6,-13,-8,-13,-10,-7,-10,-7,-12,1,-12,1,-13,5,-13,5,-12,10,-12,10,-10,13,-10,13,-7,8,-7,8,-5,2,-5,2,-4,-5,-4,-5,-3,-11,-3,-11,-4,-16,-4], '#4bb68a');
  rect(c,-7,-10,7,2,'#7dd499');rect(c,-11,-8,5,2,'#7dd499');rect(c,0,-11,6,1,'#7dd499');
  rect(c,7,-3,5,1,'#56bd88');rect(c,11,-5,3,1,'#56bd88');
  c.restore();
}
function namekTree(c,x,y,s){
  c.save();c.translate(x,y);c.scale(s,s);
  poly(c,[-6,0,-1,-5,0,-18,-1,-31,-4,-46,0,-48,3,-34,3,-24,8,-29,11,-38,13,-38,12,-29,9,-25,4,-21,3,-5,7,0],'#5b6244');
  poly(c,[-2,-1,0,-6,1,-17,0,-32,-3,-46,-1,-46,2,-32,2,-20,1,-6,0,-1], '#c2a268');
  for(const y of [-10,-16,-24,-30,-36,-40])rect(c,-1,y,3,1,'#897b51');
  canopy(c,-2,-45,1);canopy(c,13,-37,.54);
  shrub(c,-3,-1,.7);c.restore();
}
function flowers(c,x,y,n){
  const flower=['#fcce64','#f69466','#fff2ac'][n%3];
  for(let i=0;i<3;i++){
    const xx=x+i*3,yy=y-(i===1?6:3);
    rect(c,xx,yy,1,y-yy,'#488343');
    rect(c,xx-1,yy,3,1,flower);rect(c,xx,yy-1,1,3,flower);rect(c,xx,yy,1,1,'#f1ae43');
  }
}
export function foliage(c,p,left,right){
  if(p.type!=='ground')return;
  const start=Math.round(p.x/2),end=Math.round((p.x+p.w)/2),y=p.y/2;
  for(let x=Math.floor(Math.max(start,left-20)/24)*24;x<Math.min(right+20,end);x+=24){
    if(x<=start+1||x>end-10)continue;
    const k=Math.floor(x/24), n=noise(k+44);
    if(n>.80)shrub(c,x,y,.42+n*.28);
    if(n<.16)flowers(c,x,y,k);
    if(n>=.16 && n<=.55) {
      poly(c,[x-3,y,x-5,y-4,x-2,y-3,x,y-1,x,y-5,x+2,y-2,x+4,y-4,x+3,y], '#78ad4c');
      rect(c,x,y-4,1,2,'#b5d666');
    }
  }
  for(const [x,size] of [[18,.86],[456,.65],[748,.72],[1015,.85],[1430,1],[1688,.77],[1924,.92]]) {
    if(x>start+8&&x<end-8&&x>left-30&&x<right+30)namekTree(c,x,y,size);
  }
}
