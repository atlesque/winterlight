// The source PTS table and RGB bytes are authoritative. Neither playback nor
// hardware export may regenerate effects or substitute nominal-FPS timestamps.
const MAGIC = 'WLT2';
const encoder = new TextEncoder();
export function validateTiming(meta, timestamps, rgb, channels = 3150) {
  if (meta.format !== 'Winterlight source frames v2') throw new Error('Unsupported timing format');
  if (meta.channels !== channels || !Number.isInteger(meta.frameCount) || meta.frameCount < 1) throw new Error('Invalid frame/channel count');
  if (!/^[a-f0-9]{64}$/.test(meta.sourceSha256 || '')) throw new Error('Missing source-video SHA-256');
  if (!/^[a-f0-9]{64}$/.test(meta.channelMapSha256 || '')) throw new Error('Missing channel-map SHA-256');
  if (timestamps.length !== meta.frameCount || rgb.length !== channels * meta.frameCount) throw new Error('Incomplete source-frame coverage');
  if (!Number.isSafeInteger(meta.durationUs) || meta.durationUs <= 0) throw new Error('Invalid source duration');
  for (let i=0;i<timestamps.length;i++) {
    if (!Number.isSafeInteger(timestamps[i]) || timestamps[i] < 0 || timestamps[i] >= meta.durationUs) throw new Error(`Invalid PTS at frame ${i}`);
    if (i && timestamps[i] <= timestamps[i-1]) throw new Error(`PTS must increase strictly at frame ${i}`);
  }
  return { meta, timestamps, rgb };
}
export function encodeTiming(meta, timestamps, rgb) {
  validateTiming(meta,timestamps,rgb,meta.channels);
  const header=encoder.encode(JSON.stringify(meta));
  const out=new Uint8Array(8+header.length+timestamps.length*8+rgb.length),view=new DataView(out.buffer);
  out.set(encoder.encode(MAGIC));view.setUint32(4,header.length,true);out.set(header,8);
  for(let i=0;i<timestamps.length;i++) view.setBigUint64(8+header.length+i*8,BigInt(timestamps[i]),true);
  out.set(rgb,8+header.length+timestamps.length*8);return out;
}
export function decodeTiming(input, channels=3150) {
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  if(bytes.length<8||new TextDecoder().decode(bytes.subarray(0,4))!==MAGIC) throw new Error('Choose a WLT2 .wltiming file');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),headerLength=view.getUint32(4,true);
  if(headerLength>1048576||8+headerLength>bytes.length) throw new Error('Invalid timing header');
  const meta=JSON.parse(new TextDecoder().decode(bytes.subarray(8,8+headerLength)));
  if(!Number.isSafeInteger(meta.frameCount)||meta.frameCount<1||meta.channels!==channels) throw new Error('Invalid timing dimensions');
  const start=8+headerLength,expected=start+meta.frameCount*(8+channels);
  if(expected!==bytes.length) throw new Error('Truncated timing file or unexpected trailing bytes');
  const timestamps=new Float64Array(meta.frameCount);
  for(let i=0;i<meta.frameCount;i++)timestamps[i]=Number(view.getBigUint64(start+i*8,true));
  return validateTiming(meta,timestamps,bytes.subarray(start+meta.frameCount*8),channels);
}
export function frameAtUs(sequence, mediaUs) {
  if (!Number.isFinite(mediaUs)) throw new Error('Invalid media timestamp');
  if(mediaUs<sequence.timestamps[0]||mediaUs>=sequence.meta.durationUs)return -1;
  let lo=0,hi=sequence.timestamps.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(sequence.timestamps[mid]<=mediaUs)lo=mid+1;else hi=mid;}
  return lo-1;
}
export function copyFrame(sequence,index,out) {
  if(out.length!==sequence.meta.channels)throw new Error('Output channel map differs from sequence');
  if(index<0||index>=sequence.meta.frameCount){out.fill(0);return out;}
  const start=index*sequence.meta.channels;
  for(let c=0;c<out.length;c++)out[c]=sequence.rgb[start+c]/255;
  return out;
}
export async function sha256(input) {
  const data=input instanceof Blob?await input.arrayBuffer():input;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
}
