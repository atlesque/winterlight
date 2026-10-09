"""Every decoded source frame -> one immutable target RGB frame; no beat generation.
Requires numpy, ffmpeg, ffprobe. Camera samples are an adaptation, not controller data.
"""
import argparse,json,subprocess,hashlib
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('output');p.add_argument('manifest');args=p.parse_args()
W,H=960,540
# Approved sampling coordinates are shared with the migration provenance.
mapping=json.loads(Path('outputs/source-mapping.json').read_text())
models=[(m['target'],m['source'],np.array(m['samples960x540'],float)) for m in mapping['models']]
points=np.concatenate([m[2] for m in models]);node_count=len(points)
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
 frame=np.frombuffer(raw,np.uint8).reshape(H,W,3);near=frame[ys,xs];bright=near.max(axis=2).argmax(axis=1);samples.append(near[np.arange(node_count),bright])
 if len(samples)%1000==0:print('Decoded',len(samples),flush=True)
if proc.wait()!=0:raise RuntimeError('Source decode failed')
a=np.stack(samples).astype(np.float32);baseline=np.percentile(a,5,axis=0);signal=np.maximum(0,a-baseline)
# Suppress dim brick/background and the codec noise floor, with no temporal
# interpolation, smoothing, onset shifting, or musical phase rescaling.
signal[signal.max(axis=2)<35]=0
rgb=np.rint(np.clip(signal*1.6,0,255)*.30).astype(np.uint8)
Path(args.output).write_bytes(rgb.tobytes())
manifest={'method':'Observed-camera RGB samples, one target frame per decoded source frame','frames':len(a),'channels':node_count*3,'analysisResolution':[W,H],'sampleWindow':[5,5],'baselinePercentile':5,'signalThreshold':35,'contrastGain':1.6,'encodedBrightnessCap':.30,'temporalFiltering':'none','sourceSha256':hashlib.sha256(Path(args.video).read_bytes()).hexdigest(),'rgbSha256':hashlib.sha256(rgb.tobytes()).hexdigest(),'limitations':['Spatial adaptation to different props, not original controller data','Camera exposure, bloom, occlusion and compression affect sampled colours','Below-threshold light and source props not mapped are omitted'],'models':[{'target':name,'source':source,'pixels':len(pts),'samples960x540':np.round(pts,3).tolist()} for name,source,pts in models]}
Path(args.manifest).write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({k:manifest[k] for k in ['frames','channels','rgbSha256']}))
