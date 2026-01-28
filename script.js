// Descripción
const DESCRIPTION = "Sigueme | Follow me";
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
qs('#desc').textContent = DESCRIPTION;

// Audio y botones
const music = qs('#bgMusic');           // Música principal
const musicBtn = qs('.music-toggle');   // Botón música
const click = qs('#clickSound');        // Sonido click
const fastBtn = qs('#fastModeBtn');     // Botón modo rápido

let playing = false;
let fastMode = false;

// AudioContext para análisis de beat
let audioCtx, analyser, dataArray, source;

// Configurar analizador
function setupAudioAnalyser() {
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(music);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
}

// Fade-in de audio
function fadeInAudio(audio, ms){
  audio.volume = 0;
  audio.play().catch(()=>{});
  setupAudioAnalyser();
  const step = 0.02;
  const interval = ms * step;
  const t = setInterval(()=>{
    audio.volume = Math.min(1, audio.volume + step);
    if(audio.volume >= 1) clearInterval(t);
  }, interval);
}

// Actualizar estado botón música
function updateMusicButton(){
  if(playing){
    musicBtn.classList.add('playing');
    musicBtn.classList.remove('stopped');
  }else{
    musicBtn.classList.remove('playing');
    musicBtn.classList.add('stopped');
  }
}

// Click en botón música
musicBtn.onclick = ()=>{
  // Sonido click
  click.currentTime = 0;
  click.play().catch(()=>{});

  if(!playing){
    fadeInAudio(music,2500);
    playing = true;
    if(audioCtx?.state === 'suspended') audioCtx.resume();
  }else{
    music.pause();
    playing = false;
  }
  updateMusicButton();
};
updateMusicButton();

// Sonido click + contador por links
qsa('.btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    click.currentTime = 0;
    click.play().catch(()=>{});
    const k = 'hits_'+b.dataset.key;
    localStorage.setItem(k, (Number(localStorage.getItem(k)||0)+1));
  });
});

// Sonido click para copy, share y modo rápido
[qs('#copyLink'), qs('#shareBtn'), qs('#fastModeBtn')].forEach(btn => {
  btn.addEventListener('click', () => {
    click.currentTime = 0;
    click.play().catch(()=>{});
  });
});

// Orden inteligente de links
(function reorder(){
  const wrap = qs('#links');
  const items = qsa('.btn');
  items.sort((a,b)=>{
    const ka = 'hits_'+a.dataset.key;
    const kb = 'hits_'+b.dataset.key;
    return (Number(localStorage.getItem(kb)||0) - Number(localStorage.getItem(ka)||0));
  }).forEach(i=>wrap.appendChild(i));
})();

// Copiar / compartir
qs('#copyLink').onclick = async ()=>{ 
  try{ await navigator.clipboard.writeText(location.href); }catch(e){} 
};
qs('#shareBtn').onclick = async ()=>{
  if(navigator.share){
    try{ await navigator.share({ title:'Alexxandereal', url:location.href }); }catch(e){}
  }
};

// Precarga assets
['banner.gif','perfil.jpg','bgMusic.mp3','click.mp3'].forEach(src=>{
  const l = new Image(); 
  l.src = src;
});

// Parallax banner
window.addEventListener('scroll', ()=>{
  const y = window.scrollY * .25;
  qs('.banner-gif').style.transform = `translateY(${y}px)`;
});

// Música vibra visual + avatar rotando + bounce
function musicVibe(){
  if(analyser && playing){
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a,b)=>a+b,0)/dataArray.length;

    const moveCard = fastMode ? 0 : avg/25;
    const moveAvatar = fastMode ? 0 : avg/50;
    const rotateAvatar = fastMode ? 0 : avg/150;

    // Bounce suave
    const t = Date.now()/200;
    const bounce = fastMode ? 0 : Math.sin(t*2) * 3;

    qs('.card').style.transform = `translateY(${moveCard}px)`;
    qs('.avatar').style.transform = `translateY(${moveAvatar + bounce}px) rotate(${rotateAvatar}deg)`;
  }else{
    qs('.card').style.transform = 'translateY(0)';
    qs('.avatar').style.transform = 'translateY(0) rotate(0deg)';
  }
  requestAnimationFrame(musicVibe);
}
musicVibe();

// Botón Modo rápido / fluido
fastBtn.onclick = ()=>{
  fastMode = !fastMode;
  const elements = ['.aurora','.waves','.particles','.avatar', '.btn', '.card'];
  if(fastMode){
    elements.forEach(sel=>{
      qsa(sel).forEach(el=>{
        if(el !== musicBtn) el.style.animation = 'none';
        if(el !== musicBtn) el.style.transition = 'none';
      });
    });
    qs('.avatar').classList.remove('pulse');
    qs('.card').style.transform = 'translateY(0)';
  }else{
    elements.forEach(sel=>{
      qsa(sel).forEach(el=>{
        if(el !== musicBtn) el.style.animation='';
      });
    });
    qs('.avatar').classList.add('pulse');
  }
  updateMusicButton();
};