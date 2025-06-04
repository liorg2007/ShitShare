// Enhanced main functionality with better UX and animations
document.addEventListener('DOMContentLoaded', function() {
    // Initialize entrance animations
    initializeAnimations();
    
    // Enhanced camera functionality
    setupCameraHandling();
    
    // Form handling with progress feedback
    setupFormHandling();
    
    // Add interactive elements
    addInteractiveEffects();
});

function initializeAnimations() {
    // Stagger animation for content elements
    const animatedElements = document.querySelectorAll('.content > *');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

function setupCameraHandling() {
    const cameraButton = document.querySelector('.camera-button');
    const fileInput = document.getElementById('fileInput');
    
    if (cameraButton && fileInput) {
        // Enhanced camera button click with haptic feedback
        cameraButton.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Haptic feedback for mobile devices
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            fileInput.click();
        });
        
        // Enhanced file input handling
        fileInput.addEventListener('change', function(e) {
            handleFileSelection(this);
        });
        
        // Drag and drop support
        setupDragAndDrop();
    }
}

function handleFileSelection(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    // Enhanced file validation
    if (!validateFile(file)) return;
    
    // Show loading state
    showLoadingState();
    
    // Process and preview image
    processImage(file);
}

function validateFile(file) {
    // Check file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return false;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('Image size should be less than 10MB', 'error');
        return false;
    }
    
    return true;
}

function processImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Compress image if needed
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate optimal dimensions
            const maxWidth = 1200;
            const maxHeight = 1200;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Show preview with animation
            showPreview(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
    };
    
    reader.onerror = function() {
        showNotification('Error reading the image file', 'error');
        hideLoadingState();
    };
    
    reader.readAsDataURL(file);
}

function showPreview(imageSrc) {
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    
    if (previewContainer && previewImg) {
        previewImg.src = imageSrc;
        previewContainer.style.display = 'block';
        
        // Animate preview appearance
        previewContainer.style.opacity = '0';
        previewContainer.style.transform = 'scale(0.9)';
        
        requestAnimationFrame(() => {
            previewContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            previewContainer.style.opacity = '1';
            previewContainer.style.transform = 'scale(1)';
        });
        
        // Scroll to preview
        setTimeout(() => {
            previewContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 200);
    }
    
    hideLoadingState();
}

function setupFormHandling() {
    const form = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (!form || !uploadBtn) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission
        
        // Validate file selection
        if (!fileInput.files || !fileInput.files[0]) {
            showNotification('Please select a photo first', 'error');
            return false;
        }
        
        // Create FormData object
        const formData = new FormData(form);
                
        // Show upload progress
        showUploadProgress();
        
        // Disable form to prevent double submission
        uploadBtn.disabled = true;
        fileInput.disabled = true;
        
        // Submit the form using fetch
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.error) {
                throw new Error(data.error);
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showNotification(error.message || 'Upload failed', 'error');
            uploadBtn.disabled = false;
            fileInput.disabled = false;
            hideUploadProgress();
        });
    });
}

function showUploadProgress() {
    const uploadBtn = document.getElementById('uploadBtn');
    if (!uploadBtn) return;
    
    // Create progress animation
    uploadBtn.innerHTML = '⏳ Uploading...';
    uploadBtn.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
    
    // Add pulsing animation
    uploadBtn.style.animation = 'pulse 1.5s infinite';
    
    // Add progress bar effect
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255,255,255,0.5);
        border-radius: 0 0 16px 16px;
        animation: progressFill 3s ease-out infinite;
    `;
    
    uploadBtn.style.position = 'relative';
    uploadBtn.appendChild(progressBar);
}

function setupDragAndDrop() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    let dragCounter = 0;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        dragCounter++;
        container.style.transform = 'scale(1.02)';
        container.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2), 0 0 0 3px rgba(102, 126, 234, 0.3)';
    }
    
    function unhighlight(e) {
        dragCounter--;
        if (dragCounter === 0) {
            container.style.transform = '';
            container.style.boxShadow = '';
        }
    }
    
    // Handle dropped files
    container.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                // Create new FileList
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(files[0]);
                fileInput.files = dataTransfer.files;
                
                // Trigger change event
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        dragCounter = 0;
    }
}

function addInteractiveEffects() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.camera-button, .upload-button, .gallery-link');
    
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    function createRipple(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Add hover effects with mouse tracking
    const interactiveElements = document.querySelectorAll('.camera-button, .gallery-link');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;
            
            this.style.transform = `perspective(1000px) rotateX(${deltaY * -5}deg) rotateY(${deltaX * 5}deg) translateZ(5px)`;
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

function showLoadingState() {
    const cameraButton = document.querySelector('.camera-button');
    if (cameraButton) {
        cameraButton.innerHTML = '📸 Processing...';
        cameraButton.disabled = true;
        cameraButton.style.opacity = '0.7';
    }
}

function hideLoadingState() {
    const cameraButton = document.querySelector('.camera-button');
    if (cameraButton) {
        cameraButton.innerHTML = '💩📸 צלם את המפגע אחשלי';
        cameraButton.disabled = false;
        cameraButton.style.opacity = '1';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    `;
    
    // Set color based on type
    const colors = {
        success: 'linear-gradient(135deg, #2ecc71, #27ae60)',
        error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        info: 'linear-gradient(135deg, #3498db, #2980b9)'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Hide after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes progressFill {
        0% { width: 0%; }
        100% { width: 100%; }
    }
    
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);