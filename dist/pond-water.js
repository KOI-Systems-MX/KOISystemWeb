import {rippleAt} from './hydrodynamics.js';
export function waterField(x,y,t){return Math.sin(x*.009+y*.006-t*.34)*.65+Math.sin(-x*.005+y*.013+t*.24)*.35;}
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

const vertex=`#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment=`#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
out vec4 color;
vec2 hash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i).x,hash2(i+vec2(1,0)).x,f.x),mix(hash2(i+vec2(0,1)).x,hash2(i+1.).x,f.x),f.y);}
float heightAt(vec2 p){return sin(p.x*3.1+p.y*1.7-time*.19)*.42+sin(p.x*-2.1+p.y*3.3+time*.14)*.33+sin(p.x*5.2+p.y*2.4-time*.11)*.12;}
float cells(vec2 p){
  vec2 i=floor(p),f=fract(p);float first=10.,second=10.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y));vec2 o=hash2(i+g);
    o=.5+.34*sin(time*.075+6.2831*o);
    float d=length(g+o-f);
    if(d<first){second=first;first=d;}else if(d<second)second=d;
  }
  return second-first;
}
void main(){
  vec2 p=gl_FragCoord.xy/resolution.y;
  float h=heightAt(p),eps=.006;
  vec2 slope=vec2(heightAt(p+vec2(eps,0))-heightAt(p-vec2(eps,0)),heightAt(p+vec2(0,eps))-heightAt(p-vec2(0,eps)))/(2.*eps);
  // Refraction displaces only the bottom's pigment/grain coordinates, not DOM glyphs.
  vec2 bottom=p+slope*.009;
  float pigment=noise(bottom*3.2)*.6+noise(bottom*9.7)*.3+noise(bottom*28.)*.1;
  vec3 sand=mix(vec3(.973,.969,.945),vec3(.863,.910,.929),smoothstep(.18,.85,pigment)*.42);
  float pool=exp(-length((p-vec2(resolution.x/resolution.y*.74,.48))*vec2(.7,1.)));
  sand=mix(sand,vec3(.76,.835,.89),pool*.065);
  vec2 warp=bottom*4.2+vec2(sin(p.y*3.4+time*.08),cos(p.x*3.7-time*.07))*.66;
  warp+=vec2(noise(p*3.3+time*.025)-.5,noise(p*3.7-time*.021+8.)-.5)*.55;
  float edge=cells(warp),edge2=cells(warp*1.31+vec2(4.1,2.7));
  float caustic=exp(-edge*edge*900.)*.023+exp(-edge2*edge2*1100.)*.013;
  float shadow=smoothstep(.03,.19,edge)*.012;
  float tooth=(hash2(floor(gl_FragCoord.xy)).x-.5)*.008;
  color=vec4(sand+vec3(caustic-shadow+tooth)+vec3(.003,.005,.007)*h,1.);
}`;

function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}

export function createPondFloor(canvas){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(gl){
    try{
      const program=gl.createProgram(),vs=compile(gl,gl.VERTEX_SHADER,vertex),fs=compile(gl,gl.FRAGMENT_SHADER,fragment);
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      gl.useProgram(program);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      const res=gl.getUniformLocation(program,'resolution'),clock=gl.getUniformLocation(program,'time');
      return {mode:'webgl2',draw(t){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.965,.961,.931,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(res,canvas.width,canvas.height);gl.uniform1f(clock,t);gl.drawArrays(gl.TRIANGLES,0,3);},dispose(){gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}};
    }catch(error){console.warn('KOI water shader unavailable',error);}
  }
  // A fresh canvas is needed after an unsuccessful WebGL context; no dependencies.
  const fallback=document.createElement('canvas');fallback.id=canvas.id;fallback.setAttribute('aria-hidden','true');canvas.replaceWith(fallback);
  const ctx=fallback.getContext('2d');
  return {mode:'canvas2d',canvas:fallback,draw(t){
    const w=fallback.width,h=fallback.height;
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f6f4eb');g.addColorStop(.5,'#e8edf1');g.addColorStop(1,'#e4e9ee');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    drawCaustics(ctx,w,h,t,.17);
  },dispose(){}};
}

function drawCaustics(ctx,w,h,t,opacity){
  const unit=Math.min(w,h);
  for(let i=0;i<22;i++){
    const x=hash(i*3+1)*w,y=hash(i*7+4)*h,r=(.035+hash(i*5)*.085)*unit;
    ctx.beginPath();
    for(let k=0;k<=36;k++){
      const a=k/36*Math.PI*2;
      const radius=r*(1+Math.sin(a*3+i+t*.09)*.14+Math.cos(a*2-i-t*.07)*.12);
      const px=x+Math.cos(a)*radius+waterField(x,y,t)*5,py=y+Math.sin(a)*radius*.68;
      k?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }
    ctx.strokeStyle=`rgba(255,255,244,${opacity})`;ctx.lineWidth=1.1;ctx.stroke();
  }
}

export function protectReading(ctx,rects,strength=.9){
  ctx.save();ctx.globalCompositeOperation='destination-out';
  for(const r of rects){
    ctx.save();ctx.shadowColor=`rgba(0,0,0,${strength})`;ctx.shadowBlur=18;ctx.fillStyle=`rgba(0,0,0,${strength})`;
    ctx.beginPath();ctx.roundRect(r.left-4,r.top-3,r.right-r.left+8,r.bottom-r.top+6,10);ctx.fill();ctx.restore();
  }ctx.restore();
}

export function drawWaterSurface(ctx,{width,height},t,rects=[],ripples=[],windows=[]){
  ctx.clearRect(0,0,width,height);ctx.save();
  // Reflected light is continuous and organic; no panel-local parallel ribbons.
  drawCaustics(ctx,width,height,t,.15);
  const x=width*(.56+.08*Math.sin(t*.055)),y=height*(.33+.05*Math.cos(t*.07));
  ctx.save();ctx.translate(x,y);ctx.rotate(-.4);ctx.scale(width*.55,height*.3);
  const sheen=ctx.createRadialGradient(0,0,0,0,0,1);sheen.addColorStop(0,'#f9fafb11');sheen.addColorStop(1,'#ffffff00');ctx.fillStyle=sheen;ctx.fillRect(-1,-1,2,2);ctx.restore();
  for(const ring of ripples){
    const wave=rippleAt(ring,t);if(!wave)continue;
    for(let i=0;i<(ring.kind==='tap'?3:2);i++){const shift=ring.kind==='shock'?(i-.5)*ring.span*.35:0;ctx.beginPath();ctx.ellipse(ring.x+(ring.dirX||0)*shift,ring.y+(ring.dirY||0)*shift,wave.radius+i*8,(wave.radius+i*8)*wave.ratio,ring.angle,0,Math.PI*2);ctx.lineWidth=1.2;ctx.strokeStyle=`rgba(242,248,252,${wave.fade*ring.strength*.32})`;ctx.stroke();}
  }
  ctx.restore();protectReading(ctx,rects,.1);
  if(rects.length){
    const left=Math.min(...rects.map(r=>r.left)),right=Math.max(...rects.map(r=>r.right));
    const top=Math.min(...rects.map(r=>r.top)),bottom=Math.max(...rects.map(r=>r.bottom));
    const w=right-left,h=bottom-top,cx=(left+right)/2,cy=(top+bottom)/2;
    ctx.save();
    // Water above the floor lettering: soft, edgeless colour and passing light.
    // The real glyphs remain sharp and unchanged underneath this surface.
    ctx.save();ctx.translate(cx,cy);ctx.scale(w*.75,h*.8);
    const water=ctx.createRadialGradient(0,0,0,0,0,1);
    water.addColorStop(0,'#7899b926');water.addColorStop(.65,'#a9bed215');water.addColorStop(1,'#7899b900');
    ctx.fillStyle=water;ctx.fillRect(-1,-1,2,2);ctx.restore();
    for(let band=0;band<2;band++){
      const base=top+h*(.3+band*.38+.09*Math.sin(t*.11+band*2));
      const shine=ctx.createLinearGradient(left-32,0,right+32,0);
      shine.addColorStop(0,'#f3f6f800');shine.addColorStop(.25,'#f3f6f835');shine.addColorStop(.65,'#f3f6f858');shine.addColorStop(1,'#f3f6f800');
      ctx.beginPath();
      for(let i=0;i<=40;i++){
        const px=left-32+(w+64)*i/40,py=base+waterField(px,base,t)*15+Math.sin(px*.014+t*.13+band)*4;
        i?ctx.lineTo(px,py):ctx.moveTo(px,py);
      }
      ctx.strokeStyle=shine;ctx.lineWidth=band?1.4:2;ctx.stroke();
    }
    ctx.restore();
  }
  for(const window of windows){
    const {left:x,top:y,width:w,height:h,build=1}=window;if(build<.001)continue;
    ctx.save();ctx.globalAlpha=build;
    ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.clip();
    // The software lies a little below the same water, with soft peripheral depth.
    // No displacement or blur is applied to its real DOM text.
    const veil=ctx.createLinearGradient(x,y,x+w,y+h);
    veil.addColorStop(0,'#7394b42b');veil.addColorStop(.42,'#dde3ea16');veil.addColorStop(1,'#516d882a');
    ctx.fillStyle=veil;ctx.fillRect(x,y,w,h);
    for(const [a,b,c,d] of [[x,y,x+22,y],[x+w,y,x+w-22,y],[x,y,x,y+22],[x,y+h,x,y+h-25]]){
      const edge=ctx.createLinearGradient(a,b,c,d);edge.addColorStop(0,'#31475d1b');edge.addColorStop(1,'#31475d00');
      ctx.fillStyle=edge;ctx.fillRect(x,y,w,h);
    }
    const light=ctx.createRadialGradient(x+w*(.2+.12*Math.sin(t*.13)),y+h*.28,4,x+w*.48,y+h*.4,w*.85);
    light.addColorStop(0,'#f4f6f81a');light.addColorStop(1,'#ffffff00');ctx.fillStyle=light;ctx.fillRect(x,y,w,h);
    ctx.restore();
    // Broad, soft reflections continue past the window edge into the pond.
    // Only light moves above the sharp DOM lettering, never the lettering itself.
    ctx.save();ctx.globalAlpha=build;
    const surfaceLight=ctx.createLinearGradient(x-45,0,x+w+45,0);
    surfaceLight.addColorStop(0,'#f1f4f700');surfaceLight.addColorStop(.2,'#f1f4f728');
    surfaceLight.addColorStop(.55,'#f1f4f74a');surfaceLight.addColorStop(.8,'#f1f4f72a');surfaceLight.addColorStop(1,'#f1f4f700');
    for(let band=0;band<2;band++){
      const base=y+h*(.24+band*.49)+Math.sin(t*.16+band*2)*h*.065;
      ctx.beginPath();
      for(let i=0;i<=40;i++){
        const px=x-45+(w+90)*i/40,py=base+Math.sin(i*.095+t*.12+band)*18+waterField(px,base,t)*9;
        i?ctx.lineTo(px,py):ctx.moveTo(px,py);
      }
      ctx.strokeStyle=surfaceLight;ctx.lineWidth=12;ctx.stroke();
      ctx.lineWidth=1.2;ctx.stroke();
    }
    ctx.restore();
  }
}
