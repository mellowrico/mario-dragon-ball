import {rect,poly} from './landscape.mjs';

const spriteCache=new Map();
function stamp(ctx,rows,palette,x,y,scale=1,flip=false) {
  let palettes=spriteCache.get(rows);
  if(!palettes){palettes=new Map();spriteCache.set(rows,palettes);}
  let sprite=palettes.get(palette);
  if(!sprite){
    const w=Math.max(...rows.map(a=>a.length)),h=rows.length;
    sprite=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');
    sprite.width=w;sprite.height=h;
    const s=sprite.getContext('2d');
    rows.forEach((row,i)=>[...row].forEach((ch,j)=>{if(palette[ch])rect(s,j,i,1,1,palette[ch]);}));
    palettes.set(palette,sprite);
  }
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(flip?-scale:scale,scale);
  ctx.drawImage(sprite,-Math.floor(sprite.width/2),-sprite.height);
  ctx.restore();
}
const head=[
'       KK       K',
'       KHK     KH',
'  K    KHHK   KHHK',
'  KHK  KAHHK KHHHK  KK',
'   KHHKKAAHHKHHHHKKHHK',
'   KHAAAHHHHHAHHHHHHK',
'KKKKKHHHAAAHHAAHHHHK',
' KAHHHHHHHHHHHHHHHKKK',
'  KHHHHRRRRRRRRRRRRHK',
'    KKRLRRRRRRRRRDDK',
'   KHHHKFFFHKFFFHK',
'    KHHKFFFKWFKWFK',
'    KHHSTFFKWFKWFTK',
'     KSFFTFFFFSTFFFK',
'     KTSTFHHHHHFFFK',
'      KKTTFHHHHHHK',
'       KKSTTFFFFK',
'         KKTSSKK',
];
const body=[
'       KRRRRDDK',
'     KKRLRBBRBRK',
'    KRLFFRBBRYBRK',
'    KRRRRBAYBBBRRK',
'   KWWUUKBABBBBKWWK',
'   KUWWWKBBBAABKUWK',
'    KWWKBBBBAAAKKK',
'     KKBBAAABBBK',
];
const stand=[
'      KBAABKBAAK',
'     KOOOBKKOOK',
'     KOTTOKKOTTTK',
'     KKKKKKKKKKKK',
];
const walk=[
'     KBBABK KABAK',
'   KOOOOBK   KOBOK',
'   KOTTTK     KOTTK',
'    KKKK      KKKKK',
];
const fly=[
'    KBBBAK   KAAK',
'   KOOOBK   KTOOK',
'   KOTTOK    KKOK',
'    KKKK       K',
];
const heroPalette={K:'#171c2c',H:'#253247',A:'#3c5265',R:'#dc4436',L:'#fd704b',D:'#9e313a',F:'#ffd397',T:'#d48a63',S:'#a65d49',W:'#fff2ca',U:'#b9c8bb',B:'#2775a8',Y:'#ffd258',O:'#753e2c'};
const goldPalette={...heroPalette,H:'#f9c93b',A:'#fff48d',K:'#423326'};
const lowerPalette={...heroPalette,A:'#469bc6',T:'#aa6240'};
const cell=[
'    KK      KK',
'   KGK      KGK',
'   KGGK    KGGK',
'  KGLGKKKKKKGLK',
'  KGLKGGGGLGGLK',
'  KGGGGKGGGGGKK',
'   KGKKGGGKKGGK',
'  KGFWKKKKWFKGK',
'   KFFRFKFRFFK',
'  KKKFTTTTTFKKK',
'  KPKKFPPPFKPPK',
' KPPKLKKKKKKPLPK',
' KPPLGGGFFGLGPPK',
' KPPKGKGPPGKKPK',
'  KKKKGGPGGGKK',
'    KKGGKKGGK',
'   KLLGKKKLLGGK',
'   KKKKK  KKKKK',
];
const cellPalette={K:'#1f352c',G:'#65ab3f',L:'#a7dc56',W:'#f5edc7',F:'#c6d9a4',T:'#92a376',P:'#394259',R:'#bc505e'};
const frieza=[
'      KKKKKK',
'    KKWVPPVWWK',
'K  KWVPPPPVVWWK  K',
'KHKWWVPPPLPVWWWKHK',
' KHKWVLLPPVWWWKHK',
'  KKKWVVVVWWWKKK',
'   KWWWKKKKWWWK',
'   KWRKWKKWKRWK',
'    KWWSSSSWWK',
'     KVVSSVVK',
'    KWWKKKKWWK',
'   KVWWWPPWWWVK',
'  KVSWKPPPPKWSVK',
'  KSSKKWPPWKKSSK',
'   KK KWWWWK KK',
'      KSSKSSK  K',
'    KWWWSKSWWSKS',
'    KKKKK KKKKK',
];
const frostPalette={K:'#382b48',W:'#e8e8e4',V:'#bab4d3',P:'#7a4baa',L:'#b780d5',S:'#d798ba',H:'#7a7382',R:'#b74e71'};
const buu=[
'        KKK',
'       KLLPK',
'       KPKPK',
'        KPPKK',
'     KKKPPLLLKK',
'   KKPPLLLLLLLPK',
'  KPPLLLLLLLLLLPK',
'  KPPLDLLLLLDLLPK',
'   KPKKKPPPKKKPK',
'   KPLLLLLLLLLPK',
'    KPLKKKKKPPK',
'  KKPKPPPPPPPKPK',
' KYYKPPKKKKKPPKYK',
' KPPKKKKYYKKKKPPK',
'  KKKWWWWWWWWKKK',
'    KWWWWWWWWK',
'     KWWKKWWK',
'    KYYK  KYYK',
'   KKKKK  KKKKK',
];
const buuPalette={K:'#452d43',L:'#ffb0c3',P:'#ea7d9e',D:'#dc6f90',Y:'#eac05b',W:'#f1e2db'};
export function drawHero(ctx,p,t) {
  if(p.invincible>0 && Math.floor(p.invincible*12)%2)ctx.globalAlpha=.58;
  const x=Math.round((p.x+p.w/2)/2),y=Math.round((p.y+p.h)/2);
  const moving=Math.abs(p.vx)>10;
  const step=moving&&Math.sin(t*20)>0;
  ctx.save();ctx.translate(x,y);ctx.scale(p.facing<0?-1:1,1);
  const sc=p.powered?1.25:1;
  ctx.scale(sc,sc);
  if(p.powered){
    ctx.globalAlpha=.4;
    poly(ctx,[-11,-1,-14,-8,-12,-7,-11,-17,-10,-14,-9,-22,-7,-17,-5,-25,0,-34,1,-27,6,-31,5,-24,9,-23,9,-15,12,-18,11,-9,13,-7,11,-1],'#ffe260');
    ctx.globalAlpha=1;
  }
  const bob=p.grounded && step ? -1:0;
  stamp(ctx,head,p.powered?goldPalette:heroPalette,0,-10+bob);
  stamp(ctx,body,lowerPalette,0,-3+bob);
  stamp(ctx,p.grounded?(step?walk:stand):fly,lowerPalette,0,0);
  ctx.restore();ctx.globalAlpha=1;
}
export function drawFoe(ctx,e,t) {
  const x=(e.x+e.w/2)/2,y=(e.y+e.h)/2;
  const type=e.type;
  const rows=type==='sprout'?cell:type==='imp'?frieza:buu;
  const palette=type==='sprout'?cellPalette:type==='imp'?frostPalette:buuPalette;
  stamp(ctx,rows,palette,x,y-(Math.sin(t*10+e.x)>0?1:0),1.15,e.facing>0);
}
