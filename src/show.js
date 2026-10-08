export const REFERENCE_DURATION = 185;
export const FPS = 40;
export const BANK_COLORS = { A: '#edab63', B: '#85b8fb', C: '#9bd6bd' };
export const CUES = [
  { at: 0, name: 'Opening · warm call & response' },
  { at: .16, name: 'Chase · blue ribbons' },
  { at: .32, name: 'Expand · starbursts' },
  { at: .48, name: 'Interlude · soft snowfall' },
  { at: .64, name: 'Build · mirrored colour' },
  { at: .84, name: 'Finale · all together' },
  { at: .975, name: 'Coda · fade to black' },
];
export const clamp = (x, a=0, b=1) => Math.min(b, Math.max(a, x));
export function parseMap(csv) {
  return csv.trim().split(/\r?\n/).slice(1).map(line => {
    const [id,n,start,end,bank,port,sections,local] = line.split(',');
    return { id, count:+n, channelStart:+start, channelEnd:+end, bank, port:+port, sections:+sections, localStart:+local };
  });
}
export function propPositions(prop) {
  const points=[];
  if (prop.id.startsWith('Arch')) {
    const k=+prop.id.slice(4)-1, cx=3.15+k*1.33;
    for(let i=0;i<100;i++) {
      const row=Math.floor(i/50), u=(row ? 49-i%50 : i%50)/49, theta=Math.PI*(1-u);
      points.push([cx+Math.cos(theta)*(.5-row*.032), .10+Math.sin(theta)*(.5-row*.032), 3.35]);
    }
  } else if(prop.id.startsWith('Bar')) {
    const x=[2.55,4.25,6.4,8.05][+prop.id.slice(3)-1];
    for(let i=0;i<50;i++) points.push([x,.13+i/49,1.92]);
  } else if(prop.id.startsWith('Star')) {
    const cx=prop.id==='Star1'?3.35:7.1;
    for(let i=0;i<100;i++) {
      const ring=Math.floor(i/50), edge=Math.floor((i%50)/5), f=(i%5)/5, r=.37-ring*.09;
      const vertex=j=>{const a=Math.PI/2+j*Math.PI/5, rad=j%2?r*.43:r;return [Math.cos(a)*rad,Math.sin(a)*rad]};
      const a=vertex(edge),b=vertex((edge+1)%10);
      points.push([cx+a[0]+(b[0]-a[0])*f,.79+a[1]+(b[1]-a[1])*f,1.25]);
    }
  } else {
    for(let i=0;i<250;i++) {
      const row=Math.floor(i/25), col=row%2?24-i%25:i%25;
      points.push([5.2+(col-12)*.05,.58+row*.05,1.2]);
    }
  }
  return points;
}
export function makeLayout(props) {
  const pixels=[];
  for(const prop of props) for(const [local,position] of propPositions(prop).entries()) pixels.push({ prop, local, position, index:pixels.length });
  return pixels;
}
export function cueAt(time,duration) {
  const fraction=time/Math.max(duration,.1);
  return CUES.filter(c=>c.at<=fraction).at(-1) || CUES[0];
}
const palette=[[1,.61,.24],[.12,.4,1],[.1,1,.72],[1,.17,.12],[.7,.3,1]];
export function renderFrame(pixels,time,duration,brightness=.3,analysis=null,white=false,out=new Float32Array(pixels.length*3)) {
  const p=clamp(time/duration), section=CUES.indexOf(cueAt(time,duration));
  const feature=analysis?.[Math.min(analysis.length-1,Math.floor(time*FPS))];
  // A demo pulse is a composition choice, never a claim about the reference's BPM.
  const pulse=feature ? feature.hit : Math.exp(-((time%(.4))/.09));
  const energy=feature ? feature.energy : .45+.25*Math.sin(time*.65);
  const fade=clamp((duration-time)/(duration*.025));
  for(const pixel of pixels) {
    const {prop,local}=pixel, u=local/prop.count, arch=prop.id.startsWith('Arch'), star=prop.id.startsWith('Star'), matrix=prop.id.startsWith('Matrix');
    const group=Number(prop.id.match(/\d+$/)?.[0]||1), bank=['A','B','C'].indexOf(prop.bank);
    let col=palette[0], value=.05;
    if(section===0) value=(Math.floor(time/.8)%2===bank%2? .17+.83*pulse:.025)*(star?.5:1);
    if(section===1) {col=palette[1]; const head=(time*.8+group*.21)%1;value=.04+.9*Math.exp(-Math.pow((u-head)*8,2))+.2*pulse;}
    if(section===2) {col=palette[star?0:2];value=star?.15+.85*pulse:.05+.6*(.5+.5*Math.sin(u*12-time*5))*(.25+energy);}
    if(section===3) {col=[.4,.65,1];value=.06+.35*Math.pow(.5+.5*Math.sin(time*1.8+local*2.37+group),7);}
    if(section===4) {col=palette[Math.floor(time/1.6+bank)%5];value=.12+.55*energy+.6*pulse;if(arch)value*=.3+.7*(.5+.5*Math.sin(u*13-time*6));}
    if(section>=5) {col=palette[arch?1:0];value=.32+.45*energy+.4*pulse;}
    if(matrix&&!white) {const row=Math.floor(local/25),x=row%2?24-local%25:local%25;const head=Math.floor(time*8)%25;value*=section>=5?(((x-12)**2+(row-4)**2<15)?.95:.12):(Math.abs(x-head)<2?1:.12);}
    if(time>=duration) value=0;
    const gain=white?brightness:clamp(value)*brightness*fade;
    for(let c=0;c<3;c++) out[pixel.index*3+c]=white?brightness:clamp(col[c]*gain);
  }
  return out;
}
export function estimatePower(pixels,colors) {
  const watts={A:0,B:0,C:0};
  for(const p of pixels) watts[p.prop.bank]+=(colors[p.index*3]+colors[p.index*3+1]+colors[p.index*3+2])*.24;
  return {watts,total:Object.values(watts).reduce((a,b)=>a+b,0)};
}
export function analyzeSamples(samples,sampleRate) {
  const stride=Math.round(sampleRate/FPS),features=[];let slow=.0001,last=0;
  for(let start=0;start<samples.length;start+=stride) {
    let sum=0;for(let i=start;i<Math.min(samples.length,start+stride);i++) sum+=samples[i]**2;
    const rms=Math.sqrt(sum/stride),onset=Math.max(0,rms-last),hit=clamp(onset/(slow*.4+.008));
    slow=slow*.95+rms*.05;last=rms;features.push({energy:clamp(rms/(slow*1.8+.015)),hit,rms});
  }
  // Extend short onset flashes to three frames so isolated transients stay visible.
  for(let i=features.length-1;i>=0;i--) features[i].hit=Math.max(features[i].hit,(features[i-1]?.hit||0)*.75,(features[i-2]?.hit||0)*.5);
  return features;
}
