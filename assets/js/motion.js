/* Incompressible 2D fluid: velocity advection, vorticity, pressure, and dye.
   Rendered behind the page. No cursor replacement or magnetic hover effects. */
(() => {
  'use strict';
  const vertex = `#version 300 es
    precision highp float;
    out vec2 uv;
    void main() {
      vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
      uv = p;
      gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
    }`;
  const shaders = {
    splat: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D source;
      uniform vec2 point;
      uniform vec3 color;
      uniform float aspect, radius;
      void main() {
        vec2 p = uv - point; p.x *= aspect;
        vec3 ink = exp(-dot(p,p) / radius) * color;
        result = vec4(texture(source, uv).xyz + ink, 1.0);
      }`,
    advect: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D velocity, source;
      uniform vec2 texel;
      uniform float dt, decay;
      void main() {
        vec2 coord = uv - dt * texture(velocity, uv).xy * texel;
        result = texture(source, coord) / (1.0 + decay * dt);
      }`,
    curl: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D velocity;
      uniform vec2 texel;
      void main() {
        float L = texture(velocity, uv - vec2(texel.x,0)).y;
        float R = texture(velocity, uv + vec2(texel.x,0)).y;
        float B = texture(velocity, uv - vec2(0,texel.y)).x;
        float T = texture(velocity, uv + vec2(0,texel.y)).x;
        result = vec4(0.5 * (R-L-T+B),0,0,1);
      }`,
    vorticity: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D velocity, curls;
      uniform vec2 texel;
      uniform float dt;
      void main() {
        float L = texture(curls, uv-vec2(texel.x,0)).x;
        float R = texture(curls, uv+vec2(texel.x,0)).x;
        float B = texture(curls, uv-vec2(0,texel.y)).x;
        float T = texture(curls, uv+vec2(0,texel.y)).x;
        float C = texture(curls, uv).x;
        vec2 force = 0.5 * vec2(abs(T)-abs(B),abs(R)-abs(L));
        force /= length(force)+0.0001;
        force *= 5.0*C; force.y *= -1.0;
        vec2 v = texture(velocity,uv).xy + force*dt;
        result = vec4(clamp(v,vec2(-700),vec2(700)),0,1);
      }`,
    divergence: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D velocity;
      uniform vec2 texel;
      void main() {
        vec2 C = texture(velocity,uv).xy;
        float L = texture(velocity,uv-vec2(texel.x,0)).x;
        float R = texture(velocity,uv+vec2(texel.x,0)).x;
        float B = texture(velocity,uv-vec2(0,texel.y)).y;
        float T = texture(velocity,uv+vec2(0,texel.y)).y;
        if (uv.x<texel.x) L=-C.x;
        if (uv.x>1.0-texel.x) R=-C.x;
        if (uv.y<texel.y) B=-C.y;
        if (uv.y>1.0-texel.y) T=-C.y;
        result=vec4(0.5*(R-L+T-B),0,0,1);
      }`,
    fade: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D source;
      void main() { result=texture(source,uv)*0.8; }`,
    pressure: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D pressure, divergence;
      uniform vec2 texel;
      void main() {
        float L=texture(pressure,uv-vec2(texel.x,0)).x;
        float R=texture(pressure,uv+vec2(texel.x,0)).x;
        float B=texture(pressure,uv-vec2(0,texel.y)).x;
        float T=texture(pressure,uv+vec2(0,texel.y)).x;
        float d=texture(divergence,uv).x;
        result=vec4((L+R+B+T-d)*0.25,0,0,1);
      }`,
    project: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D velocity, pressure;
      uniform vec2 texel;
      void main() {
        float L=texture(pressure,uv-vec2(texel.x,0)).x;
        float R=texture(pressure,uv+vec2(texel.x,0)).x;
        float B=texture(pressure,uv-vec2(0,texel.y)).x;
        float T=texture(pressure,uv+vec2(0,texel.y)).x;
        result=vec4(texture(velocity,uv).xy-vec2(R-L,T-B),0,1);
      }`,
    display: `#version 300 es
      precision highp float;
      in vec2 uv; out vec4 result;
      uniform sampler2D dye;
      uniform vec2 texel;
      uniform float dark, fadeOut;
      void main() {
        vec2 blur=texel*3.0;
        vec3 c=texture(dye,uv).rgb*0.4;
        c+=texture(dye,uv+vec2(blur.x,0)).rgb*0.15;
        c+=texture(dye,uv-vec2(blur.x,0)).rgb*0.15;
        c+=texture(dye,uv+vec2(0,blur.y)).rgb*0.15;
        c+=texture(dye,uv-vec2(0,blur.y)).rgb*0.15;
        c=max(c,vec3(0));
        float energy=max(c.r,max(c.g,c.b));
        float L=length(texture(dye,uv-vec2(texel.x,0)).rgb);
        float R=length(texture(dye,uv+vec2(texel.x,0)).rgb);
        float B=length(texture(dye,uv-vec2(0,texel.y)).rgb);
        float T=length(texture(dye,uv+vec2(0,texel.y)).rgb);
        vec3 normal=normalize(vec3((R-L)*2.0,(T-B)*2.0,0.7));
        float sheen=pow(max(dot(normal,normalize(vec3(-0.4,0.5,1.0))),0.0),12.0);
        vec3 hue=1.0-exp(-c*1.4);
        vec3 color=mix(c/max(energy,0.001)*0.7,hue+vec3(sheen*0.035),dark);
        float alpha=(1.0-exp(-energy*1.1))*mix(0.30,0.94,dark)*fadeOut;
        result=vec4(clamp(color,0.0,1.0),alpha);
      }`
  };
  const canvas = document.querySelector('.cursor-paint');
  if (!canvas) return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let gl, programs = {}, targets = [], fields, vao;
  let frame = null, lastFrame = 0, lastInput = 0, previous = null, pending = null;
  let enabled = false, lost = false, seeded = false;
  const root = document.documentElement;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message);
    }
    return shader;
  }
  function initialize() {
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) return false;
    const vert = compile(gl.VERTEX_SHADER, vertex);
    Object.entries(shaders).forEach(([name, source]) => {
      const frag = compile(gl.FRAGMENT_SHADER, source);
      const program = gl.createProgram();
      gl.attachShader(program, vert); gl.attachShader(program, frag); gl.linkProgram(program);
      gl.deleteShader(frag);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      const uniforms = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
      programs[name] = { program, uniforms };
    });
    gl.deleteShader(vert);
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.disable(gl.BLEND); gl.clearColor(0,0,0,0);
    return true;
  }
  function release() {
    targets.forEach(target => { gl.deleteTexture(target.texture); gl.deleteFramebuffer(target.fbo); });
    targets = []; fields = null;
  }
  function target(width, height, linear) {
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,width,height,0,gl.RGBA,gl.HALF_FLOAT,null);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    const result = { texture, fbo, width, height }; targets.push(result);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Fluid framebuffer unavailable');
    gl.viewport(0,0,width,height); gl.clear(gl.COLOR_BUFFER_BIT);
    return result;
  }
  function pair(width, height, linear) {
    return { read: target(width,height,linear), write: target(width,height,linear), swap() { [this.read,this.write]=[this.write,this.read]; } };
  }
  function dimensions(base) {
    const aspect = canvas.width/canvas.height;
    return aspect >= 1 ? [Math.round(base*aspect),base] : [base,Math.round(base/aspect)];
  }
  function resize() {
    stop(); release();
    const w=Math.max(1,window.innerWidth), h=Math.max(1,window.innerHeight);
    const scale=Math.min(window.devicePixelRatio || 1,1.25,Math.sqrt(2200000/(w*h)));
    canvas.width=Math.round(w*scale); canvas.height=Math.round(h*scale);
    const [sw,sh]=dimensions(112), [dw,dh]=dimensions(384);
    fields={ velocity:pair(sw,sh,true), dye:pair(dw,dh,true), pressure:pair(sw,sh,false), curl:target(sw,sh,false), divergence:target(sw,sh,false), texel:[1/sw,1/sh] };
  }
  function pass(name, output, textures, values={}) {
    const shader=programs[name]; gl.useProgram(shader.program);
    Object.entries(textures).forEach(([key,value],unit) => {
      gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,value.texture);
      gl.uniform1i(shader.uniforms[key],unit);
    });
    Object.entries(values).forEach(([key,value]) => {
      const location=shader.uniforms[key];
      if (Array.isArray(value)) {
        if (value.length===2) gl.uniform2f(location,...value); else gl.uniform3f(location,...value);
      } else gl.uniform1f(location,value);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER,output ? output.fbo : null);
    gl.viewport(0,0,output ? output.width : canvas.width,output ? output.height : canvas.height);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function splat(x,y,dx,dy,color,radius=0.0045) {
    const values={ point:[x,y], aspect:canvas.width/canvas.height, radius };
    pass('splat',fields.velocity.write,{source:fields.velocity.read},{...values,color:[dx,dy,0]}); fields.velocity.swap();
    pass('splat',fields.dye.write,{source:fields.dye.read},{...values,color}); fields.dye.swap();
  }
  function colorAt(time) {
    const t=time*0.00085;
    return [0,2.094,4.188].map(offset => 0.012+Math.pow(0.5+0.5*Math.cos(t+offset),3)*0.8);
  }
  function seed() {
    // A single broad curl introduces the interaction without an endless animation.
    for (let i=0;i<7;i++) {
      const a=i*0.62;
      splat(0.38+Math.cos(a)*0.13,0.53+Math.sin(a)*0.20,-Math.sin(a)*65,Math.cos(a)*65,[0.04,0.12+i*0.035,1.0],0.009);
    }
    seeded=true; lastInput=performance.now(); schedule();
  }
  function step(dt) {
    const f=fields, texel=f.texel;
    pass('curl',f.curl,{velocity:f.velocity.read},{texel});
    pass('vorticity',f.velocity.write,{velocity:f.velocity.read,curls:f.curl},{texel,dt}); f.velocity.swap();
    pass('divergence',f.divergence,{velocity:f.velocity.read},{texel});
    pass('fade',f.pressure.write,{source:f.pressure.read}); f.pressure.swap();
    for (let i=0;i<18;i++) { pass('pressure',f.pressure.write,{pressure:f.pressure.read,divergence:f.divergence},{texel}); f.pressure.swap(); }
    pass('project',f.velocity.write,{velocity:f.velocity.read,pressure:f.pressure.read},{texel}); f.velocity.swap();
    pass('advect',f.velocity.write,{velocity:f.velocity.read,source:f.velocity.read},{texel,dt,decay:0.8}); f.velocity.swap();
    pass('advect',f.dye.write,{velocity:f.velocity.read,source:f.dye.read},{texel,dt,decay:1.0}); f.dye.swap();
  }
  function draw(time) {
    if (!enabled || lost || document.hidden || !fields) { stop(); return; }
    const dt=lastFrame ? Math.min((time-lastFrame)/1000,1/30) : 1/60; lastFrame=time;
    if (pending) {
      const p=pending; pending=null;
      splat(p.x,p.y,p.dx,p.dy,colorAt(time),0.0035+Math.min(Math.hypot(p.dx,p.dy)/80000,0.005));
    }
    step(dt);
    const idle=(time-lastInput)/1000;
    pass('display',null,{dye:fields.dye.read},{texel:[1/fields.dye.read.width,1/fields.dye.read.height],dark:root.dataset.theme==='dark'?1:0,fadeOut:Math.min(1,Math.max(0,8-idle))});
    if (idle<8) frame=requestAnimationFrame(draw); else stop();
  }
  function schedule() { if (frame===null && enabled && !document.hidden) frame=requestAnimationFrame(draw); }
  function stop() {
    if (frame!==null) cancelAnimationFrame(frame);
    frame=null; lastFrame=0; previous=null; pending=null;
    if (gl && !lost) {
      targets.forEach(target => { gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo); gl.clear(gl.COLOR_BUFFER_BIT); });
      gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }
  function capability() {
    enabled=fine.matches && !reduced.matches && !lost;
    canvas.hidden=!enabled;
    if (!enabled) { stop(); if (gl && !lost) release(); return; }
    try { resize(); if (!seeded) seed(); }
    catch (_) { enabled=false; canvas.hidden=true; stop(); release(); }
  }
  try { if (!initialize()) return; } catch (_) { canvas.hidden=true; return; }
  document.addEventListener('pointermove',event => {
    if (!enabled || document.hidden || event.pointerType==='touch' || !fields) return;
    if (event.target instanceof Element && event.target.closest('.robot-companion, input, textarea, select, [contenteditable="true"]')) { previous=null; return; }
    const now=performance.now(), x=event.clientX/window.innerWidth, y=1-event.clientY/window.innerHeight;
    const origin=previous && now-previous.time<150 ? previous : {x,y};
    const clamp=value=>Math.max(-400,Math.min(400,value));
    const dx=clamp((x-origin.x)*2800), dy=clamp((y-origin.y)*2800);
    previous={x,y,time:now}; lastInput=now;
    if (Math.hypot(dx,dy)>0.5) {
      pending={x,y,dx:clamp(dx+(pending ? pending.dx : 0)),dy:clamp(dy+(pending ? pending.dy : 0))}; schedule();
    }
  },{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget) previous=null;},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('blur',stop);
  window.addEventListener('scroll',()=>{previous=null;},{passive:true});
  window.addEventListener('resize',()=>{if(fine.matches && !reduced.matches && !lost)capability();},{passive:true});
  fine.addEventListener('change',capability); reduced.addEventListener('change',capability);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;enabled=false;canvas.hidden=true;stop();targets=[];fields=null;});
  canvas.addEventListener('webglcontextrestored',()=>{
    lost=false; programs={}; seeded=false;
    try { if(initialize())capability(); } catch (_) { enabled=false;canvas.hidden=true; }
  });
  capability();
})();
