// Paint artwork on a 480 by 210 pixel grid. Integer scanlines keep every edge crisp.
export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function poly(ctx, coords, color) {
  const yy = coords.filter((_, i) => i % 2);
  const ymin = Math.min(...yy);
  const ymax = Math.max(...yy);
  ctx.fillStyle = color;
  for (let y = Math.ceil(ymin); y < ymax; y++) {
    const xs = [];
    for (let i = 0; i < coords.length; i += 2) {
      const j = (i + 2) % coords.length;
      const a = coords[i + 1], b = coords[j + 1];
      const s = y + 0.5;
      if ((a <= s && b > s) || (b <= s && a > s)) {
        xs.push(coords[i] + (s - a) / (b - a) * (coords[j] - coords[i]) );
      }
    }
    xs.sort((a,b) => a-b);
    for (let i = 0; i < xs.length - 1; i += 2) {
      const start = Math.round(xs[i]);
      ctx.fillRect(start, y, Math.round(xs[i+1]) - start, 1);
    }
  }
}
function seed(n) {
  let s = n | 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 4294967296; };
}
function offscreen(w, h, paint) {
  const cv = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w,h) : document.createElement('canvas');
  cv.width = w; cv.height = h;
  paint(cv.getContext('2d'));
  return cv;
}
function cloud(ctx, x, y, s, variant) {
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  const p = [-10,23,-3,23,-3,20,4,20,4,15,8,15,8,11,15,11,15,14,19,14,19,8,23,8,23,4,29,4,29,1,38,1,38,3,43,3,43,7,47,7,47,12,50,12,50,10,56,10,56,13,60,13,60,19,65,19,65,17,71,17,71,20,77,20,77,23,85,23,85,25,72,25,72,27,15,27,15,26,-4,26,-4,25,-10,25];
  poly(ctx,p,'#9bdedb');
  poly(ctx,[-10,23,-3,23,-3,20,4,20,4,15,8,15,8,11,15,11,15,14,19,14,19,8,23,8,23,4,29,4,29,1,38,1,38,3,43,3,43,7,47,7,47,12,50,12,50,10,56,10,56,13,60,13,60,19,66,19,66,17,71,17,71,20,77,20,77,23,63,23,63,24,47,24,47,23,29,23,29,25,8,25,8,24,-10,24], '#e1f6db');
  poly(ctx,[2,20,7,20,7,15,10,15,10,12,14,12,14,15,21,15,21,9,24,9,24,5,30,5,30,2,37,2,37,4,41,4,41,8,44,8,44,12,39,12,39,10,34,10,34,12,31,12,31,15,25,15,25,18,22,18,22,19,18,19,18,21,12,21,12,19,7,19,7,22,2,22],'#fffbe2');
  if(variant) rect(ctx,23,28,24,1,'#b6e8df');
  ctx.restore();
}
function mountains(ctx, skyline, floor, colors) {
  poly(ctx,[-5,floor,...skyline,664,floor],colors[0]);
  for(let i=2; i<skyline.length-2; i+=2){
    const x=skyline[i],y=skyline[i+1];
    if(y < skyline[i-1] && y<=skyline[i+3]){
      const end=skyline[i+2],ey=skyline[i+3];
      const ridge = Math.round((end-x)*0.38);
      poly(ctx,[x,y,end,ey,end+10,floor,x+ridge,floor,x+ridge+3,y+20,x+ridge-2,y+18,x+ridge,y+13,x+2,y+6],colors[1]);
      if(colors[2]) poly(ctx,[x-2,y+2,x,y,x+3,y+7,x+1,y+6,x-1,y+8,x-2,y+6,x-5,y+9],colors[2]);
    }
  }
}
function cliff(ctx,x,y,w,h,rand) {
  ctx.save(); ctx.translate(x,y);
  const edge=[0,0,w,0,w-2,5,w-4,6,w-4,h-8,w+2,h-4,w+5,h, -6,h,-4,h-5,0,h-8,0,10,-3,8,-3,4];
  poly(ctx,edge,'#5c8769');
  poly(ctx,[0,3,w-2,3,w-4,8,w-5,9,w-5,h-5,w-13,h-1,1,h-3,2,9], '#af9b65');
  const ribs=['#d2b476','#dfc487','#817e59','#9a8d60','#eee09a'];
  for(let i=1;i<w-8;){
    const rw=2+Math.floor(rand()*5),depth=4+Math.floor(rand()*(h-7));
    const c=ribs[Math.floor(rand()*ribs.length)];
    poly(ctx,[i,3,i+rw,3,i+rw,depth-2,i+rw-2,depth-2,i+rw-2,depth+2,i,depth+2],c);
    if(rand()>.35)rect(ctx,i+1,h-4,2,2,'#b6ab7c');
    i+=rw+1;
  }
  rect(ctx,-3,-1,w+4,4,'#388f66');
  rect(ctx,-2,-3,w,3,'#70b94d');
  rect(ctx,1,-4,w-5,2,'#b2db65');
  for(let i=3;i<w-5;i+=7)rect(ctx,i,0,2+Math.floor(rand()*5),1,'#78c358');
  ctx.restore();
}
function tree(ctx,x,y,k,shade=false) {
  ctx.save(); ctx.translate(x,y); ctx.scale(k,k);
  poly(ctx,[-2,1,1,1,3,-15,2,-23,-1,-23,0,-16],shade?'#397b74':'#655c44');
  rect(ctx,1,-17,1,11,shade?'#72ad8b':'#bd9b65');
  poly(ctx,[-11,-19,-11,-24,-8,-24,-8,-27,-4,-27,-4,-30,3,-30,3,-29,7,-29,7,-27,10,-27,10,-24,13,-24,13,-20,9,-20,9,-18,3,-18,3,-17,-4,-17,-4,-18,-9,-18,-9,-19],shade?'#419e88':'#166f60');
  poly(ctx,[-11,-23,-8,-23,-8,-26,-4,-26,-4,-29,3,-29,3,-28,7,-28,7,-26,10,-26,10,-23,6,-23,6,-21,-4,-21,-4,-20,-8,-20,-8,-21,-11,-21],shade?'#7bc89a':'#32ae71');
  rect(ctx,-5,-26,7,2,shade?'#b3dba5':'#86cf79');
  rect(ctx,-7,-24,4,1,shade?'#b3dba5':'#a3d983');
  ctx.restore();
}
function palm(ctx,x,y,k) {
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);
  poly(ctx,[0,0,3,0,3,-7,6,-12,7,-24,5,-24,4,-14,1,-10], '#695c4a');
  rect(ctx,4,-17,2,2,'#cab17a');
  poly(ctx,[6,-23,-1,-26,-7,-25,-13,-19,-10,-20,-8,-20,-6,-22,-2,-22,-9,-15,-9,-12,-2,-18,4,-20,2,-16,2,-10,5,-14,8,-22,13,-19,17,-13,17,-17,15,-21,12,-23,20,-21,23,-18,21,-23,15,-26,8,-25,10,-29,13,-31,9,-30,6,-27], '#257866');
  poly(ctx,[-12,-20,-7,-26,-1,-27,6,-25,10,-28,15,-27,21,-23,13,-25,8,-24,5,-23,-1,-25,-6,-24], '#6fbf71');
  ctx.restore();
}
function house(ctx,x,y) {
  ctx.save();ctx.translate(x,y);
  rect(ctx,0,-10,15,10,'#e9dcb5');
  rect(ctx,11,-10,4,10,'#be9d91');
  rect(ctx,4,-6,3,3,'#5c8988');
  rect(ctx,9,-6,3,6,'#78676c');
  poly(ctx,[-3,-10,2,-16,13,-16,19,-10], '#aa6360');
  poly(ctx,[-2,-11,2,-16,12,-16,9,-11], '#ed8d7c');
  rect(ctx,12,-17,2,3,'#cba69a');
  rect(ctx,0,-1,15,1,'#8f8d73');
  ctx.restore();
}
function island(ctx,x,y,w,h,options,rand) {
  poly(ctx,[x-9,y+3,x-3,y+1,x+2,y-1,x+w-6,y-1,x+w+5,y+2,x+w+9,y+3,x+w,y+5,x+3,y+5], '#98d1aa');
  rect(ctx,x-4,y+4,w+7,1,'#d1edd0');
  cliff(ctx,x,y-h,w,h,rand);
  if(options.house) {palm(ctx,x+4,y-h-4,.72);house(ctx,x+11,y-h-4);palm(ctx,x+w-8,y-h-4,.51);}
  else for(const [dx,size] of options.trees || [])tree(ctx,x+dx,y-h-4,size,options.shade);
}
function scenery(ctx) {
  const r=seed(7124);
  mountains(ctx,[-10,104,7,91,14,94,31,78,42,87,63,64,70,69,75,66,97,91,113,79,133,101,152,89,166,70,171,71,192,49,201,58,206,55,232,85,242,76,264,96,280,87,286,90,302,79,309,82,336,54,342,57,351,47,358,51,363,50,391,81,410,73,437,100,455,85,468,91,497,66,503,68,532,93,548,82,572,104,597,79,610,88,632,74,641,82,663,99],137,['#80d5ce','#65c4c2','#a4e3d4']);
  mountains(ctx,[-1,112,12,108,26,109,38,100,51,101,57,95,65,94,72,86,79,86,83,82,90,84,95,83,111,99,119,98,135,114,162,108,178,95,189,98,199,87,208,88,219,75,230,76,240,89,248,88,263,103,275,101,291,111,309,108,322,95,333,95,350,78,358,80,366,76,383,94,394,94,414,108,425,103,438,105,455,91,472,90,482,81,489,82,500,93,511,91,525,101,535,99,552,114,574,104,592,102,610,87,618,86,631,99,647,101,662,111],138,['#68bda9','#55b0a2']);
  for(let i=0;i<42;i++) {
    let x=Math.round(r()*650), y=118+Math.round(r()*8);
    rect(ctx,x,y,6+r()*30,2,'#86cdb1');
  }
  // The water reflects the sky at the horizon and becomes saturated towards shore.
  rect(ctx,0,126,660,84,'#81dacf');
  rect(ctx,0,134,660,76,'#61cfc5');
  rect(ctx,0,146,660,64,'#46c2ba');
  rect(ctx,0,161,660,49,'#35b5ae');
  for(let i=0;i<550;i++){
    const x=r()*660,y=126+r()*79;
    const color=y<140?['#ade8d2','#99e1ce','#65cec2']:['#78d9c5','#57cbbb','#2fafa6'];
    rect(ctx,x,y,2+r()*16,1,color[i%3]);
  }
  island(ctx,-8,139,41,28,{trees:[[13,1],[22,.6]],shade:true},r);
  island(ctx,42,133,37,9,{trees:[[8,.35],[24,.49]],shade:true},r);
  island(ctx,87,148,39,15,{house:true},r);
  island(ctx,224,133,31,13,{trees:[[10,.5]],shade:true},r);
  island(ctx,278,145,46,21,{trees:[[29,.8],[13,.51]]},r);
  island(ctx,325,143,30,12,{trees:[[13,.36]],shade:true},r);
  island(ctx,416,141,75,40,{trees:[[11,.74],[41,1],[60,.65]]},r);
  island(ctx,454,151,42,26,{trees:[[18,.44]]},r);
  island(ctx,544,146,44,19,{trees:[[12,.82],[32,.63]]},r);
  island(ctx,614,133,23,9,{trees:[[9,.35]],shade:true},r);
}
let skyLayer, farLayer, cloudLayer;
export function landscape(ctx,camera,time) {
  if(!skyLayer){
    skyLayer=offscreen(480,210,c=>{
      const colors=['#389bc3','#42a7ca','#51b3d0','#63bfd4','#75cbd7','#88d6da','#a1e2d8'];
      colors.forEach((color,i)=>rect(c,0,i*17,480,19,color));
      rect(c,0,118,480,92,'#a1e2d8');
      // A warm little Namekian moon with stepped pixel highlights.
      poly(c,[388,19,393,19,393,17,402,17,402,18,408,18,408,20,411,20,411,23,414,23,414,28,415,28,415,35,413,35,413,39,410,39,410,42,405,42,405,44,393,44,393,42,388,42,388,40,385,40,385,36,383,36,383,26,385,26,385,22,388,22],'#e2e8be');
      poly(c,[388,21,392,21,392,19,404,19,404,21,409,21,409,25,412,25,412,32,409,32,409,35,405,35,405,37,396,37,396,36,391,36,391,34,387,34,387,31,385,31,385,26,388,26], '#f6efc7');
      rect(c,392,22,6,1,'#fff5cf');
      rect(c,381,37,29,1,'#d3e5cb');
    });
    cloudLayer=offscreen(660,112,c=>{
      [[-39,11,1.05],[65,41,.48],[93,12,1.15],[246,34,.70],[315,5,.60],[377,43,1.05],[511,19,.87],[594,53,.62],[3,61,.68],[172,63,.5],[289,63,.40]].forEach(([x,y,s],i)=>cloud(c,x,y,s,i%2));
    });
    farLayer=offscreen(660,210,scenery);
  }
  ctx.drawImage(skyLayer,0,0);
  const repeat=(layer,offset)=>{
    const x=-((Math.round(offset)%660+660)%660);
    ctx.drawImage(layer,x,0);
    if(x+660<480)ctx.drawImage(layer,x+660,0);
  };
  repeat(cloudLayer,camera*.09+time*.45);
  repeat(farLayer,camera*.25);
}
