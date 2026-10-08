from pathlib import Path
import csv, html, re
out=Path('outputs')
def svgwrap(body, h=720):
 return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="{h}" viewBox="0 0 1200 {h}"><style>text{{font-family:Arial,sans-serif;fill:#172c3a}} .title{{font-size:28px;font-weight:bold}} .label{{font-size:17px}} .small{{font-size:14px}} .box{{fill:#f0f5f7;stroke:#536e7d;stroke-width:2}} .dc{{stroke:#d45435;stroke-width:3;fill:none}} .net{{stroke:#287ac0;stroke-width:3;fill:none}} .ground{{stroke:#359868;stroke-width:3;fill:none}}</style><rect width="1200" height="{h}" fill="white"/>{body}</svg>'''
b='''<text x="40" y="48" class="title">Ground-level layout • schematic, not to scale</text>
<text x="40" y="77" class="small">Based on the recovered brick-house concept. Verify measurements and real site conditions.</text>
<rect x="40" y="105" width="1120" height="230" fill="#f5ece4" stroke="#997f71"/>
<text x="515" y="143" class="label">ENTIRE UPPER FACADE / ROOF UNLIT</text>
<text x="500" y="172" class="small">Removal coordinates: (35%,23%) · (79%,23%) · (93%,30%)</text>
<rect x="60" y="188" width="285" height="137" fill="#dce1e5" stroke="#536e7d"/>
<text x="89" y="247" class="label">Garages: no lighting</text><text x="88" y="275" class="small">Left zone (4%,43%) excluded</text>
<rect x="414" y="216" width="98" height="119" fill="#dce1e5" stroke="#536e7d"/>
<text x="423" y="262" class="small">Front door</text><text x="423" y="286" class="small">no garland</text>
<rect x="40" y="335" width="315" height="290" fill="#f2f4f5"/><text x="95" y="479" class="label">Parking / driveway</text><text x="94" y="508" class="small">Keep clear; no props or cables</text>
<rect x="402" y="335" width="133" height="290" fill="#f2f4f5"/><text x="420" y="478" class="label">Clear path</text><text x="415" y="506" class="small">to front door</text>
<rect x="570" y="350" width="590" height="275" fill="#edf6ef" stroke="#359868"/><text x="590" y="377" class="label">Private right garden • all low, freestanding props</text>
<rect x="795" y="398" width="180" height="68" fill="#d5eaf6" stroke="#287ac0"/><text x="816" y="426" class="label">Matrix 25 × 10</text><text x="822" y="451" class="small">250px, bank C</text>
<text x="630" y="436" font-size="54" fill="#dc9c24">☆</text><text x="1012" y="436" font-size="54" fill="#dc9c24">☆</text>
<text x="610" y="466" class="small">Star1 / A</text><text x="1000" y="466" class="small">Star2 / B</text>'''
for i,x in enumerate([620,755,890,1025],1):
 b+=f'<path d="M{x} 592 Q{x+47} 505 {x+94} 592" fill="none" stroke="#287ac0" stroke-width="8"/><text x="{x}" y="613" class="small">Arch{i} / {"A" if i<3 else "B"}</text>'
for i,x in enumerate([590,735,985,1130],1):
 b+=f'<path d="M{x} 535 L{x} 480" stroke="#cf5e37" stroke-width="8"/><text x="{x-15}" y="553" class="small">Bar{i}</text>'
b+='''<text x="590" y="650" class="small">Banks: A=350px · B=350px · C=350px. Maximum prop height1.2m.</text>
<text x="40" y="687" class="label">Public pavement stays clear • no ladder, wall fixings, trees or facade wash</text>'''
out.joinpath('layout.svg').write_text(svgwrap(b))
b='''<text x="40" y="48" class="title">Power and control • three independent 350-pixel banks</text>
<text x="40" y="78" class="small">Planning diagram. Mains assembly / site protection require a qualified electrician.</text>
<rect x="40" y="110" width="315" height="83" class="box"/><text x="58" y="140" class="label">xLights → FSEQ + exact audio</text><text x="58" y="170" class="small">One FPP player → wired audio speaker</text>
<rect x="440" y="110" width="235" height="83" class="box"/><text x="465" y="142" class="label">Ethernet switch</text><text x="465" y="171" class="small">DDP realtime frames,40fps</text>
<path d="M355 151 H440" class="net"/>
<rect x="740" y="110" width="410" height="83" class="box"/><text x="760" y="140" class="label">Verified230V circuit / isolation</text><text x="760" y="170" class="small">Suitable30mA RCD; protected earth/mains</text>'''
for j,bank in enumerate('ABC'):
 y=230+j*135
 b+=f'''<rect x="40" y="{y}" width="280" height="102" class="box"/><text x="56" y="{y+28}" class="label">{bank}: Ethernet controller</text><text x="56" y="{y+54}" class="small">Data + GND → props; short data leads</text><text x="56" y="{y+81}" class="small">{"4" if bank!='C' else "3"} data outputs used</text>
<rect x="365" y="{y}" width="255" height="102" class="box"/><text x="383" y="{y+28}" class="label">{bank}:12V PSU /320W</text><text x="383" y="{y+55}" class="small">350 nodes:21A /252W + overhead</text><text x="383" y="{y+82}" class="small">Dry, ventilated, protected terminals</text>
<rect x="665" y="{y}" width="215" height="102" class="box"/><text x="682" y="{y+28}" class="label">7 fused DC branches</text><text x="682" y="{y+56}" class="small">One50-node section each</text><text x="682" y="{y+82}" class="small">3A load;4A fuse* per section</text>
<rect x="925" y="{y}" width="225" height="102" class="box"/><text x="943" y="{y+28}" class="label">350 outdoor pixels</text><text x="943" y="{y+56}" class="small">V+ isolated between sections</text><text x="943" y="{y+82}" class="small">Same-bank reference ground</text>
<path d="M558 193 V{y-10} H180 V{y}" class="net"/><path d="M945 193 V{y-15} H493 V{y}" class="ground"/>
<path d="M620 {y+46} H665 M880 {y+46} H925" class="dc"/>
<path d="M320 {y+80} H345 V{y+117} H1040 V{y+102}" class="net"/>'''
b+='''<text x="40" y="680" class="small">*Fuse selection must protect every downstream wire/connector; confirm ratings, curves and ambient derating.</text>
<text x="40" y="707" class="small">Orange = fused12V power • Blue = Ethernet / pixel data • Green = protected mains route (schematic)</text>
<text x="40" y="734" class="small">Never parallel PSU positives. Only50-node sections on the same bank share return. No pixel current through Ethernet.</text>
<text x="40" y="761" class="small">21 protected sections total. IP68 nodes do not waterproof plugs, cuts or boxes. Software dimming is supplementary.</text>'''
out.joinpath('wiring.svg').write_text(svgwrap(b,790))
rows=[('Arch1',100,'A',1),('Arch2',100,'A',2),('Star1',100,'A',3),('Bar1',50,'A',4),('Arch3',100,'B',1),('Arch4',100,'B',2),('Star2',100,'B',3),('Bar2',50,'B',4),('Matrix25x10',250,'C',1),('Bar3',50,'C',2),('Bar4',50,'C',3)]
with out.joinpath('pixel-map.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['model','pixels','channel_start','channel_end','bank','data_port','50_node_power_sections','local_pixel_start_zero_based']);c=1;offset={'A':0,'B':0,'C':0}
 for name,n,bank,port in rows:
  w.writerow([name,n,c,c+n*3-1,bank,port,n//50,offset[bank]]);c+=n*3;offset[bank]+=n
with out.joinpath('cue-worksheet.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['cue','audio_start_seconds_to_verify','audio_end_seconds_to_verify','proposed_effect','evidence_status'])
 for cue,effect in [('Opening','Warm bars alternate'),('Answer phrase','Left then right arches'),('Ensemble accent','Warm stars and arches hit'),('Fast notes','Blue-white arch chase'),('Sustained phrase','Bars rise and stars expand'),('Build','Mirror groups and add restrained red-green'),('Final passage','Warm low props plus blue arches'),('End','Fade to black')]:w.writerow([cue,'','',effect,'Proposed; exact timing not measured'])

def inline(s):
 s=html.escape(s)
 s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'<a href="\2">\1</a>',s)
 s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
 s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
 return s

def mdhtml(s):
 lines=s.splitlines();r=[];intable=False;inlist=False
 for line in lines+['']:
  if line.startswith('|'):
   if re.match(r'^\|[\s:|\-]+\|$',line):continue
   cells=line.strip('|').split('|')
   if not intable:r.append('<div class="table-wrap"><table>');intable=True;tag='th'
   else:tag='td'
   r.append('<tr>'+''.join(f'<{tag}>{inline(x.strip())}</{tag}>' for x in cells)+'</tr>');continue
  if intable:r.append('</table></div>');intable=False
  m=re.match(r'^\d+\. (.*)',line)
  if m:
   if not inlist:r.append('<ol>');inlist=True
   r.append('<li>'+inline(m.group(1))+'</li>');continue
  if inlist:r.append('</ol>');inlist=False
  if line.startswith('#'):
   h=len(line)-len(line.lstrip('#'));r.append(f'<h{h}>'+inline(line[h:].strip())+f'</h{h}>')
  elif line.strip():r.append('<p>'+inline(line)+'</p>')
 return '\n'.join(r)
sections=[]
for name in ['christmas-show-project.md','eu-sourcing-research.md','technical-research.md']:
 s=out.joinpath(name).read_text();sections.append(mdhtml(s))
sections[0]=sections[0].replace('<h2>3. Pixel and channel schedule</h2>','<img class="diagram" src="layout.svg" alt="Ground level house layout"><h2>3. Pixel and channel schedule</h2>').replace('<h2>6. Sequencing and timing</h2>','<img class="diagram" src="wiring.svg" alt="Three independent power bank diagram"><h2>6. Sequencing and timing</h2>')
css='''body{font:16px/1.65 system-ui,sans-serif;color:#18313d;background:#eef3f5;margin:0}main{max-width:1040px;margin:30px auto;padding:45px;background:white;border-radius:12px}h1{font-size:34px;line-height:1.2}h2{margin-top:40px;border-top:1px solid #dde6e9;padding-top:22px;line-height:1.3}h3{margin-top:25px}a{color:#166697}table{width:100%;border-collapse:collapse;font-size:14px;margin:18px 0}td,th{padding:9px;text-align:left;border:1px solid #dce5e9;vertical-align:top}th{background:#edf5f7}tr:nth-child(even){background:#fafcfd}.table-wrap{overflow:auto}.diagram{width:100%;height:auto;margin:24px 0}li{margin:12px 0}code{background:#eef3f5;padding:2px 4px}header{background:#143746;color:white;padding:22px 40px}header a{color:#ceebf8;margin-right:20px}.appendix{page-break-before:always}@media print{body{background:white;font-size:10pt}main{margin:0;padding:0;max-width:none}header{display:none}h2{page-break-after:avoid}table{font-size:8pt}tr,img{break-inside:avoid}a{color:#18313d;text-decoration:none}.diagram{max-height:19cm}}'''
out.joinpath('christmas-show-project.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Belgian Christmas light show project</title><style>'+css+'</style><header><b>Christmas2026 • build specification</b><br><a href="pixel-map.csv">Pixel map CSV</a><a href="cue-worksheet.csv">Cue worksheet CSV</a><a href="layout.svg">Layout</a><a href="wiring.svg">Wiring</a></header><main>'+sections[0]+'<section class="appendix">'+sections[1]+'</section><section class="appendix">'+sections[2]+'</section></main></html>')
assert c-1==3150 and all(n==350 for n in offset.values())
print('Created guide, two SVG diagrams and two CSV worksheets; verified3150channels and three350pixel banks.')
