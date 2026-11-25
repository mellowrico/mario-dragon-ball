import {landscape,rect,poly} from './art/landscape.mjs';
import {drawHero,drawFoe} from './art/actors.mjs';
import {platform,foliage} from './art/terrain.mjs';

const frames=new WeakMap();
function coin(c,x,y,t) {
  const pulse=Math.sin(t*4+x*.04);
  const w=pulse<-.88?2:pulse<-.45?3:4;
  poly(c,[x-w+2,y-6,x+w-2,y-6,x+w,y-4,x+w+1,y-4,x+w+1,y+4,x+w-1,y+4,x+w-1,y+6,x-w+1,y+6,x-w+1,y+5,x-w,y+5,x-w,y-4,x-w+2,y-4],'#995721');
  rect(c,x-w+1,y-4,w*2-2,8,'#ffb724');rect(c,x-w+2,y-5,w*2-4||1,10,'#ffdd51');
  rect(c,x-w+1,y-3,1,6,'#fff7b5');
  if(w>2){rect(c,x+1,y-3,1,7,'#df8a26');rect(c,x,y-3,1,6,'#fff596');}
}
function ball(c,x,y,stars){
  poly(c,[x-3,y-6,x+3,y-6,x+3,y-5,x+5,y-5,x+5,y-3,x+6,y-3,x+6,y+3,x+4,y+3,x+4,y+5,x+2,y+5,x+2,y+6,x-3,y+6,x-3,y+5,x-5,y+5,x-5,y+3,x-6,y+3,x-6,y-2,x-5,y-2,x-5,y-4,x-3,y-4],'#9e532b');
  rect(c,x-3,y-4,6,8,'#ffad32');rect(c,x-5,y-2,10,4,'#ffad32');
  rect(c,x-2,y-5,5,1,'#ffe071');rect(c,x-4,y-3,2,2,'#fff2b0');
  const positions=[[0,0],[-2,-2],[2,1],[2,-2],[-2,2],[0,3],[0,-4]];
  for(const [dx,dy] of positions.slice(0,stars))rect(c,x+dx,y+dy,1,1,'#bd412a');
}
function spark(c,x,y,size,color){
  rect(c,x-size,y,size*2+1,1,color);rect(c,x,y-size,1,size*2+1,color);
}
function fx(c,e){
  const r=1-e.life/e.maxLife,x=e.x/2,y=e.y/2;
  if(e.type==='bump')return;
  for(let i=0;i<8;i++){
    const a=Math.PI*2*i/8,dist=4+r*13;
    const px=x+Math.cos(a)*dist,py=y+Math.sin(a)*dist-r*3;
    const color=e.type==='ki'?'#c0fff4':e.type==='hit'?'#ff9a78':'#fff3a0';
    if(r<.65&&i%2===0)spark(c,px,py,1,color);
    else rect(c,px,py,1,1,color);
  }
}
function flag(c,worldX,active,finish,t) {
  const x=Math.round(worldX/2),ground=176,h=finish?61:33;
  rect(c,x-2,ground-h,3,h,'#706a48');rect(c,x-2,ground-h,1,h,'#e4d597');
  rect(c,x-4,ground-h-3,6,4,'#a56b32');rect(c,x-3,ground-h-4,4,4,'#ffd95e');
  const y=ground-h+1,w=finish?23:15,drop=Math.round(Math.sin(t*3));
  poly(c,[x+1,y,x+w*.55,y+1,x+w,y+drop,x+w-4,y+5+drop,x+w,y+10+drop,x+w*.5,y+11,x+1,y+9],active||finish?'#e57445':'#6386b0');
  rect(c,x+3,y+2,2,5,'#f3c580');
  if(finish){rect(c,x+9,y+3,4,4,'#fbdd6c');rect(c,x+10,y+4,2,2,'#d76434');}
}
function shot(c,s,t){
  const x=Math.round((s.x+s.w/2)/2),y=Math.round((s.y+s.h/2)/2);
  const side=(s.vx||1)>0?-1:1;
  poly(c,[x+side*11,y+1,x+side*6,y-1,x+side*8,y-3,x,y-2,x-side*2,y,x,y+3,x+side*8,y+3,x+side*6,y+1], '#5fe6f0');
  rect(c,x-3,y-2,6,4,'#d1ffff');rect(c,x-1,y-3,3,6,'#fffbd8');
  if(Math.sin(t*20)>0)spark(c,x,y,4,'#eaffef');
}
export function render(canvas,state,timeSeconds=0) {
  let frame=frames.get(canvas);
  if(!frame){
    frame=typeof OffscreenCanvas==='function'?new OffscreenCanvas(480,210):document.createElement('canvas');
    frame.width=480;frame.height=210;frames.set(canvas,frame);
  }
  const c=frame.getContext('2d'),t=Number.isFinite(timeSeconds)?timeSeconds:0;
  c.imageSmoothingEnabled=false;
  const camera=Math.round(state.cameraX/2),right=camera+480;
  landscape(c,camera,t);
  c.save();c.translate(-camera,0);
  const onScreen=o=>o.x+o.w>=camera*2-48&&o.x<=right*2+48;
  for(const p of state.platforms)if(onScreen(p))foliage(c,p,camera,right);
  if(state.checkpointX/2>=camera-30&&state.checkpointX/2<right)flag(c,state.checkpointX,state.checkpointActive,false,t);
  if(state.finishX/2>=camera-30&&state.finishX/2<right)flag(c,state.finishX,true,true,t);
  for(const p of state.platforms)if(onScreen(p))platform(c,p);
  for(const item of state.pickups){
    if(!onScreen(item))continue;
    const x=Math.round((item.x+item.w/2)/2),y=Math.round((item.y+item.h/2)/2+Math.sin(t*3+item.x/24)*.7);
    if(item.type==='ball')ball(c,x,y,item.stars);else coin(c,x,y,t);
  }
  for(const e of state.enemies)if(e.alive&&onScreen(e))drawFoe(c,e,t);
  drawHero(c,state.player,t);
  for(const s of state.shots)shot(c,s,t);
  for(const e of state.effects)fx(c,e);
  c.restore();
  const out=canvas.getContext('2d');out.imageSmoothingEnabled=false;
  out.drawImage(frame,0,0,canvas.width,canvas.height);
}
