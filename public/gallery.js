// Enhanced gallery functionality with better UX
document.addEventListener('DOMContentLoaded', function() {
    // Image loading animation
    const images = document.querySelectorAll('.image-item img');
    
    images.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
        }
    });
    
    // Modal functionality with keyboard and gesture support
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    let currentImageIndex = 0;
    const imageElements = Array.from(images);
    
    // Click handler for images
    images.forEach((img, index) => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            currentImageIndex = index;
            showModal(this.src);
        });
    });
    
    function showModal(src) {
        modalImg.src = src;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Add entrance animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });
    }
    
    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    // Enhanced keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    navigateImage(1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    navigateImage(-1);
                    break;
            }
        }
    });
    
    function navigateImage(direction) {
        if (imageElements.length <= 1) return;
        
        currentImageIndex += direction;
        
        if (currentImageIndex >= imageElements.length) {
            currentImageIndex = 0;
        } else if (currentImageIndex < 0) {
            currentImageIndex = imageElements.length - 1;
        }
        
        modalImg.style.opacity = '0.5';
        setTimeout(() => {
            modalImg.src = imageElements[currentImageIndex].src;
            modalImg.style.opacity = '1';
        }, 150);
    }
    
    // Click outside to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    modal.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    modal.addEventListener('touchend', function(e) {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;
        
        // Minimum swipe distance
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe left (next image)
                    navigateImage(1);
                } else {
                    // Swipe right (previous image)
                    navigateImage(-1);
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance && deltaY > 0) {
                // Swipe up (close modal)
                closeModal();
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    });
    
    // Lazy loading for better performance
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        // Observer for future dynamically loaded images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Add navigation hints for desktop users
    if (imageElements.length > 1 && window.innerWidth > 768) {
        const navHint = document.createElement('div');
        navHint.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 14px;
            opacity: 0.7;
            text-align: center;
            pointer-events: none;
            z-index: 1002;
        `;
        navHint.innerHTML = 'Use ← → arrow keys or swipe to navigate • Press ESC to close';
        modal.appendChild(navHint);
    }
    
    // Preload adjacent images for smoother navigation
    function preloadAdjacentImages() {
        if (imageElements.length <= 1) return;
        
        const nextIndex = (currentImageIndex + 1) % imageElements.length;
        const prevIndex = currentImageIndex === 0 ? imageElements.length - 1 : currentImageIndex - 1;
        
        [nextIndex, prevIndex].forEach(index => {
            const img = new Image();
            img.src = imageElements[index].src;
        });
    }
    
    // Initialize preloading
    modal.addEventListener('transitionend', function(e) {
        if (e.target === modal && modal.style.display === 'block') {
            preloadAdjacentImages();
        }
    });
});

// Add loading animation for the gallery
window.addEventListener('load', function() {
    const gallery = document.querySelector('.gallery');
    if (gallery) {
        gallery.style.opacity = '0';
        gallery.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            gallery.style.transition = 'all 0.6s ease';
            gallery.style.opacity = '1';
            gallery.style.transform = 'translateY(0)';
        });
    }
});