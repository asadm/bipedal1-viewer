import {pose as basePose} from '../concept04/kinematics.mjs';
export {leg,angleAtHeight} from '../concept04/kinematics.mjs';
export function pose(p,heights){
 const f=basePose(p,heights);
 // Both seats are on the same lateral plane, so moving that plane preserves length.
 for(let i=0;i<2;i++)for(const seat of f.spring_seats[i])seat[1]=(i?-1:1)*(.052+p.spring.seat_y_from_leg_m);
 return f;
}
