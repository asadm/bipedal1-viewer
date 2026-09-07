// Concept-02 prescribed poses. This controls arm positions, not a simulated jump.
export function angleRange(p) {
  return [Math.asin(p.low_axle_drop/p.arm_length), Math.asin((p.low_axle_drop+p.height_range)/p.arm_length)];
}
export function pose(p, angle, leftBump=0, rightBump=0) {
  const [low, high] = angleRange(p);
  const q=Math.max(low,Math.min(high,angle));
  const drop=p.arm_length*Math.sin(q);
  const result={angle:q,height:drop-p.low_axle_drop,bodyZ:p.wheel_radius+drop};
  for (const [side,bump] of [['left',leftBump],['right',rightBump]]) {
    const sideDrop=drop-bump;
    result[side]={angle:Math.asin(sideDrop/p.arm_length),
      wheel:[p.pivot_x+Math.sqrt(p.arm_length**2-sideDrop**2),0,-sideDrop],bump};
  }
  return result;
}
export function transformFor(part,p,state) {
  if (part.group.endsWith('_arm')) {
    const side=part.group.split('_')[0];
    return {position:[p.pivot_x,0,state.bodyZ],angle:state[side].angle};
  }
  if (part.group.endsWith('_wheel')) {
    const wheel=state[part.group.split('_')[0]].wheel;
    return {position:[wheel[0],0,wheel[2]+state.bodyZ],angle:0};
  }
  return {position:[0,0,state.bodyZ],angle:0};
}
