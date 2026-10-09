"""Every decoded source frame -> one immutable target RGB frame; no beat generation.
Requires numpy, ffmpeg, ffprobe. Camera samples are an adaptation, not controller data.
"""
import argparse,json,subprocess,hashlib
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('output');p.add_argument('manifest');args=p.parse_args()
W,H=960,540
# Coordinates are in the decoded 960x540 image. Sequential target pixels follow
# these source curves; spatial mapping differs from the actual filmed display.
def poly(points,n):
 a=np.array(points,float);length=np.linalg.norm(np.diff(a,axis=0),axis=1);s=np.r_[0,np.cumsum(length)];u=np.linspace(0,s[-1],n);return np.c_[np.interp(u,s,a[:,0]),np.interp(u,s,a[:,1])]
def circle(x,y,r,n):
 t=np.linspace(0,2*np.pi,n,endpoint=False);return np.c_[x+r*np.cos(t),y+r*np.sin(t)]
def fan(apex,bases,n):
 pts=[]
 for x,y in bases:pts.extend([apex,(x,y),apex])
 return poly(pts,n)
models=[
 ('Arch1','Red candy canes',poly([(370,286),(370,268),(376,265),(379,269),(396,286),(397,266),(404,263),(409,269),(419,283),(421,266),(428,264),(432,270),(438,283)],100)),
 ('Arch2','Left cluster of mini trees',fan((500,254),[(467,303),(480,300),(492,305),(509,305),(523,301)],100)),
 ('Star1','Left green wreath',circle(293,154,13,100)),
 ('Bar1','First quarter of roof icicles',poly([(230,134),(284,103),(328,126)],50)),
 ('Arch3','Right cluster of mini trees',fan((555,254),[(525,306),(542,303),(559,307),(577,302),(604,302)],100)),
 ('Arch4','Large tree fan transferred to a low arch',fan((653,137),[(610,291),(627,290),(641,292),(655,292),(670,292),(688,292),(710,292)],100)),
 ('Star2','Right green wreath',circle(558,149,14,100)),
 ('Bar2','Second quarter of roof icicles',poly([(328,126),(353,137),(430,137)],50)),
 ('Matrix25x10','Central HAPPY HOLIDAYS lettering',np.array([(365+(x+.5)*124/25,151+(9-y+.5)*24/10) for y in range(10) for x in (range(25) if y%2==0 else range(24,-1,-1))])),
 ('Bar3','Third quarter of roof icicles',poly([(430,137),(488,137),(527,113)],50)),
 ('Bar4','Last quarter of roof icicles',poly([(527,113),(559,94),(620,131)],50)),
]
points=np.concatenate([m[2] for m in models]);assert len(points)==1050
xy=np.rint(points).astype(int)
# Pick the brightest actual RGB triplet within a 5x5 neighbourhood. Never take
# independent colour maxima that could invent a colour absent in the source.
off=np.array([(x,y) for y in range(-2,3) for x in range(-2,3)])
xs=np.clip(xy[:,0,None]+off[:,0],0,W-1);ys=np.clip(xy[:,1,None]+off[:,1],0,H-1)
cmd=['ffmpeg','-v','error','-i',args.video,'-map','0:v:0','-vf',f'scale={W}:{H}:flags=area','-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgb24','pipe:1']
proc=subprocess.Popen(cmd,stdout=subprocess.PIPE);samples=[];size=W*H*3
while True:
 raw=bytearray()
 while len(raw)<size:
  chunk=proc.stdout.read(size-len(raw))
  if not chunk:break
  raw.extend(chunk)
 if not raw:break
 if len(raw)!=size:raise RuntimeError('Partial decoded source frame')
 frame=np.frombuffer(raw,np.uint8).reshape(H,W,3);near=frame[ys,xs];bright=near.max(axis=2).argmax(axis=1);samples.append(near[np.arange(1050),bright])
 if len(samples)%1000==0:print('Decoded',len(samples),flush=True)
if proc.wait()!=0:raise RuntimeError('Source decode failed')
a=np.stack(samples).astype(np.float32);baseline=np.percentile(a,5,axis=0);signal=np.maximum(0,a-baseline)
# Suppress dim brick/background and the codec noise floor, with no temporal
# interpolation, smoothing, onset shifting, or musical phase rescaling.
signal[signal.max(axis=2)<35]=0
rgb=np.rint(np.clip(signal*1.6,0,255)*.30).astype(np.uint8)
Path(args.output).write_bytes(rgb.tobytes())
manifest={'method':'Observed-camera RGB samples, one target frame per decoded source frame','frames':len(a),'channels':3150,'analysisResolution':[W,H],'sampleWindow':[5,5],'baselinePercentile':5,'signalThreshold':35,'contrastGain':1.6,'encodedBrightnessCap':.30,'temporalFiltering':'none','sourceSha256':hashlib.sha256(Path(args.video).read_bytes()).hexdigest(),'rgbSha256':hashlib.sha256(rgb.tobytes()).hexdigest(),'limitations':['Spatial adaptation to different props, not original controller data','Camera exposure, bloom, occlusion and compression affect sampled colours','Below-threshold light and source props not mapped are omitted'],'models':[{'target':name,'source':source,'pixels':len(pts),'samples960x540':np.round(pts,3).tolist()} for name,source,pts in models]}
Path(args.manifest).write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({k:manifest[k] for k in ['frames','channels','rgbSha256']}))
