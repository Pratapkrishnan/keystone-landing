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

    const grid = document.getElementById('portfolioGrid');
    const lightbox = document.getElementById('portfolioLightbox');
    const lbContent = document.getElementById('lightboxContent');
    const lbCaption = document.getElementById('lightboxCaption');
    let currentLbIndex = 0;
    let portfolioItems = []; // populated from Supabase

    async function loadPortfolio() {
        if (!grid) return;
        const section = document.getElementById('portfolio-section');

        try {
            // List all files in the portfolio bucket via Supabase REST API
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
            const files = await res.json();

            // Filter to images and videos only
            portfolioItems = files
                .filter(f => f.name && getFileType(f.name))
                .map(f => ({
                    name: f.name,
                    type: getFileType(f.name),
                    url: storageUrl(f.name),
                    caption: fileToCaption(f.name)
                }));

            // Hide section entirely if no media files exist
            if (portfolioItems.length === 0) {
                if (section) section.style.display = 'none';
                return;
            }

            renderPortfolioGrid();
        } catch (err) {
            console.warn('Portfolio load error:', err);
            // Hide the section on error — no ugly fallback
            if (section) section.style.display = 'none';
        }
    }

    function renderPortfolioGrid() {
        if (!grid) return;

        if (portfolioItems.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #4b5563;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">🏗️</div>
                    <div style="font-size: 1rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Portfolio Coming Soon</div>
                    <div style="font-size: 0.85rem;">High-resolution project photos and construction timelapses</div>
                </div>`;
            return;
        }

        grid.innerHTML = portfolioItems.map((item, i) => {
            const isVideo = item.type === 'video';
            // For video thumbnails, we show a poster frame or a styled placeholder
            const thumbContent = isVideo
                ? `<video src="${item.url}" preload="metadata" style="width:100%; height:100%; object-fit:cover; pointer-events:none;" muted></video>`
                : `<img src="${item.url}" alt="${item.caption}" loading="lazy" style="width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease;">`;

            return `
                <div class="portfolio-item" data-index="${i}" style="position:relative; aspect-ratio:3/2; border-radius:10px; overflow:hidden; cursor:pointer; border:1px solid rgba(255,255,255,0.06); transition:transform 0.3s ease, box-shadow 0.3s ease; background:#111;">
                    ${thumbContent}
                    ${isVideo ? `
                        <div class="play-overlay" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); transition:background 0.3s;">
                            <div style="width:56px; height:56px; border-radius:50%; background:rgba(197,160,89,0.9); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(0,0,0,0.4); transition:transform 0.2s;">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="8,5 19,12 8,19"/></svg>
                            </div>
                        </div>
                    ` : ''}
                    ${isVideo ? `<div style="position:absolute; bottom:0; left:0; right:0; padding:10px 14px; background:linear-gradient(transparent, rgba(0,0,0,0.7)); pointer-events:none; text-align:right;">
                        <span style="font-size:0.65rem; color:#C5A059; font-weight:600;">▶ VIDEO</span>
                    </div>` : ''}
                </div>`;
        }).join('');

        // Hover effects
        grid.querySelectorAll('.portfolio-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.03)';
                el.style.boxShadow = '0 12px 40px rgba(197,160,89,0.15)';
                const img = el.querySelector('img');
                if (img) img.style.transform = 'scale(1.08)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
                el.style.boxShadow = 'none';
                const img = el.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
            });
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
        // Stop any playing video
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
                    alt="${item.caption}">`;
        }

        lbCaption.textContent = `${currentLbIndex + 1} / ${portfolioItems.length}`;
    }

    function lightboxNav(direction) {
        // Stop current video if playing
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

    // Initialize gallery — fetch from Supabase Storage
    loadPortfolio();

});
