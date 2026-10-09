// Preview and main show share the approved physical layout.
export {PROPS as proposalProps,propPositions as proposalPositions} from './props.js';
import {PROPS,propPositions} from './props.js';
export function proposalLayout(){
  const pixels=[];
  for(const prop of PROPS)for(const [local,position] of propPositions(prop).entries())pixels.push({prop,local,position,index:pixels.length});
  return pixels;
}
