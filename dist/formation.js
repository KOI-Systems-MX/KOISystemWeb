const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export function formationAt(time,seed=0){
  const t=Math.max(0,time-seed*.07);
  return {density:.10+.90*ease(t/6.8),gather:ease((t+.6)/6.2),color:ease((t-5)/6.5),environment:ease((t-2)/9),phase:t<1.5?0:t<4.5?1:t<7?2:t<12?3:4};
}
// The ink frontier is attached to material coordinates on the moving spine.
// Adjacent scales share a smooth arrival time; there is no screen-space mask.
export function materialFrontier(u,v=0,seed=0){return 4.1+(1-u)*2.3+Math.sin(u*11+seed)*.65+Math.sin(v*9+u*4)*.35+seed*.07;}
export function materialAt(time,u,v=0,seed=0){return ease((time-materialFrontier(u,v,seed))/3.4);}
// Code and pigment share a living trajectory; motion grows continuously during birth.
export function koiBirthAt(time,seed=0){
  const swimAt=10.8+seed*.07;
  return {gather:ease((time-seed*.07)/3.6),density:.08+.92*ease((time-seed*.07)/3.4),
    state:time<3?'EMERGING':time<swimAt?'ASSEMBLING':'SWIMMING',
    swimming:true,formed:time>=swimAt,motion:.3+.7*ease(time/swimAt),swimAt,tail:1};
}
