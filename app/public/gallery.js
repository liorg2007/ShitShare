// Enhanced gallery functionality with better UX and lazy loading
document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.querySelector('.gallery');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;
    let currentImageIndex = 0;
    let imageElements = [];

    // Initialize intersection observer for infinite scroll
    const loadMoreObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            loadImages();
        }
    }, {
        rootMargin: '100px',
        threshold: 0.1
    });

    async function loadImages() {
        if (isLoading || !hasMore) return;
        
        isLoading = true;
        showLoadingSpinner();
        
        try {
            const response = await fetch(`/gallery/data?page=${currentPage}`);
            const data = await response.json();
            
            updateImageCount(data.totalImages);
            
            if (data.images.length === 0) {
                hasMore = false;
                hideLoadingSpinner();
                return;
            }
            
            appendImages(data.images);
            currentPage++;
            
            if (currentPage > data.totalPages) {
                hasMore = false;
            }
        } catch (error) {
            console.error('Error loading images:', error);
            showErrorMessage('Failed to load images. Please try again later.');
        } finally {
            isLoading = false;
            hideLoadingSpinner();
        }
    }

    function appendImages(images) {
        const fragment = document.createDocumentFragment();
        
        images.forEach(imageName => {
            const div = document.createElement('div');
            div.className = 'image-item loading';
            
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = `/uploads/${imageName}`;
            img.alt = 'Gallery Photo';
            
            img.onload = () => {
                div.classList.remove('loading');
                img.classList.add('loaded');
                setupImageInteraction(img);
            };
            
            div.appendChild(img);
            fragment.appendChild(div);
        });
        
        gallery.appendChild(fragment);
        
        // Observe the last image for infinite scroll
        const allImages = document.querySelectorAll('.image-item');
        if (allImages.length > 0) {
            loadMoreObserver.disconnect();
            loadMoreObserver.observe(allImages[allImages.length - 1]);
        }
    }



    // UI Helper Functions
    function setupImageInteraction(img) {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            showModal(this.src || this.dataset.src);
        });
    }

    function showLoadingSpinner() {
        let spinner = document.querySelector('.loading-spinner');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            gallery.after(spinner);
        }
    }

    function hideLoadingSpinner() {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    function updateImageCount(totalImages) {
        const countElement = document.querySelector('.count');
        if (countElement) {
            countElement.textContent = `${totalImages} photos shared`;
        }
    }

    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        gallery.parentNode.insertBefore(errorDiv, gallery);
        
        setTimeout(() => {
            errorDiv.classList.add('fade-out');
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    // Modal Functions
    function showModal(src) {
        modalImg.src = src;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
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

    // Event Listeners
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Start loading images
    loadImages();
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