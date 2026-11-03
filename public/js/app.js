/**
 * Portfolio — Main Frontend JavaScript
 * Pure static build (Vercel). No backend API calls.
 *
 * Features:
 *  1. Navbar scroll effect
 *  2. Animated stat counters
 *  3. Scroll reveal (IntersectionObserver)
 *  4. Showreel — two-stage lazy loader (proximity load + viewport play/pause)
 *  5. Portfolio grid render from static data
 *  6. Featured preview lazy loading; supporting clips load on request
 */

/* ═══════════════════════════════════════════════════════════
   STATIC PORTFOLIO DATA
   Source of truth for the static Vercel deployment.
   Edit this array to add/remove/reorder portfolio pieces.
═══════════════════════════════════════════════════════════ */
const PORTFOLIO_VIDEOS = [
  {
    id: 'vid_1',
    title: 'Visual Storytelling',
    description: 'Bold motion graphics edit with visual FX and premium polish.',
    videoUrl: './videos/show reel_motion_graphics.mp4',
    posterUrl: '',
    category: 'Motion Graphics',
    aspectRatio: 'ratio-wide',
    featured: true
  },
  {
    id: 'vid_2',
    title: 'Gym & Nutrition',
    description: 'High-energy fitness and nutrition content crafted to drive attention, motivation, and brand engagement.',
    videoUrl: './videos/gym_diet.mp4',
    posterUrl: '',
    category: 'Fitness / Reels',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_3',
    title: 'Healthcare Content',
    description: 'Visual storytelling crafted to communicate care, trust, wellness, and medical expertise.',
    videoUrl: './videos/5rules final v2.mp4',
    posterUrl: '',
    category: 'Healthcare',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_4',
    title: 'Real Estate Campaigns',
    description: 'Explanatory videos using motion graphics, typography, and visual storytelling without raw footage.',
    videoUrl: './videos/maa spaces.mp4',
    posterUrl: '',
    category: 'Real Estate',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_5',
    title: 'College Fest Highlights',
    description: 'Cinematic live-event montage capturing crowd energy and atmosphere.',
    videoUrl: './videos/even_montage.mp4',
    posterUrl: '',
    category: 'Live Events',
    aspectRatio: 'ratio-wide'
  },
  {
    id: 'vid_6',
    title: 'Brand Campaign',
    description: 'Creative brand campaign videos designed to capture attention and drive audience engagement.',
    videoUrl: './videos/brand_campaign.mp4',
    posterUrl: '',
    category: 'Brand Commercials',
    aspectRatio: 'ratio-wide'
  },
  {
    id: 'vid_7',
    title: 'Podcast Reels',
    description: 'Engaging short-form edits designed to turn conversations into impactful shareable content.',
    videoUrl: './videos/podcast_demo.mp4',
    posterUrl: '',
    category: 'Short-Form',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_8',
    title: 'Marketing Reel',
    description: 'Delivered impactful brand marketing videos focused on audience engagement and strong brand communication.',
    videoUrl: './videos/messi edit_2.mp4',
    posterUrl: '',
    category: 'Commercials',
    aspectRatio: 'ratio-vertical'
  },
  {
    id: 'vid_9',
    title: 'YouTube Documentary Edit',
    description: 'Deep narrative long-form edit with compelling pacing and structure.',
    videoUrl: './videos/sdg2.mp4',
    posterUrl: '',
    category: 'Documentary',
    aspectRatio: 'ratio-wide'
  },
  {
    id: 'vid_10',
    title: 'Brand Promotions',
    description: 'Professional content created to promote properties and strengthen real estate brand presence.',
    videoUrl: './videos/final_promo_7.mp4',
    posterUrl: '',
    category: 'Promotions',
    aspectRatio: 'ratio-wide'
  }
];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════
   BOOT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initStatsCounter();
  initScrollReveal();
  initShowreelLazyLoad();  // showreel-specific two-stage loader
  renderPortfolioGrid();   // render cards from static data, then observe
});

/* ═══════════════════════════════════════════
   2. NAVBAR SCROLL EFFECT
═══════════════════════════════════════════ */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ═══════════════════════════════════════════
   3. ANIMATED STAT COUNTERS
═══════════════════════════════════════════ */
function initStatsCounter() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  if (prefersReducedMotion) {
    counters.forEach(el => {
      el.textContent = `${el.getAttribute('data-target')}+`;
    });
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      let current  = 0;
      const steps  = 60;
      const inc    = target / steps;
      const timer  = setInterval(() => {
        current += inc;
        if (current >= target) {
          el.textContent = target + '+';
          clearInterval(timer);
        } else {
          el.textContent = Math.ceil(current);
        }
      }, 1400 / steps);
      obs.unobserve(el);
    });
  }, { threshold: 0.2 });

  counters.forEach(c => observer.observe(c));
}

/* ═══════════════════════════════════════════
   4. SCROLL REVEAL
═══════════════════════════════════════════ */
function initScrollReveal() {
  const els = document.querySelectorAll('.r');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('on');
      } else {
        // Only the impact statement re-animates on re-entry
        if (entry.target.classList.contains('impact-statement')) {
          entry.target.classList.remove('on');
        }
      }
    });
  }, { threshold: 0.15 });

  els.forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════════
   5. SHOWREEL — TWO-STAGE LAZY LOADER
   The showreel sits in section#services, near
   the top but below the fold. We:
     Stage 1 (proximity): load src when 600px away
     Stage 2 (viewport):  play when ≥10% visible,
                          pause when scrolled out
   Once loaded, source is NEVER removed.
═══════════════════════════════════════════ */
function initShowreelLazyLoad() {
  const video = document.querySelector('.impact-video[data-src]');
  if (!video) return;

  if (prefersReducedMotion) video.controls = true;

  let loaded = false;

  // Stage 1 — Proximity: load when 600px away (showreel is near fold)
  const loadObserver = new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting && !loaded) {
      loaded = true;
      // Fade in from dark placeholder once data is ready
      video.addEventListener('loadeddata', () => {
        video.classList.add('loaded');
      }, { once: true });
      video.addEventListener('error', () => {
        const status = video.parentElement.querySelector('.video-status');
        if (status) status.textContent = 'The showreel could not be loaded.';
        video.parentElement.classList.add('has-error');
      }, { once: true });
      video.src = video.dataset.src;
      video.load();
      obs.disconnect();
    }
  }, { rootMargin: '600px 0px' });

  // Stage 2 — Viewport: play / pause based on visibility
  const playObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !prefersReducedMotion) {
      // Only attempt play after src is assigned
      if (video.src) {
        playVideo(video);
      } else {
        // Wait for canplay then play
        video.addEventListener('canplay', () => {
          playVideo(video);
        }, { once: true });
      }
    } else {
      video.pause();
    }
  }, { threshold: 0.1 });

  loadObserver.observe(video);
  playObserver.observe(video);
}

/* ═══════════════════════════════════════════
   6. PORTFOLIO GRID — RENDER + OBSERVE
═══════════════════════════════════════════ */
function renderPortfolioGrid() {
  const grid = document.getElementById('portfolio-grid');
  const featuredWork = document.getElementById('featured-work');
  const count = document.getElementById('work-count');
  if (!grid) return;

  // Clear skeleton placeholders
  grid.innerHTML = '';
  if (featuredWork) featuredWork.innerHTML = '';

  PORTFOLIO_VIDEOS.forEach((item, i) => {
    const card = buildCard(item, i + 1);
    if (item.featured && featuredWork) featuredWork.appendChild(card);
    else grid.appendChild(card);
  });

  if (count) count.textContent = `${PORTFOLIO_VIDEOS.length} selected works`;

  // Begin observing cards for lazy-load + playback
  initVideoObservers();
}

/* ─── Build a single card DOM element ─── */
function buildCard(item, index) {
  const card = document.createElement('article');
  card.className = 'vid-card' + (item.featured ? ' featured-card' : '');
  card.setAttribute('data-id', item.id);

  const num   = String(index).padStart(2, '0');
  const ratio = item.aspectRatio || 'ratio-wide';

  // Poster: real image if provided, otherwise gradient placeholder
  const poster = item.posterUrl
    ? `<img src="${esc(item.posterUrl)}" alt="${esc(item.title)}" class="vid-poster" loading="lazy" decoding="async">`
    : `<div class="poster-placeholder">
         <div class="poster-icon">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
         </div>
         <span class="poster-category">${esc(item.category || 'Cinematic Edit')}</span>
       </div>`;

  card.innerHTML = `
    <div class="vid-shell ${ratio}">
      <span class="vid-index">${num}</span>
      ${poster}
      <video
        class="vid-el"
        muted
        loop
        playsinline
        preload="none"
        data-src="${esc(item.videoUrl)}"
        aria-label="${esc(item.title)}"
      ></video>
      <button class="vid-play" type="button" aria-label="Play ${esc(item.title)}" aria-pressed="false">
        <svg viewBox="0 0 10 12"><path d="M0 0 L10 6 L0 12 Z"/></svg>
      </button>
    </div>
    <div class="vid-info">
      <div class="vid-meta">
        <span class="vid-cat">${esc(item.category || 'Video Edit')}</span>
      </div>
      <h3 class="vid-title">${esc(item.title)}</h3>
      ${item.description ? `<p class="vid-desc">${esc(item.description)}</p>` : ''}
    </div>`;

  const video = card.querySelector('video');
  const playButton = card.querySelector('.vid-play');

  video.addEventListener('play', () => {
    playButton.setAttribute('aria-label', `Pause ${item.title}`);
    playButton.setAttribute('aria-pressed', 'true');
    playButton.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 0h3v12H1zM8 0h3v12H8z"/></svg>';
  });

  video.addEventListener('pause', () => {
    playButton.setAttribute('aria-label', `Play ${item.title}`);
    playButton.setAttribute('aria-pressed', 'false');
    playButton.innerHTML = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0 L10 6 L0 12 Z"/></svg>';
  });

  playButton.addEventListener('click', () => {
    if (video.paused) {
      loadVideo(video);
      playVideo(video);
    } else {
      video.pause();
    }
  });

  return card;
}

/* ═══════════════════════════════════════════
   7. TWO-STAGE VIDEO OBSERVER ENGINE
   Stage 1 — Proximity (rootMargin: 350px):
     Read data-src → assign video.src → call load()
     Mark with dataset.loaded = '1'
     Unobserve immediately (load happens once)
   Stage 2 — Viewport (threshold: 25%):
     isIntersecting + src exists → play()
     not intersecting → pause()
   Source is NEVER removed after loading.
═══════════════════════════════════════════ */
function initVideoObservers() {
  const videos = document.querySelectorAll('.featured-card .vid-el[data-src]');
  if (!videos.length) return;

  /* Stage 1 — Proximity loader */
  const proximityObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;

      loadVideo(video);
      obs.unobserve(video);
    });
  }, {
    rootMargin: '350px 0px',
    threshold: 0
  });

  /* Stage 2 — Viewport playback controller */
  const playbackObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        // Only play after src has been assigned
        if (!prefersReducedMotion && video.src && video.src !== window.location.href) {
          playVideo(video);
        }
      } else {
        if (!video.paused) video.pause();
      }
    });
  }, {
    threshold: 0.25
  });

  videos.forEach(video => {
    proximityObserver.observe(video);
    playbackObserver.observe(video);
  });
}

function loadVideo(video) {
  if (video.dataset.loaded || !video.dataset.src) return;

  video.dataset.loaded = '1';
  video.addEventListener('loadeddata', () => {
    video.classList.add('loaded');
    const card = video.closest('.vid-card');
    const poster = card && card.querySelector('.vid-poster, .poster-placeholder');
    if (poster) poster.classList.add('hidden');
  }, { once: true });

  video.addEventListener('error', () => {
    const button = video.closest('.vid-card')?.querySelector('.vid-play');
    if (!button) return;
    button.disabled = true;
    button.textContent = 'Preview unavailable';
    button.setAttribute('aria-label', 'Video preview unavailable');
  }, { once: true });

  video.src = video.dataset.src;
  video.load();
}

function playVideo(video) {
  document.querySelectorAll('.vid-el, .impact-video').forEach(otherVideo => {
    if (otherVideo !== video) otherVideo.pause();
  });

  video.play().catch(error => {
    if (error.name === 'AbortError') return;

    const button = video.closest('.vid-card')?.querySelector('.vid-play');
    if (!button) return;
    button.disabled = true;
    button.textContent = 'Preview unavailable';
    button.setAttribute('aria-label', 'Video preview unavailable');
  });
}

/* ═══════════════════════════════════════════
   UTILITY — HTML escape
═══════════════════════════════════════════ */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}
