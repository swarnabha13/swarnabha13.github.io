/* R0: expressive, interruptible gestures and an optional five-star playground. */
(() => {
  'use strict';
  const root=document.getElementById('robot-companion');
  if(!root)return;
  const find=selector=>root.querySelector(selector);
  const panel=find('.robot-panel'),launcher=find('.robot-launcher'),close=find('.robot-close');
  const status=find('.robot-status'),bubble=find('.robot-bubble');
  const game=find('.robot-game'),play=find('[data-robot-action="play"]');
  const arena=find('.robot-arena'),bot=find('.arena-bot'),target=find('.arena-target'),scoreLabel=find('#robot-score');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const stars=[[78,24],[24,75],[76,76],[24,24],[50,50]];
  let score=0,position={x:50,y:50},destination={...position};
  let gameFrame=null,gameTime=0,travelFrame=null;
  let actionTimer=null,speechTimer=null,idleTimer=null,blinkTimer=null,blinkEndTimer=null;
  let idleIndex=0,lastIdleSchedule=-1000,lastGaze=-1000,lastScrollReaction=-1000;
  let lastScroll=window.scrollY||0,endWaveDone=false,paused=false;
  root.hidden=false;

  function pose(action='idle',expression='neutral') {
    clearTimeout(actionTimer);actionTimer=null;
    root.dataset.action=action;root.dataset.expression=expression;
  }
  function speak(message,announce=false) {
    if(announce)status.textContent=message;
    bubble.textContent=message;root.classList.add('is-speaking');
    clearTimeout(speechTimer);
    speechTimer=setTimeout(()=>root.classList.remove('is-speaking'),2200);
  }
  function gesture(action,expression,message,announce=false,duration=2500) {
    pose('idle',expression);
    // Repeated clicks restart the finite gesture rather than stacking animations.
    if(!reduced.matches) {void launcher.offsetWidth;root.dataset.action=action;}
    if(message)speak(message,announce);
    actionTimer=setTimeout(()=>pose(),duration);
  }
  function stopGame() {
    if(gameFrame!==null)cancelAnimationFrame(gameFrame);
    gameFrame=null;gameTime=0;destination={...position};
  }
  function closePanel(focus=false) {
    panel.hidden=true;launcher.setAttribute('aria-expanded','false');root.classList.remove('is-panel-open');
    stopGame();
    if(focus)launcher.focus({preventScroll:true});
  }
  function home({closeControls=false,resetPose=true}={}) {
    if(travelFrame!==null)cancelAnimationFrame(travelFrame);
    travelFrame=null;
    // No transition: restore the dock in the same event that resumes page interaction.
    root.style.removeProperty('--travel-x');root.style.removeProperty('--travel-y');
    root.classList.remove('is-roaming');
    if(resetPose||root.dataset.action==='explore')pose();
    if(closeControls)closePanel();
  }
  function explore() {
    home();closePanel(true);
    if(reduced.matches){gesture('curious','curious','Exploring from my corner today.',true);return;}
    const dock=launcher.getBoundingClientRect();
    const distance=Math.max(0,Math.min(window.innerWidth*.55,dock.left-12));
    const rise=Math.max(0,Math.min(140,dock.top-16));
    pose('explore','surprised');root.classList.add('is-roaming');
    status.textContent='Exploring! Return to the page and I’ll come straight home.';
    let start=null;
    function fly(time) {
      if(paused||reduced.matches){home();return;}
      if(start===null)start=time;
      const progress=Math.min(1,(time-start)/5200);
      const arc=Math.sin(progress*Math.PI);
      const x=-distance*arc;
      const y=Math.max(-dock.top+12,Math.min(0,-rise*arc+Math.sin(progress*Math.PI*4)*12*arc));
      root.style.setProperty('--travel-x',x.toFixed(2)+'px');root.style.setProperty('--travel-y',y.toFixed(2)+'px');
      if(progress<1)travelFrame=requestAnimationFrame(fly);
      else {home();gesture('wave','happy','Back at base. Mission complete!');scheduleIdle(true);}
    }
    travelFrame=requestAnimationFrame(fly);
  }
  function scheduleIdle(force=false) {
    if(paused||reduced.matches)return;
    const now=performance.now();
    if(!force&&idleTimer!==null&&now-lastIdleSchedule<500)return;
    clearTimeout(idleTimer);lastIdleSchedule=now;
    idleTimer=setTimeout(()=>{
      idleTimer=null;
      if(paused||reduced.matches)return;
      if(panel.hidden&&travelFrame===null){
        const moments=[['curious','curious',null],['stretch','happy',null],['wave','happy','Still here if you need a co-pilot.'],['sleep','sleepy',null]];
        const moment=moments[idleIndex++%moments.length];gesture(...moment,false,3000);
      }
      scheduleIdle(true);
    },9500);
  }
  function scheduleBlink() {
    clearTimeout(blinkTimer);
    if(paused||reduced.matches)return;
    blinkTimer=setTimeout(()=>{
      if(!paused&&root.dataset.expression!=='sleepy'){
        root.classList.add('is-blinking');
        blinkEndTimer=setTimeout(()=>root.classList.remove('is-blinking'),135);
      }
      scheduleBlink();
    },3600+Math.random()*2400);
  }
  function ambient() {
    paused=document.hidden;
    root.classList.toggle('is-paused',paused);
    clearTimeout(idleTimer);idleTimer=null;clearTimeout(blinkTimer);clearTimeout(blinkEndTimer);
    root.classList.remove('is-blinking');
    if(!paused){scheduleIdle(true);scheduleBlink();}
  }
  function pause() {
    paused=true;home({closeControls:true});stopGame();
    [idleTimer,blinkTimer,blinkEndTimer,actionTimer,speechTimer].forEach(clearTimeout);
    idleTimer=null;root.classList.remove('is-speaking','is-blinking');root.classList.add('is-paused');
  }
  function pageActivity(event) {
    if(root.contains(event.target))return;
    home({closeControls:true});
    root.classList.remove('is-speaking');
    scheduleIdle();
  }
  function gaze(event) {
    if(reduced.matches||paused||event.pointerType==='touch'||travelFrame!==null)return;
    const now=performance.now();if(now-lastGaze<30)return;lastGaze=now;
    const x=Math.max(-1,Math.min(1,(event.clientX/window.innerWidth-.5)*2));
    const y=Math.max(-1,Math.min(1,(event.clientY/window.innerHeight-.5)*2));
    root.style.setProperty('--eye-x',(x*3).toFixed(2)+'px');root.style.setProperty('--eye-y',(y*2).toFixed(2)+'px');
    root.style.setProperty('--gaze-x',(x*2).toFixed(2)+'px');
  }
  function onScroll() {
    const current=window.scrollY||0,down=current>=lastScroll;lastScroll=current;
    home({closeControls:true,resetPose:false});scheduleIdle();
    if(paused)return;
    const now=performance.now();if(now-lastScrollReaction<140)return;lastScrollReaction=now;
    const total=document.documentElement.scrollHeight-window.innerHeight;
    if(total>0&&current/total>.97&&!endWaveDone){endWaveDone=true;gesture('wave','happy','You made it to the end!');return;}
    if(root.dataset.action==='wave'&&endWaveDone)return;
    gesture(down?'scroll-down':'scroll-up',down?'focused':'curious',null,false,750);
  }

  function drawGame() {
    bot.style.left=position.x+'%';bot.style.top=position.y+'%';
    scoreLabel.textContent='Stars: '+score+' / 5';target.hidden=score===stars.length;
    if(score<stars.length){
      target.style.left=stars[score][0]+'%';target.style.top=stars[score][1]+'%';
      arena.setAttribute('aria-label','Robot playground. Next star: '+stars[score][0]+'% from left, '+stars[score][1]+'% from top.');
    } else arena.setAttribute('aria-label','Robot playground. All five stars collected.');
  }
  function collect() {
    if(score===stars.length)return;
    const bounds=arena.getBoundingClientRect();
    if(Math.hypot((position.x-stars[score][0])*bounds.width/100,(position.y-stars[score][1])*bounds.height/100)<19){
      score++;root.dataset.expression='happy';
      status.textContent=score===5?'Mission complete! Five stars, one happy robot. Play again?':'Star collected! '+score+' down, '+(5-score)+' to go.';
      if(score===5)gesture('dance','happy',null);
      drawGame();
    }
  }
  function tickGame(time) {
    const dt=gameTime?Math.min((time-gameTime)/1000,.05):.016;gameTime=time;
    const dx=destination.x-position.x,dy=destination.y-position.y,distance=Math.hypot(dx,dy),step=Math.min(distance,dt*65);
    if(distance>.1){position.x+=dx/distance*step;position.y+=dy/distance*step;}else position={...destination};
    collect();drawGame();
    if(distance>.1&&score<5)gameFrame=requestAnimationFrame(tickGame);else stopGame();
  }
  function move(x,y) {
    if(game.hidden||panel.hidden||score===5)return;
    destination={x:Math.max(7,Math.min(93,x)),y:Math.max(10,Math.min(90,y))};
    if(reduced.matches){position={...destination};collect();drawGame();}
    else if(gameFrame===null)gameFrame=requestAnimationFrame(tickGame);
  }
  function resetGame() {
    stopGame();score=0;position={x:50,y:50};destination={...position};
    root.dataset.expression='focused';status.textContent='Help me collect five stars. Point me toward the first one!';drawGame();
  }
  function togglePanel() {
    const open=panel.hidden;home();
    if(!open){closePanel(true);return;}
    panel.hidden=false;root.classList.add('is-panel-open');root.classList.remove('is-speaking');
    launcher.setAttribute('aria-expanded','true');root.dataset.expression='happy';close.focus({preventScroll:true});
  }
  launcher.addEventListener('click',togglePanel);
  close.addEventListener('click',()=>{home();closePanel(true);});
  launcher.addEventListener('pointerenter',()=>{
    if(panel.hidden&&travelFrame===null){root.dataset.expression='happy';speak('Hey! Want to explore together?');}
  });
  launcher.addEventListener('pointerleave',()=>{if(root.dataset.action==='idle')root.dataset.expression='neutral';});
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();home();closePanel(true);root.classList.remove('is-speaking');}
  });
  root.querySelectorAll('[data-robot-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.robotAction;home();scheduleIdle(true);
    if(action==='play'){
      game.hidden=!game.hidden;play.setAttribute('aria-expanded',String(!game.hidden));
      if(!game.hidden){resetGame();arena.focus();}else stopGame();return;
    }
    if(action==='explore'){explore();return;}
    gesture(action,'happy',action==='wave'?'Hello, human! Great to meet you.':'Beep, boop. I’ve been practicing these moves.',true,action==='dance'?3400:2500);
  }));
  find('.robot-reset').addEventListener('click',()=>{resetGame();arena.focus();});
  arena.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;const bounds=arena.getBoundingClientRect();arena.focus();
    move((event.clientX-bounds.left)/bounds.width*100,(event.clientY-bounds.top)/bounds.height*100);
  });
  arena.addEventListener('keydown',event=>{
    const steps={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]};
    if(!steps[event.key])return;event.preventDefault();const delta=steps[event.key];move(destination.x+delta[0],destination.y+delta[1]);
  });
  // Capture page intent before its normal handlers; never cancel or consume the event.
  document.addEventListener('pointermove',event=>{pageActivity(event);gaze(event);},{capture:true,passive:true});
  ['pointerdown','wheel','touchstart','touchmove'].forEach(type=>document.addEventListener(type,pageActivity,{capture:true,passive:true}));
  document.addEventListener('keydown',pageActivity,true);
  document.addEventListener('focusin',pageActivity,true);
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',()=>home({closeControls:true}),{passive:true});
  window.addEventListener('blur',pause);window.addEventListener('focus',ambient);
  document.addEventListener('visibilitychange',()=>document.hidden?pause():ambient());
  reduced.addEventListener('change',()=>{
    home();stopGame();['--eye-x','--eye-y','--gaze-x'].forEach(key=>root.style.removeProperty(key));ambient();
  });
  drawGame();ambient();
})();
