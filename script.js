document.addEventListener('DOMContentLoaded', () => {

    /* ===== CANVAS PARTICLE BACKGROUND ===== */
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    const resize = () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.size = Math.random() * 1.5 + 0.3;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(129,140,248,${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < 120; i++) particles.push(new Particle());

    const drawLines = () => {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(129,140,248,${0.06 * (1 - dist / 110)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
    };

    /* ===== THUNDER LIGHTNING ===== */
    const lCanvas = document.getElementById('lightningCanvas');
    const lCtx = lCanvas.getContext('2d');

    const resizeLightning = () => {
        lCanvas.width  = window.innerWidth;
        lCanvas.height = window.innerHeight;
    };
    resizeLightning();
    window.addEventListener('resize', resizeLightning);

    // Screen flash overlay
    const flashEl = document.createElement('div');
    flashEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;background:transparent;transition:background 0.04s;';
    document.body.appendChild(flashEl);

    // Mid-point displacement: build an array of points for the bolt
    function buildBolt(x1, y1, x2, y2, roughness, depth) {
        if (depth === 0) return [[x1, y1], [x2, y2]];
        const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * roughness;
        const my = (y1 + y2) / 2 + (Math.random() - 0.5) * roughness * 0.4;
        return [
            ...buildBolt(x1, y1, mx, my, roughness / 1.8, depth - 1),
            ...buildBolt(mx, my, x2, y2, roughness / 1.8, depth - 1)
        ];
    }

    function drawLightningBolt(alpha) {
        const LW  = lCanvas.width;
        const LH  = lCanvas.height;
        const sx  = LW * (0.15 + Math.random() * 0.7);
        const sy  = 0;
        const ex  = sx + (Math.random() - 0.5) * LW * 0.45;
        const ey  = LH * (0.45 + Math.random() * 0.45);

        const pts = buildBolt(sx, sy, ex, ey, 200, 8);

        lCtx.clearRect(0, 0, LW, LH);

        // Outer glow pass
        lCtx.save();
        lCtx.beginPath();
        lCtx.moveTo(pts[0][0], pts[0][1]);
        pts.forEach(([px, py]) => lCtx.lineTo(px, py));
        lCtx.strokeStyle = `rgba(160,190,255,${alpha * 0.5})`;
        lCtx.lineWidth   = 8;
        lCtx.shadowColor = 'rgba(140,180,255,1)';
        lCtx.shadowBlur  = 40;
        lCtx.stroke();

        // Mid glow
        lCtx.beginPath();
        lCtx.moveTo(pts[0][0], pts[0][1]);
        pts.forEach(([px, py]) => lCtx.lineTo(px, py));
        lCtx.strokeStyle = `rgba(200,220,255,${alpha * 0.8})`;
        lCtx.lineWidth   = 3;
        lCtx.shadowBlur  = 20;
        lCtx.stroke();

        // Bright core
        lCtx.beginPath();
        lCtx.moveTo(pts[0][0], pts[0][1]);
        pts.forEach(([px, py]) => lCtx.lineTo(px, py));
        lCtx.strokeStyle = `rgba(255,255,255,${alpha})`;
        lCtx.lineWidth   = 1;
        lCtx.shadowBlur  = 10;
        lCtx.stroke();
        lCtx.restore();
    }

    // Fade-out loop
    let boltAlpha  = 0;
    let fadingBolt = false;

    function fadeOutBolt() {
        if (!fadingBolt) return;
        boltAlpha -= 0.03;
        if (boltAlpha <= 0) {
            boltAlpha = 0;
            fadingBolt = false;
            lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
            return;
        }
        drawLightningBolt(boltAlpha);
        requestAnimationFrame(fadeOutBolt);
    }

    function strikeLightning() {
        boltAlpha  = 1;
        fadingBolt = true;
        drawLightningBolt(boltAlpha);

        // Bright screen flash
        flashEl.style.background = 'rgba(200,220,255,0.18)';
        setTimeout(() => { flashEl.style.background = 'transparent'; }, 70);

        // Start fade
        setTimeout(() => { fadeOutBolt(); }, 80);

        // 35% chance of a flicker follow-up
        if (Math.random() < 0.35) {
            setTimeout(() => {
                flashEl.style.background = 'rgba(200,220,255,0.1)';
                setTimeout(() => { flashEl.style.background = 'transparent'; }, 50);
            }, 180);
        }
    }

    function scheduleLightning() {
        const delay = 2500 + Math.random() * 5500;
        setTimeout(() => { strikeLightning(); scheduleLightning(); }, delay);
    }
    setTimeout(scheduleLightning, 1500);

    const animate = () => {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        drawLines();
        requestAnimationFrame(animate);
    };
    animate();

    /* ===== SCROLL REVEAL ===== */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.04}s`;
        observer.observe(el);
    });

    /* ===== PROGRESS BARS (animate on scroll) ===== */
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target.querySelector('.progress-bar');
                if (bar) bar.style.width = bar.dataset.width + '%';
                barObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.skill-card').forEach(card => barObserver.observe(card));

    /* ===== NAVBAR: SCROLL EFFECT + ACTIVE LINK ===== */
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Scrolled style
        navbar.classList.toggle('scrolled', scrollY > 50);

        // Back to top
        backToTop.classList.toggle('visible', scrollY > 500);

        // Active nav link
        let current = '';
        sections.forEach(sec => {
            if (scrollY >= sec.offsetTop - 140) current = sec.getAttribute('id');
        });
        navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
    });

    /* ===== HAMBURGER MOBILE MENU ===== */
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const mobileClose = document.getElementById('mobileClose');
    const mobileLinks = document.querySelectorAll('.mobile-links a');

    hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
    mobileClose.addEventListener('click', () => mobileNav.classList.remove('open'));
    mobileLinks.forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));

    /* ===== TYPING ANIMATION ===== */
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const phrases = [
            'I build secure & efficient solutions.',
            'I break things to make them stronger.',
            'I turn algorithms into art.'
        ];
        let pi = 0, ci = 0, deleting = false;

        const type = () => {
            const phrase = phrases[pi];
            if (!deleting) {
                tagline.textContent = phrase.slice(0, ++ci);
                if (ci === phrase.length) { deleting = true; setTimeout(type, 1800); return; }
            } else {
                tagline.textContent = phrase.slice(0, --ci);
                if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
            }
            setTimeout(type, deleting ? 35 : 65);
        };
        setTimeout(type, 1200);
    }

    /* ===== CONTACT FORM ===== */
    const form = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('sendBtn');
            btn.textContent = 'Sending…';
            btn.disabled = true;
            setTimeout(() => {
                form.reset();
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
                btn.disabled = false;
                formSuccess.classList.add('show');
                setTimeout(() => formSuccess.classList.remove('show'), 4000);
            }, 1200);
        });
    }

    /* ===== AMBULANCE ALERT CLOSE ===== */
    const ambuClose = document.getElementById('ambuClose');
    const ambulanceAlert = document.getElementById('ambulanceAlert');
    if (ambuClose && ambulanceAlert) {
        ambuClose.addEventListener('click', () => {
            ambulanceAlert.classList.add('hidden');
        });
    }


    /* ===== CUSTOM CURSOR ===== */
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = 'position:fixed;width:24px;height:24px;background:rgba(129,140,248,0.25);border-radius:50%;pointer-events:none;z-index:9999;top:0;left:0;mix-blend-mode:screen;transition:transform 0.15s,width 0.2s,height 0.2s;';
    document.body.appendChild(cursor);

    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;width:5px;height:5px;background:#fff;border-radius:50%;pointer-events:none;z-index:10000;top:0;left:0;';
    document.body.appendChild(dot);

    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
    });
    const moveCursor = () => {
        cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
        cursor.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
        requestAnimationFrame(moveCursor);
    };
    moveCursor();

    document.querySelectorAll('a,button,.skill-card,.profile-btn,.project-card').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.style.width = '48px'; cursor.style.height = '48px'; });
        el.addEventListener('mouseleave', () => { cursor.style.width = '24px'; cursor.style.height = '24px'; });
    });

});
