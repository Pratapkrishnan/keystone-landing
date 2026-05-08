document.addEventListener('DOMContentLoaded', () => {

    // 1. Video Autoplay
    // The video tag handles 'autoplay' organically.
    const video = document.getElementById('hero-video');
    
    // Optional: Ensure video starts at beginning on refresh
    if (video) {
        video.currentTime = 0;
        video.play().catch(e => console.log("Autoplay may be blocked by browser:", e));
    }

    // 2. Spatial 3D Mouse Movement Effect
    const heroContent = document.querySelector('.hero-content');
    
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        
        // Apply rotation to hero content to give a 3D feel
        if (heroContent) {
            heroContent.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        }
    });

    // Reset when mouse leaves window
    document.addEventListener('mouseleave', () => {
        if (heroContent) heroContent.style.transform = `rotateY(0deg) rotateX(0deg)`;
    });

    // 3. Scroll Interactions for Narrative Pillars
    const navItems = document.querySelectorAll('.nav-item');
    const pillarContents = document.querySelectorAll('.pillar-content');
    
    // Intersection Observer to detect which pillar is currently active
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const pillarObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetId = entry.target.id;
                
                // Highlight left nav
                navItems.forEach(nav => {
                    nav.classList.remove('active');
                    if (nav.dataset.target === targetId) {
                        nav.classList.add('active');
                    }
                });

                // Fade in right content
                pillarContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    pillarContents.forEach(content => {
        pillarObserver.observe(content);
    });

    // Clicks on nav items scroll to content
    navItems.forEach(nav => {
        nav.addEventListener('click', () => {
            const target = document.getElementById(nav.dataset.target);
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // 4. Modal Logic & Form Submission Simulation
    const inquireBtn = document.getElementById('inquire-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeModal = document.getElementById('close-modal');
    const contactForm = document.getElementById('contact-form');
    const successMsg = document.getElementById('success-msg');

    inquireBtn.addEventListener('click', () => {
        contactModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        contactModal.classList.remove('active');
        // Reset form if closed
        setTimeout(() => {
            contactForm.style.display = 'block';
            successMsg.style.display = 'none';
            contactForm.reset();
        }, 400);
    });

    // Close on click outside modal content
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeModal.click();
        }
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.querySelector('.form-submit');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Sending...';
        btn.disabled = true;

        const formData = {
            Name: document.getElementById('name').value,
            Email: document.getElementById('email').value,
            Phone: document.getElementById('phone').value,
            Location: document.getElementById('location').value,
            Message: document.getElementById('query').value,
            _subject: 'New Lead from Business Landing Page'
        };
        
        try {
            await fetch("https://formspree.io/f/xzdywpzg", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            // Display success
            contactForm.style.display = 'none';
            successMsg.style.display = 'block';
        } catch(err) {
            alert("Error sending message. Please try again.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // ═══════════════════════════════════════════════════════════════
    // 5. PORTFOLIO GALLERY — Supabase Storage Auto-Listing
    // ═══════════════════════════════════════════════════════════════
    //
    // HOW IT WORKS:
    //   1. Go to Supabase Dashboard → Storage → Create bucket "portfolio" (public)
    //   2. Upload photos (.jpg, .png, .webp) and videos (.mp4, .mov) to the bucket
    //   3. Gallery auto-lists all files — no code changes needed
    //   4. File name becomes the caption (underscores → spaces, extension stripped)
    //
    // NAMING CONVENTION (optional, for ordering):
    //   01_Foundation_Work.jpg  →  caption: "Foundation Work"
    //   02_Steel_Framework.mp4  →  caption: "Steel Framework"
    //

    const SUPABASE_URL = 'https://iojmldujezovnxlxpjsh.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_Y7IU2Bh0YnHmodEWFe5mGQ_-VdRbUMg';
    const BUCKET_NAME = 'portfolio';

    const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const VIDEO_EXTS = ['.mp4', '.mov', '.webm'];

    // Build public URL for a file in the bucket
    const storageUrl = (fileName) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(fileName)}`;

    // Convert filename to caption: "03_Steel_Framework.jpg" → "Steel Framework"
    function fileToCaption(name) {
        return name
            .replace(/\.[^.]+$/, '')           // strip extension
            .replace(/^\d+[_\-\s]/, '')        // strip leading number prefix
            .replace(/[_\-]/g, ' ')            // underscores/hyphens → spaces
            .replace(/\b\w/g, c => c.toUpperCase()) // title case
            .trim();
    }

    function getFileType(name) {
        const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
        if (VIDEO_EXTS.includes(ext)) return 'video';
        if (IMAGE_EXTS.includes(ext)) return 'photo';
        return null;
    }

    const grid = document.getElementById('carouselTrack');
    const lightbox = document.getElementById('portfolioLightbox');
    const lbContent = document.getElementById('lightboxContent');
    let currentLbIndex = 0;
    let portfolioItems = []; // populated from Supabase

    async function fetchPortfolioFiles() {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ prefix: '', limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } })
        });
        if (!res.ok) throw new Error(`Storage API error: ${res.status}`);
        return res.json();
    }

    async function loadPortfolio() {
        if (!grid) return;
        const section = document.getElementById('portfolio-section');
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1500;

        try {
            let files = [];

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                files = await fetchPortfolioFiles();
                if (Array.isArray(files) && files.length > 0) break;
                if (attempt < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, RETRY_DELAY));
                }
            }

            portfolioItems = (files || [])
                .filter(f => f.name && getFileType(f.name))
                .map(f => ({
                    name: f.name,
                    type: getFileType(f.name),
                    url: storageUrl(f.name)
                }));

            if (portfolioItems.length === 0) {
                if (section) section.style.display = 'none';
                return;
            }

            renderCarousel();
        } catch (err) {
            console.warn('Portfolio load error:', err);
            if (section) section.style.display = 'none';
        }
    }

    function renderCarousel() {
        if (!grid || portfolioItems.length === 0) return;

        // Build carousel items
        const buildItem = (item, i) => {
            const isVideo = item.type === 'video';
            const media = isVideo
                ? `<video src="${item.url}" preload="metadata" muted></video>`
                : `<img src="${item.url}" alt="" loading="lazy">`;

            const playBadge = isVideo
                ? `<div class="play-badge"><div><svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="8,5 19,12 8,19"/></svg></div></div>`
                : '';

            return `<div class="carousel-item" data-index="${i}">${media}${playBadge}</div>`;
        };

        // Duplicate items for seamless infinite scroll
        const itemsHTML = portfolioItems.map((item, i) => buildItem(item, i)).join('');
        grid.innerHTML = itemsHTML + itemsHTML;

        // Adjust scroll speed based on item count (more items = slower)
        const duration = Math.max(30, portfolioItems.length * 4);
        grid.style.animationDuration = `${duration}s`;

        // Click to open lightbox
        grid.querySelectorAll('.carousel-item').forEach(el => {
            el.addEventListener('click', () => {
                openLightbox(parseInt(el.dataset.index));
            });
        });
    }

    function openLightbox(index) {
        if (!lightbox || portfolioItems.length === 0) return;
        currentLbIndex = index;
        renderLightboxItem();
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
        const vid = lbContent.querySelector('video');
        if (vid) vid.pause();
        lbContent.innerHTML = '';
    }

    function renderLightboxItem() {
        const item = portfolioItems[currentLbIndex];
        if (!item) return;

        if (item.type === 'video') {
            lbContent.innerHTML = `
                <video src="${item.url}" controls autoplay
                    style="max-width:90vw; max-height:80vh; border-radius:8px; box-shadow:0 20px 60px rgba(0,0,0,0.5); outline:none; background:#000;">
                    Your browser does not support the video tag.
                </video>`;
        } else {
            lbContent.innerHTML = `
                <img src="${item.url}" 
                    style="max-width:90vw; max-height:80vh; border-radius:8px; box-shadow:0 20px 60px rgba(0,0,0,0.5); object-fit:contain;" 
                    alt="">`;
        }
    }

    function lightboxNav(direction) {
        const vid = lbContent.querySelector('video');
        if (vid) vid.pause();
        currentLbIndex = (currentLbIndex + direction + portfolioItems.length) % portfolioItems.length;
        renderLightboxItem();
    }

    // Lightbox event listeners
    if (lightbox) {
        document.getElementById('lightboxClose').addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
        document.getElementById('lightboxPrev').addEventListener('click', (e) => { e.stopPropagation(); lightboxNav(-1); });
        document.getElementById('lightboxNext').addEventListener('click', (e) => { e.stopPropagation(); lightboxNav(1); });
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (lightbox && lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') lightboxNav(-1);
            if (e.key === 'ArrowRight') lightboxNav(1);
        }
    });

    // Initialize gallery
    loadPortfolio();

});
