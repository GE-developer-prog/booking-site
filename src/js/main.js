import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ── Page loader ──────────────────────────────────────────────────────────────
const loader = document.getElementById('page-loader')
const loaderFill = document.getElementById('loader-fill')
if (loader && loaderFill) {
  gsap.to(loaderFill, { width: '100%', duration: .9, ease: 'power2.inOut', onComplete: () => {
    gsap.to(loader, { opacity: 0, duration: .4, onComplete: () => loader.remove() })
  }})
}

// ── Nav scroll ───────────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar')
if (navbar) {
  window.addEventListener('scroll', () => navbar.classList.toggle('nav-scrolled', window.scrollY > 60), { passive: true })
}

// ── Floating book button ─────────────────────────────────────────────────────
const floatBtn = document.getElementById('float-book')
if (floatBtn) {
  window.addEventListener('scroll', () => floatBtn.classList.toggle('visible', window.scrollY > 400), { passive: true })
}

// ── Mobile menu ──────────────────────────────────────────────────────────────
document.getElementById('menu-toggle')?.addEventListener('click', () => {
  document.getElementById('mobile-menu')?.classList.add('open')
  document.body.style.overflow = 'hidden'
  gsap.fromTo('.mobile-nav-link', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .4, stagger: .08, delay: .1 })
})
document.getElementById('menu-close')?.addEventListener('click', () => {
  document.getElementById('mobile-menu')?.classList.remove('open')
  document.body.style.overflow = ''
})

// ── Scroll reveals ───────────────────────────────────────────────────────────
document.querySelectorAll('.reveal').forEach(el => {
  gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .85, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
})
document.querySelectorAll('.reveal-left').forEach(el => {
  gsap.fromTo(el, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: .9, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
})
document.querySelectorAll('.reveal-right').forEach(el => {
  gsap.fromTo(el, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: .9, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
})
document.querySelectorAll('.reveal-scale').forEach(el => {
  gsap.fromTo(el, { opacity: 0, scale: .93 }, { opacity: 1, scale: 1, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
})

// ── Counter animation ────────────────────────────────────────────────────────
document.querySelectorAll('.counter-num').forEach(el => {
  const target = parseInt(el.dataset.target)
  const suffix = el.dataset.suffix || '+'
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target, duration: 2, ease: 'power2.out',
        onUpdate: function() { el.textContent = Math.round(this.targets()[0].val) + suffix }
      })
    }
  })
})

// ── Parallax ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.parallax-img').forEach(img => {
  gsap.to(img, { yPercent: -15, ease: 'none', scrollTrigger: { trigger: img.closest('section') || img, start: 'top bottom', end: 'bottom top', scrub: true } })
})

// document.getElementById("year").textContent = new Date().getFullYear();

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}