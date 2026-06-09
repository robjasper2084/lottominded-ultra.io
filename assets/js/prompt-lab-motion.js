/* LOTTOMINDED ULTRA — Prompt Lab Motion Hooks
   Vanilla JS. Include defer on prompt-lab.html after the CSS. */
(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

  function revealOnScroll(){
    const items = $$('[data-reveal]');
    if(!items.length || reduced){ items.forEach(el=>el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.15, rootMargin:'0px 0px -8% 0px'});
    items.forEach((el,i)=>{ el.style.transitionDelay = `${Math.min(i*45, 280)}ms`; io.observe(el); });
  }

  function parallaxHero(){
    if(reduced || matchMedia('(max-width: 880px)').matches) return;
    const hero = $('.pl-hero'); const orb = $('.pl-orb');
    if(!hero || !orb) return;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      orb.style.transform = `translate3d(${x*26}px,${y*20}px,0) rotate(${x*4}deg)`;
    });
    hero.addEventListener('pointerleave', () => { orb.style.transform = ''; });
  }

  function magneticButtons(){
    if(reduced) return;
    $$('.magnetic,.pl-cta').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width/2);
        const y = e.clientY - (r.top + r.height/2);
        btn.style.transform = `translate(${x*.13}px,${y*.2}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  function overlayMenu(){
    const openers = $$('.pl-menu-toggle,.pl-floating,[data-open-menu]');
    const overlay = $('.pl-overlay'); const close = $('.pl-close');
    if(!overlay || !openers.length) return;
    let lastFocus = null;
    const open = () => { lastFocus = document.activeElement; overlay.classList.add('is-open'); document.body.classList.add('menu-open'); const first = $('a,button', overlay); first && first.focus(); };
    const shut = () => { overlay.classList.remove('is-open'); document.body.classList.remove('menu-open'); lastFocus && lastFocus.focus && lastFocus.focus(); };
    openers.forEach(b=>b.addEventListener('click', open));
    close && close.addEventListener('click', shut);
    overlay.addEventListener('click', e => { if(e.target === overlay) shut(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && overlay.classList.contains('is-open')) shut(); });
  }

  function copyButtons(){
    $$('[data-copy-target]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rawTarget = btn.getAttribute('data-copy-target') || '';
        const target = $(rawTarget) || document.getElementById(rawTarget.replace(/^#/, ''));
        const txt = target ? (target.value || target.textContent || '') : '';
        try { await navigator.clipboard.writeText(txt.trim()); btn.dataset.copied='true'; btn.textContent='Copied'; setTimeout(()=>{btn.dataset.copied=''; btn.textContent=btn.dataset.label || 'Copy';},1200); }
        catch { btn.textContent='Select + Copy'; }
      });
    });
  }

  function promptGenerators(){
    const sunoBtn = $('[data-generate="suno"]');
    const videoBtn = $('[data-generate="video"]');
    const signalsBtn = $('[data-generate="signals"]');
    const out = $('#prompt-output');
    const get = id => ($(id)?.value || '').trim();
    const signalMaxes = () => {
      const format = get('#signal-game-format') || 'pick4';
      if(format === 'pick3') return [9, 9, 9];
      if(format === 'cash5') return [39, 39, 39, 39, 39];
      if(format === 'powerball-style') return [69, 69, 69, 69, 69, 26];
      return [9, 9, 9, 9];
    };
    const buildSignals = () => {
      const seed = (get('#creative-seed') || 'LottoMind prompt lab').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      let rng = seed % 9973;
      const next = max => { rng = (rng * 9301 + 49297) % 233280; return 1 + (rng % max); };
      const set = signalMaxes().map(next).join(' - ');
      return `CREATIVE SIGNAL SET\n${set}\nEntertainment-only ritual seed. Not a prediction. Lottery outcomes are random. Verify all rules with official sources.`;
    };
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-generate="signals"]');
      if(!trigger || !out) return;
      out.textContent = buildSignals();
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    sunoBtn && sunoBtn.addEventListener('click', () => {
      if(!out) return;
      const idea=get('#beat-idea')||'mystical LottoMind signal beat';
      const mood=get('#mood')||'cinematic Detroit soul, futuristic R&B, gold neon atmosphere';
      const bpm=get('#bpm')||'88';
      out.textContent = `SUNO PROMPT\nStyle: ${mood}. Tempo: ${bpm} BPM. Create a polished song around: ${idea}. Use warm bass, crisp drums, soulful hooks, cinematic pads, and a memorable chorus. Add call-and-response background vocals. Keep it premium, mystical, and motion-ready for LottoMind visuals.`;
    });
    videoBtn && videoBtn.addEventListener('click', () => {
      if(!out) return;
      const subject=get('#scene-subject')||'a glowing LottoMind prompt console';
      const location=get('#scene-location')||'dark luxury studio with gold signal rings';
      const motion=get('#motion-style')||'slow orbital camera, light sweeps, particle trails';
      out.textContent = `VIDEO PROMPT\n${subject} inside ${location}. ${motion}. Cinematic black and gold palette, neon violet accents, glass UI panels, floating prompt cards, volumetric haze, premium tech-luxury mood, high-detail 4K, no logos copied from external brands.`;
    });
    signalsBtn && signalsBtn.addEventListener('click', () => {
      if(!out) return;
      const seed=(get('#creative-seed')||'LottoMind prompt lab').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
      let rng=seed%9973; const next=max=>{rng=(rng*9301+49297)%233280;return 1+(rng%max)};
      const set=[next(9),next(9),next(9),next(9),next(39),next(69)].join(' • ');
      out.textContent = `CREATIVE SIGNAL SET\n${set}\nEntertainment-only ritual seed. Not a prediction. Lottery outcomes are random. Verify all rules with official sources.`;
    });
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-generate]');
      if(!trigger || !out) return;
      const type = trigger.getAttribute('data-generate');
      if(type === 'suno'){
        const idea=get('#beat-idea')||'mystical LottoMind signal beat';
        const mood=get('#mood')||'cinematic Detroit soul, futuristic R&B, gold neon atmosphere';
        const bpm=get('#bpm')||'88';
        out.textContent = `SUNO PROMPT\nStyle: ${mood}. Tempo: ${bpm} BPM. Create a polished song around: ${idea}. Use warm bass, crisp drums, soulful hooks, cinematic pads, and a memorable chorus. Add call-and-response background vocals. Keep it premium, mystical, and motion-ready for LottoMind visuals.`;
      }
      if(type === 'video'){
        const subject=get('#scene-subject')||'a glowing LottoMind prompt console';
        const location=get('#scene-location')||'dark luxury studio with gold signal rings';
        const motion=get('#motion-style')||'slow orbital camera, light sweeps, particle trails';
        out.textContent = `VIDEO PROMPT\n${subject} inside ${location}. ${motion}. Cinematic black and gold palette, neon violet accents, glass UI panels, floating prompt cards, volumetric haze, premium tech-luxury mood, high-detail 4K, no logos copied from external brands.`;
      }
      if(type === 'signals'){
        const seed=(get('#creative-seed')||'LottoMind prompt lab').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
        let rng=seed%9973; const next=max=>{rng=(rng*9301+49297)%233280;return 1+(rng%max)};
        const set=[next(9),next(9),next(9),next(9),next(39),next(69)].join(' - ');
        out.textContent = `CREATIVE SIGNAL SET\n${set}\nEntertainment-only ritual seed. Not a prediction. Lottery outcomes are random. Verify all rules with official sources.`;
      }
    });
  }

  function activeNav(){
    const sections = $$('[id]'); const links = $$('.pl-links a[href^="#"]');
    if(!sections.length || !links.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          links.forEach(a=>a.removeAttribute('aria-current'));
          const a = links.find(l=>l.getAttribute('href') === `#${entry.target.id}`);
          a && a.setAttribute('aria-current','page');
        }
      });
    }, {threshold:.4});
    sections.forEach(s=>io.observe(s));
  }

  function hashScrollOffset(){
    const align = () => {
      if(!location.hash || location.hash.length < 2) return;
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if(!target) return;
      const header = $('.site-header') || $('.manual-instrument-header');
      const offset = (header?.getBoundingClientRect().height || 0) + 28;
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
      window.scrollTo({ top, behavior: 'auto' });
    };
    window.addEventListener('hashchange', () => setTimeout(align, 40));
    window.addEventListener('load', () => { setTimeout(align, 80); setTimeout(align, 420); });
    align();
  }

  document.addEventListener('DOMContentLoaded', () => { revealOnScroll(); parallaxHero(); magneticButtons(); overlayMenu(); copyButtons(); promptGenerators(); activeNav(); hashScrollOffset(); });
})();
