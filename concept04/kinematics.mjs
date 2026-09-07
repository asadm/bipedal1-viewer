export function leg(g,q){
 const a=g.crank_mm,b=g.tie_mm,c=g.coupler_mm,l=g.lower_mm,B=g.body_pin_mm;
 const C=[a*Math.cos(q),-a*Math.sin(q)],dx=B[0]-C[0],dz=B[1]-C[1],d=Math.hypot(dx,dz),h=(c*c-b*b+d*d)/(2*d),square=c*c-h*h;
 if(square<=0)throw Error('Linkage cannot close');
 const k=Math.sqrt(square),D=[C[0]+h*dx/d+k*dz/d,C[1]+h*dz/d-k*dx/d],E=[C[0]+l/c*(C[0]-D[0]),C[1]+l/c*(C[1]-D[1])];
 let phi=Math.atan2(-(E[1]-C[1]),E[0]-C[0]);if(phi<0)phi+=2*Math.PI;
 return{C,D,E,phi,beta:Math.atan2(-(D[1]-B[1]),D[0]-B[0]),knee:phi-q};
}
export function angleAtHeight(g,height){let lo=g.q_low_rad,hi=g.q_high_rad;const low=-leg(g,lo).E[1];for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(-leg(g,mid).E[1]<low+height)lo=mid;else hi=mid;}return(lo+hi)/2;}
export function pose(p,heights){
 const g=p.geometry,angles=heights.map(h=>angleAtHeight(g,h)),legs=angles.map(q=>leg(g,q)),z=.05+Math.max(...legs.map(s=>-s.E[1]/1000));
 const quat=q=>[Math.cos(q/2),0,Math.sin(q/2),0],bodies={chassis:{pos:[0,0,z],quat:quat(0)}},seats=[];
 for(let i=0;i<2;i++){
  const side=i?'right':'left',sign=i?-1:1,q=angles[i],s=legs[i],x=p.pivot_x_m,y=sign*.052;
  bodies[side+'_upper']={pos:[x,y,z],quat:quat(q)};
  bodies[side+'_lower']={pos:[x+s.C[0]/1000,y,z+s.C[1]/1000],quat:quat(s.phi)};
  bodies[side+'_tie']={pos:[x+g.body_pin_mm[0]/1000,y,z+g.body_pin_mm[1]/1000],quat:quat(s.beta)};
  bodies[side+'_wheel']={pos:[x+s.E[0]/1000,sign*p.track_m/2,z+s.E[1]/1000],quat:quat(0)};
  const u=p.spring.upper_seat_from_knee_m,v=p.spring.lower_seat_from_knee_m;
  seats.push([[x+s.C[0]/1000-u*Math.cos(q),y+sign*.008,z+s.C[1]/1000+u*Math.sin(q)],[x+s.C[0]/1000+v*Math.cos(s.phi),y+sign*.008,z+s.C[1]/1000-v*Math.sin(s.phi)]]);
 }
 const compression=seats.map(([a,b])=>Math.max(0,.05-Math.hypot(...a.map((v,i)=>v-b[i]))));
 return {bodies,spring_seats:seats,compression_m:compression,angles,grounded:[true,true],wheel_clearance_m:[0,0],current_A:[0,0],t:0,phase:'pose',body_contact:false,blocks:legs.map(s=>z+s.E[1]/1000-.05)};
}
