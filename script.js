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

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simulating email trigger requested in the prompt
        // Name, Email, Phone, Location, Query
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            query: document.getElementById('query').value,
            to: 'pratap.krishnan1@gmail.com'
        };
        
        console.log("Mock Email Dispatched:", formData);
        
        // Display success
        contactForm.style.display = 'none';
        successMsg.style.display = 'block';
    });

});
