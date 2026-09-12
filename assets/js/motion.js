/* A decorative 4D nearest-neighbor graph projected into 3D, then onto the page.
   Cursor motion changes the viewpoint and explores local paths through the graph. */
(() => {
  'use strict';
  const canvas = document.querySelector('.model-space');
  if (!canvas) return;
  let ctx;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) { return; }
  if (!ctx) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let width = 1, height = 1, frame = null, lastFrame = 0, lastInput = -10000;
  let hovering = false, selected = -1, lastSelection = -10000;
  let signals = [], projected = [], dark = root.dataset.theme === 'dark';
  const pointer = { x: 0, y: 0 };
  const camera = { x: 0, y: 0 }, desired = { x: 0, y: 0 };
  let seed = 731;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const count = 156;
  const nodes = Array.from({ length: count }, (_, index) => {
    // Stratified layers and a small fourth coordinate give the graph coherent depth.
    const layer = index % 6;
    return { x: (random() - .5) * 2.8, y: (random() - .5) * 1.9, z: (layer / 5 - .5) * 1.8 + (random() - .5) * .2, w: (random() - .5) * 1.4, layer };
  });
  const neighbors = Array.from({ length: count }, () => []);
  const edges = [];
  const edgeKeys = new Set();
  nodes.forEach((node, i) => {
    const nearest = nodes.map((other, j) => ({ j, distance: (node.x-other.x)**2 + (node.y-other.y)**2 + (node.z-other.z)**2 + (node.w-other.w)**2 * .45 }))
      .filter(other => other.j !== i).sort((a,b) => a.distance-b.distance).slice(0,3);
    nearest.forEach(({j}) => {
      const key = Math.min(i,j) + ':' + Math.max(i,j);
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key); edges.push([i,j]); neighbors[i].push(j); neighbors[j].push(i);
    });
  });
  function project() {
    const yaw = camera.x * .30, pitch = camera.y * .22, fourth = camera.x * .24 - camera.y * .16;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cw = Math.cos(fourth), sw = Math.sin(fourth);
    projected = nodes.map(node => {
      const x4 = node.x*cw-node.w*sw, w4 = node.x*sw+node.w*cw;
      const perspective4 = 2.8/(2.8-w4);
      const x = x4*perspective4, y = node.y*perspective4, z = node.z*perspective4;
      const rx = x*cy+z*sy, rz = z*cy-x*sy;
      const ry = y*cp-rz*sp, depth = y*sp+rz*cp;
      const perspective3 = 3.7/(3.7+depth);
      return { x: width*.5+rx*width*.34*perspective3-camera.x*width*.025,
        y: height*.5+ry*height*.43*perspective3-camera.y*height*.025,
        depth, scale: perspective3, focus: 0 };
    });
  }
  function rgba(color, alpha) { return 'rgba(' + color.join(',') + ',' + Math.max(0,Math.min(1,alpha)) + ')'; }
  function line(a,b,color,alpha,lineWidth=1) {
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=rgba(color,alpha); ctx.lineWidth=lineWidth; ctx.stroke();
  }
  function dot(x,y,r,color,alpha) {
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=rgba(color,alpha); ctx.fill();
  }
  function explore(index, time) {
    selected=index; lastSelection=time;
    const visited=new Set([index]);
    let frontier=[index]; const paths=[];
    for (let hop=0;hop<3;hop++) {
      const next=[];
      frontier.forEach(from => neighbors[from].slice(0,3).forEach(to => {
        if (visited.has(to) || paths.length>=18) return;
        visited.add(to); next.push(to); paths.push({from,to,start:time+hop*230});
      }));
      frontier=next;
    }
    signals=paths;
  }
  function render(time) {
    dark=root.dataset.theme==='dark';
    ctx.clearRect(0,0,width,height);
    project();
    const base=dark ? [129,150,194] : [87,105,153];
    const active=dark ? [107,220,237] : [68,76,197];
    const secondary=dark ? [173,151,245] : [124,85,192];
    const interactive=fine.matches && !reduced.matches && hovering;
    const energy=interactive ? Math.max(0,1-(time-lastInput)/1800) : 0;
    let nearest=-1, best=Infinity;
    projected.forEach((node,i) => {
      const distance=Math.hypot(node.x-pointer.x,node.y-pointer.y);
      node.focus=Math.exp(-(distance*distance)/(145*145))*energy;
      if (distance<best) { best=distance;nearest=i; }
    });
    if (interactive && best<140 && nearest!==selected && time-lastSelection>150) explore(nearest,time);
    edges.forEach(([a,b]) => {
      const p=projected[a],q=projected[b];
      const focus=Math.max(p.focus,q.focus);
      const depth=Math.min(1.3,(p.scale+q.scale)/2);
      // Dim far-away connections; stronger local links reveal the search neighborhood.
      const opacity=(dark ? .12 : .09)*depth + focus*(dark ? .28 : .23);
      line(p,q,focus>.15 ? active : base,opacity, .65+focus*.65);
    });
    signals=signals.filter(signal => time-signal.start<440);
    signals.forEach(signal => {
      const progress=(time-signal.start)/440;
      if (progress<0 || progress>1) return;
      const p=projected[signal.from],q=projected[signal.to];
      const strength=Math.sin(progress*Math.PI);
      const x=p.x+(q.x-p.x)*progress,y=p.y+(q.y-p.y)*progress;
      line(p,q,secondary,strength*(dark?.45:.3),1.1);
      dot(x,y,2.1,active,strength*.85);
    });
    // Paint distant nodes first so near nodes visually sit in front of them.
    projected.map((node,i)=>({node,i})).sort((a,b)=>b.node.depth-a.node.depth).forEach(({node,i}) => {
      if (node.x<-25 || node.y<-25 || node.x>width+25 || node.y>height+25) return;
      const radius=Math.max(.8,node.scale*1.55)+node.focus*1.5;
      const color=nodes[i].w>0 ? active : secondary;
      if (node.focus>.25) {
        const glow=ctx.createRadialGradient(node.x,node.y,0,node.x,node.y,18);
        glow.addColorStop(0,rgba(color,node.focus*(dark?.2:.1)));glow.addColorStop(1,rgba(color,0));
        ctx.fillStyle=glow;ctx.fillRect(node.x-18,node.y-18,36,36);
      }
      dot(node.x,node.y,radius,color,(dark?.32:.27)*Math.min(node.scale,1.4)+node.focus*.55);
    });
    if (interactive && selected>=0 && energy>.1) {
      const node=projected[selected], source=nodes[selected];
      const radius=9+node.focus*3;
      ctx.strokeStyle=rgba(active,energy*.65);ctx.lineWidth=.8;
      // Four small corner marks identify the sampled node, not the mouse cursor.
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([x,y]) => {
        ctx.beginPath();ctx.moveTo(node.x+x*radius,node.y+y*(radius-4));
        ctx.lineTo(node.x+x*radius,node.y+y*radius);ctx.lineTo(node.x+x*(radius-4),node.y+y*radius);ctx.stroke();
      });
      const label='['+source.x.toFixed(2)+', '+source.y.toFixed(2)+', '+source.z.toFixed(2)+', '+source.w.toFixed(2)+']';
      ctx.font='10px ui-monospace, Consolas, monospace';ctx.fillStyle=rgba(base,energy*.65);
      const textWidth=ctx.measureText(label).width;
      const labelX=Math.max(12,Math.min(width-textWidth-12,node.x+17));
      const labelY=Math.max(16,Math.min(height-16,node.y-14));
      ctx.fillText(label,labelX,labelY);
    }
  }
  function tick(time) {
    frame=null;
    if (document.hidden) return;
    const dt=lastFrame ? Math.min((time-lastFrame)/1000,.05) : 1/60;lastFrame=time;
    const ease=1-Math.exp(-7*dt);
    camera.x+=(desired.x-camera.x)*ease;camera.y+=(desired.y-camera.y)*ease;
    render(time);
    const moving=Math.abs(camera.x-desired.x)+Math.abs(camera.y-desired.y)>.001;
    if (!reduced.matches && fine.matches && (moving || signals.length || (hovering && time-lastInput<1800))) frame=requestAnimationFrame(tick);
    else lastFrame=0;
  }
  function schedule() { if (frame===null && !document.hidden) frame=requestAnimationFrame(tick); }
  function resetInteraction() {
    hovering=false;selected=-1;signals=[];lastInput=-10000;
    desired.x=0;desired.y=0;schedule();
  }
  function resize() {
    width=Math.max(1,window.innerWidth);height=Math.max(1,window.innerHeight);
    const scale=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(2400000/(width*height)));
    canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
    ctx.setTransform(scale,0,0,scale,0,0);
    canvas.hidden=false;resetInteraction();
  }
  function capability() {
    if (frame!==null) cancelAnimationFrame(frame);
    frame=null;lastFrame=0;camera.x=0;camera.y=0;resetInteraction();
  }
  document.addEventListener('pointermove',event => {
    if (reduced.matches || !fine.matches || event.pointerType==='touch' || document.hidden) return;
    if (event.target instanceof Element && event.target.closest('.robot-companion, input, textarea, select, [contenteditable="true"]')) {resetInteraction();return;}
    pointer.x=event.clientX;pointer.y=event.clientY;
    desired.x=Math.max(-1,Math.min(1,(pointer.x/width-.5)*2));
    desired.y=Math.max(-1,Math.min(1,(pointer.y/height-.5)*2));
    lastInput=performance.now();hovering=true;schedule();
  },{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget)resetInteraction();},{passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Tab')resetInteraction();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(frame!==null)cancelAnimationFrame(frame);frame=null;lastFrame=0;hovering=false;signals=[];}
    else resetInteraction();
  });
  window.addEventListener('blur',resetInteraction);
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('scroll',resetInteraction,{passive:true});
  fine.addEventListener('change',capability);reduced.addEventListener('change',capability);
  // A theme change also repaints an idle network; it doesn't restart continuous motion.
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-theme']});
  resize();
})();
