---
layout: home
permalink: /
title: "Robotics, reinforcement learning & AI"
excerpt: "Swarnabha Roy, RL Engineer / AI Researcher at HammerheadAI. Exploring learning, decision-making, and autonomous robot systems."
redirect_from:
  - /about/
  - /about.html
---
<section class="home-hero" aria-labelledby="intro-title">
  <div class="hero-copy">
    <p class="eyebrow"><span class="status-dot"></span> NOW AT HAMMERHEADAI</p>
    <h1 id="intro-title">Swarnabha<br>Roy<span class="accent">.</span></h1>
    <p class="hero-role">RL Engineer <span aria-hidden="true">/</span> AI Researcher</p>
    <p class="hero-description">Exploring how intelligent agents learn, make decisions, and work together in the real world.</p>
    <div class="hero-actions"><a class="action-primary" href="{{ site.baseurl }}/publications/">Explore my research <span aria-hidden="true">↗</span></a><a class="action-text" href="mailto:swarnabha7@tamu.edu">Get in touch <span aria-hidden="true">↗</span></a></div>
    <div class="hero-socials"><a href="https://scholar.google.com/citations?user=B9MMJM0AAAAJ">Google Scholar ↗</a><a href="https://www.linkedin.com/in/swarnabha7">LinkedIn ↗</a><a href="{{ site.baseurl }}/cv/">CV ↗</a></div>
  </div>
  <figure class="hero-portrait">
    <div class="portrait-frame"><img src="{{ site.baseurl }}/images/DP2_N.jpg" alt="Swarnabha Roy" width="850" height="850" fetchpriority="high"></div>
    <figcaption><span class="portrait-mark" aria-hidden="true">↗</span><span>From learning algorithms<br>to autonomous systems.</span></figcaption>
    <span class="portrait-coordinate" aria-hidden="true">PERCEIVE → LEARN → ACT</span>
  </figure>
</section>

<section class="home-section about-section" aria-labelledby="about-title">
  <div><p class="eyebrow">01 / ABOUT</p><h2 id="about-title">Intelligence meets<br>the physical world.</h2></div>
  <div class="about-copy"><p>I’ve joined <strong>HammerheadAI as an RL Engineer / AI Researcher</strong>. My interests sit at the intersection of reinforcement learning, robotics, and reliable autonomous systems.</p><p>My doctoral research at <a href="https://www.tamu.edu/">Texas A&amp;M University</a>, advised by <a href="https://engineering.tamu.edu/electrical/profiles/kalafatis-stavros.html">Prof. Stavros Kalafatis</a> in the <a href="https://pxar.engr.tamu.edu/people/">PXAR Lab</a>, focuses on modular multi-robot systems operating over challenging networks—from perception and planning to edge-cloud orchestration and learning-based control.</p><p>I earned my B.Tech (Honors) in Electronics &amp; Electrical Communications Engineering from <strong>IIT Kharagpur</strong>. Along the way, I’ve worked on embedded robot controllers, precision agriculture, industrial digital twins, and software systems.</p></div>
</section>

<section class="home-section" aria-labelledby="focus-title">
  <div class="section-heading"><div><p class="eyebrow">02 / RESEARCH DIRECTIONS</p><h2 id="focus-title">What I’m curious about.</h2></div><span class="section-note">Learning × Robotics × Systems</span></div>
  <div class="focus-grid">
    <article class="focus-card"><span class="focus-icon" aria-hidden="true">↗</span><span class="card-number">01</span><h3>Learning to act</h3><p>Reinforcement learning, multi-agent decision-making, and the journey from simulation to the real world.</p><div class="topic-tags"><span>RL / MARL</span><span>Sim-to-real</span></div></article>
    <article class="focus-card"><span class="focus-icon" aria-hidden="true">◎</span><span class="card-number">02</span><h3>Robots, together</h3><p>Resilient coordination, network-aware planning, and perception for teams of aerial and ground robots.</p><div class="topic-tags"><span>Multi-robot systems</span><span>Perception</span></div></article>
    <article class="focus-card"><span class="focus-icon" aria-hidden="true">⌘</span><span class="card-number">03</span><h3>Systems that scale</h3><p>Connecting robots to edge and cloud resources for reliable deployment, efficient computation, and collaboration.</p><div class="topic-tags"><span>ROS 1 / 2</span><span>Kubernetes</span></div></article>
  </div>
</section>

<section class="home-section" aria-labelledby="work-title">
  <div class="section-heading"><div><p class="eyebrow">03 / SELECTED RESEARCH</p><h2 id="work-title">Ideas into systems.</h2></div><a class="action-text" href="{{ site.baseurl }}/publications/">All research <span aria-hidden="true">↗</span></a></div>
  <div class="selected-work">
    {% assign selected_slugs = "2025-t-robocon,2024-traffic-aware-autoscaling,2024-digital-twin" | split: "," %}
    {% for slug in selected_slugs %}{% for paper in site.publications %}{% if paper.url contains slug %}
    <a class="work-row" href="{{ site.baseurl }}{{ paper.url }}"><span class="work-year">{{ paper.date | date: '%Y' }}</span><div><h3>{{ paper.title }}</h3><p>{{ paper.venue }}</p></div><span class="work-arrow" aria-hidden="true">↗</span></a>
    {% endif %}{% endfor %}{% endfor %}
  </div>
</section>

<section class="home-section" aria-labelledby="journey-title">
  <div class="section-heading"><div><p class="eyebrow">04 / THE JOURNEY</p><h2 id="journey-title">Research &amp; experience.</h2></div><a class="action-text" href="{{ site.baseurl }}/experience/">More experience ↗</a></div>
  <div class="journey-list">
    <article class="journey-row"><span class="journey-time current">CURRENT</span><div><h3>HammerheadAI</h3><p>RL Engineer / AI Researcher</p></div><span class="journey-area">Reinforcement learning &amp; AI</span></article>
    <article class="journey-row"><span class="journey-time">SUMMER 2025</span><div><h3>Mitsubishi Electric Research Laboratories</h3><p>Research Intern · supervised by Dr. Jianlin Guo</p></div><span class="journey-area">UAV-assisted IoT networks</span></article>
    <article class="journey-row"><span class="journey-time">DOCTORAL RESEARCH</span><div><h3>Texas A&amp;M University</h3><p>Electrical &amp; Computer Engineering · PXAR Lab</p></div><span class="journey-area">Multi-robot autonomy</span></article>
    <article class="journey-row"><span class="journey-time">2018–2019</span><div><h3>OYO</h3><p>Software Development Engineer</p></div><span class="journey-area">Software systems</span></article>
  </div>
</section>

<section class="home-section" id="photography" aria-labelledby="photography-title">
  <div class="section-heading"><div><p class="eyebrow">05 / THROUGH MY LENS</p><h2 id="photography-title">Chasing sunsets.</h2></div><a class="action-text" href="{{ site.baseurl }}/miscellaneous/#photography">Photography &amp; beyond ↗</a></div>
  <p class="photography-intro">A few sunsets, quiet skies, and moments of light I’ve captured along the way. Photographs by me, Swarnabha Roy. Select a photograph to see it full size.</p>
  {% include photo-gallery.html %}
</section>

<section class="contact-section" aria-labelledby="contact-title"><div><p class="eyebrow">LET’S CONNECT</p><h2 id="contact-title">Good ideas start<br>with a conversation.</h2><p>Robotics, learning, research, or something unexpected.</p><a class="action-primary" href="mailto:swarnabha7@tamu.edu">Say hello <span aria-hidden="true">↗</span></a></div><div class="contact-aside"><span aria-hidden="true">✳</span><p>Outside research, I enjoy mentoring student teams and building communities around robotics and AI.</p><a href="{{ site.baseurl }}/involvements/">Beyond work ↗</a><a href="{{ site.baseurl }}/miscellaneous/">A little more about me ↗</a></div></section>
