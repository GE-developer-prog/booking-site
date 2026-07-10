import gsap from 'gsap'

// ── Hero entrance ─────────────────────────────────────────────────────────────
const tl = gsap.timeline({ delay: 1 })
tl.to('#hero-eyebrow',  { opacity: 1, y: 0, duration: .7, ease: 'power2.out' })
  .to('#hero-headline', { opacity: 1, y: 0, duration: .9, ease: 'power2.out' }, '-=.4')
  .to('#hero-sub',      { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, '-=.5')
  .to('#hero-ctas',     { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, '-=.4')

// ── Hero slider ───────────────────────────────────────────────────────────────
const slides = document.querySelectorAll('.slide')
const dots   = document.querySelectorAll('.slide-dot')
let current = 0
let autoplay

function goToSlide(index) {
  const prev = current
  current = (index + slides.length) % slides.length
  gsap.to(slides[prev], { opacity: 0, scale: 1, duration: 1.2, ease: 'power2.inOut' })
  gsap.fromTo(slides[current], { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.inOut' })
  dots.forEach(d => d.classList.remove('active'))
  dots[current]?.classList.add('active')
}

const startAutoplay = () => { autoplay = setInterval(() => goToSlide(current + 1), 5500) }
const resetAutoplay = () => { clearInterval(autoplay); startAutoplay() }

dots.forEach(d => d.addEventListener('click', () => { goToSlide(parseInt(d.dataset.index)); resetAutoplay() }))
document.getElementById('prev-slide')?.addEventListener('click', () => { goToSlide(current - 1); resetAutoplay() })
document.getElementById('next-slide')?.addEventListener('click', () => { goToSlide(current + 1); resetAutoplay() })

// Ken Burns on first slide
gsap.fromTo(slides[0], { scale: 1.08 }, { scale: 1, duration: 6, ease: 'none' })
startAutoplay()
