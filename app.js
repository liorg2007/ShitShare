const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Setting destination to:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    console.log('Generated filename:', uniqueName);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File filter check:', file.mimetype);
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for phone photos
  }
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configure session middleware
app.use(session({
  secret: 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use('/public', express.static(publicDir));

// Middleware to check if user has uploaded an image
const requireUpload = (req, res, next) => {
  // Only allow access if THIS user has uploaded
  if (req.session.hasUploaded) {
    next();
  } else {
    res.redirect('/');
  }
};

// Routes
app.get('/', (req, res) => {
  const hasUploaded = req.session.hasUploaded || false;
  const success = req.query.success === '1';
  
  // Check if there are any images in the gallery (for display purposes only)
  fs.readdir(uploadsDir, (err, files) => {
    const imageFiles = err ? [] : files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    const galleryExists = imageFiles.length > 0;
    console.log('Gallery check - Images found:', imageFiles.length);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>PicShare - Camera Gallery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
                color: #333;
            }
            
            .container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .camera-section {
                text-align: center;
                margin: 20px 0;
            }
            
            .camera-button {
                width: 100%;
                padding: 20px;
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                color: white;
                border: none;
                border-radius: 15px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                margin: 10px 0;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .camera-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
            }
            
            .camera-button:active {
                transform: translateY(0);
            }
            
            .preview-container {
                margin: 20px 0;
                text-align: center;
            }
            
            .preview-image {
                max-width: 100%;
                border-radius: 15px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .upload-button {
                width: 100%;
                padding: 15px;
                background: linear-gradient(45deg, #00d2ff, #3a47d5);
                color: white;
                border: none;
                border-radius: 15px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
                transition: all 0.3s ease;
            }
            
            .upload-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 210, 255, 0.4);
            }
            
            .upload-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .success {
                background: linear-gradient(45deg, #56ab2f, #a8e6cf);
                color: white;
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                margin: 20px 0;
                font-weight: bold;
            }
            
            .gallery-link {
                display: block;
                width: 100%;
                padding: 20px;
                background: linear-gradient(45deg, #56ab2f, #a8e6cf);
                color: white;
                text-decoration: none;
                border-radius: 15px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(86, 171, 47, 0.3);
                transition: all 0.3s ease;
            }
            
            .gallery-link:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(86, 171, 47, 0.4);
            }
            
            .info {
                background: #f8f9ff;
                padding: 20px;
                border-radius: 15px;
                border-left: 4px solid #667eea;
                margin: 20px 0;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .access-denied {
                background: #fff3cd;
                padding: 20px;
                border-radius: 15px;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
                font-size: 14px;
                line-height: 1.5;
                color: #856404;
            }
            
            .emoji {
                font-size: 24px;
                margin-bottom: 10px;
                display: block;
            }
            
            .reset-link {
                color: #667eea;
                text-decoration: none;
                font-size: 14px;
                text-align: center;
                display: block;
                margin-top: 20px;
                padding: 10px;
            }
            
            .file-input {
                display: none;
            }
            
            .gallery-status {
                background: #e8f4f8;
                padding: 15px;
                border-radius: 10px;
                margin: 15px 0;
                text-align: center;
                font-size: 14px;
                color: #2c5282;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
              <img src="/public/logo.png" alt="Logo" style="max-width: 80px; margin-bottom: 10px; border-radius: 5%; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <span class="emoji">📸💩</span>
                <h1>שיט שר - Shit Share</h1>
                <p>תשתפו מפגעים בשירותים</p>
            </div>
            
            <div class="content">
                ${success ? '<div class="success" style="text-align: center; direction: rtl; padding: 15px; background: rgba(46, 204, 113, 0.2); border-radius: 12px; margin: 15px 0; border: 1px solid rgba(46, 204, 113, 0.4);">✨ התמונה הועלתה בהצלחה! כעת ניתן לצפות בגלריה.</div>' : ''}
                ${hasUploaded ? 
                  `<div class="gallery-status">📷 ${galleryExists ? `${imageFiles.length} photos` : 'Gallery ready'} - You have access!</div>` +
                  '<a href="/gallery" class="gallery-link">הנה תמונות של כל המפגעים🔪</a>' 
                  : 
                  `<div class="access-denied" style="text-align: center; padding: 15px; font-size: 16px;">
    ${galleryExists ? 
        `📸 מחכות לך ${imageFiles.length} תמונות<br>✨ כדי לראות אותן - תעלה תמונה אחת` : 
        '🌟 תהיה הראשון שתתחיל את גלריית הקהילה! 🌟'
    }
</div>`
                }
                
                <div class="camera-section">
                    <button class="camera-button" onclick="openCamera()" type="button">
                       💩📸 צלם את המפגע אחשלי
                    </button>
                    
                    <form action="/upload" method="post" enctype="multipart/form-data" id="uploadForm">
                        <input type="file" name="image" accept="image/*" capture="environment" class="file-input" id="fileInput" onchange="previewImage(this)" required>
                        <div class="preview-container" id="previewContainer" style="display: none;">
                            <img id="previewImg" class="preview-image" alt="Preview">
                            <button type="submit" class="upload-button" id="uploadBtn">📤 Share to Gallery</button>
                        </div>
                    </form>
                </div>
                
                ${!hasUploaded ? 
  '<div class="info" style="text-align: right; direction: rtl; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 12px; margin: 15px 0;">' +
    '💡 <strong>איך זה עובד:</strong><br>' +
    '1. צלם תמונה עם המצלמה 📸<br>' +
    '2. העלה אותה כדי לפתוח את הגלריה 🔓<br>' +
    '3. צפה בכל התמונות שהעלו אחרים 👀' +
  '</div>' 
  : ''
}
                
                ${hasUploaded ? '<a href="/reset" class="reset-link">Reset Session</a>' : ''}
            </div>
        </div>
        
        <script>
            function openCamera() {
                console.log('Opening camera...');
                document.getElementById('fileInput').click();
            }
            
            function previewImage(input) {
                console.log('File selected:', input.files);
                if (input.files && input.files[0]) {
                    const file = input.files[0];
                    console.log('File details:', file.name, file.size, file.type);
                    
                    // Check if it's an image
                    if (!file.type.startsWith('image/')) {
                        alert('Please select an image file');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        console.log('Image loaded for preview');
                        document.getElementById('previewImg').src = e.target.result;
                        document.getElementById('previewContainer').style.display = 'block';
                    }
                    reader.onerror = function(e) {
                        console.error('Error reading file:', e);
                        alert('Error reading the image file');
                    }
                    reader.readAsDataURL(file);
                } else {
                    console.log('No file selected');
                }
            }
            
            // Add form submission handling
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.getElementById('uploadForm');
                const uploadBtn = document.getElementById('uploadBtn');
                
                if (form) {
                    form.addEventListener('submit', function(e) {
                        console.log('Form submission started');
                        
                        const fileInput = document.getElementById('fileInput');
                        if (!fileInput.files || !fileInput.files[0]) {
                            e.preventDefault();
                            alert('Please select a photo first');
                            return false;
                        }
                        
                        // Show loading state
                        if (uploadBtn) {
                            uploadBtn.innerHTML = '⏳ Uploading...';
                            uploadBtn.disabled = true;
                        }
                        
                        console.log('Form will submit with file:', fileInput.files[0]);
                        // Form will submit normally
                    });
                }
            });
        </script>
    </body>
    </html>
  `);
  });
});
   

app.post('/upload', (req, res) => {
  console.log('=== UPLOAD REQUEST START ===');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('content-type'));
  
  // Use multer middleware
  upload.single('image')(req, res, (err) => {
    console.log('Multer processing complete');
    console.log('Error:', err);
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    if (err) {
      console.log('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File uploaded successfully:', req.file.filename);
    console.log('File path:', req.file.path);
    console.log('File size:', req.file.size);
    
    // Check if file actually exists
    if (fs.existsSync(req.file.path)) {
      console.log('File exists on disk');
    } else {
      console.log('WARNING: File does not exist on disk!');
    }
    
    // Mark this user as having uploaded
    req.session.hasUploaded = true;
    console.log('Session updated - user now has gallery access, redirecting...');
    res.redirect('/?success=1');
  });
});

app.get('/gallery', requireUpload, (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading gallery');
    }
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    const imageGrid = imageFiles.map(file => 
      `<div class="image-item">
         <img src="/uploads/${file}" alt="Gallery Photo" loading="lazy">
       </div>`
    ).join('');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Photo Gallery - PicShare</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  padding: 10px;
              }
              
              .header {
                  text-align: center;
                  color: white;
                  margin-bottom: 20px;
                  padding: 20px;
              }
              
              .header h1 {
                  font-size: 24px;
                  margin-bottom: 10px;
              }
              
              .back-button {
                  background: rgba(255,255,255,0.2);
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 25px;
                  display: inline-block;
                  margin-bottom: 20px;
                  backdrop-filter: blur(10px);
                  border: 1px solid rgba(255,255,255,0.3);
                  font-weight: 500;
                  transition: all 0.3s ease;
              }
              
              .back-button:hover {
                  background: rgba(255,255,255,0.3);
                  transform: translateY(-2px);
              }
              
              .gallery {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                  gap: 10px;
                  max-width: 800px;
                  margin: 0 auto;
              }
              
              .image-item {
                  aspect-ratio: 1;
                  overflow: hidden;
                  border-radius: 15px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                  transition: transform 0.3s ease;
                  cursor: pointer;
              }
              
              .image-item:hover {
                  transform: scale(1.05);
              }
              
              .image-item img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  transition: transform 0.3s ease;
              }
              
              .image-item:hover img {
                  transform: scale(1.1);
              }
              
              .empty-gallery {
                  text-align: center;
                  color: white;
                  padding: 50px 20px;
                  background: rgba(255,255,255,0.1);
                  border-radius: 20px;
                  backdrop-filter: blur(10px);
                  margin: 20px;
              }
              
              .count {
                  background: rgba(255,255,255,0.2);
                  color: white;
                  padding: 8px 16px;
                  border-radius: 20px;
                  display: inline-block;
                  margin-bottom: 20px;
                  backdrop-filter: blur(10px);
              }
              
              .modal {
                  display: none;
                  position: fixed;
                  z-index: 1000;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: 100%;
                  background-color: rgba(0,0,0,0.9);
                  backdrop-filter: blur(5px);
              }
              
              .modal-content {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  max-width: 90%;
                  max-height: 90%;
                  border-radius: 15px;
                  overflow: hidden;
              }
              
              .modal img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
              }
              
              .close {
                  position: absolute;
                  top: 20px;
                  right: 30px;
                  color: white;
                  font-size: 40px;
                  font-weight: bold;
                  cursor: pointer;
                  z-index: 1001;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <a href="/" class="back-button">← Back</a>
              <h1>📷 Photo Gallery</h1>
              <div class="count">${imageFiles.length} photos shared</div>
          </div>
          
          <div class="gallery">
              ${imageFiles.length > 0 ? imageGrid : 
                '<div class="empty-gallery"><h3>📸 No photos yet!</h3><p>Upload more photos to grow the gallery!</p></div>'
              }
          </div>
          
          <div id="imageModal" class="modal" onclick="closeModal()">
              <span class="close">&times;</span>
              <div class="modal-content">
                  <img id="modalImg" src="" alt="Full size image">
              </div>
          </div>
          
          <script>
              // Add click listeners to images
              document.querySelectorAll('.image-item img').forEach(img => {
                  img.addEventListener('click', function(e) {
                      e.stopPropagation();
                      document.getElementById('modalImg').src = this.src;
                      document.getElementById('imageModal').style.display = 'block';
                  });
              });
              
              function closeModal() {
                  document.getElementById('imageModal').style.display = 'none';
              }
              
              // Close modal with escape key
              document.addEventListener('keydown', function(e) {
                  if (e.key === 'Escape') {
                      closeModal();
                  }
              });
          </script>
      </body>
      </html>
    `);
  });
});

app.get('/reset', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/');
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>File Too Large</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
                .error { background: #ff6b6b; color: white; padding: 20px; border-radius: 10px; margin: 20px; }
                .back-btn { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block; margin: 20px; }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>📱 Photo Too Large</h2>
                <p>Please try taking a smaller photo or compress the image.</p>
            </div>
            <a href="/" class="back-btn">Try Again</a>
        </body>
        </html>
      `);
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Invalid File Type</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f5f5f5; }
              .error { background: #ff6b6b; color: white; padding: 20px; border-radius: 10px; margin: 20px; }
              .back-btn { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block; margin: 20px; }
          </style>
      </head>
      <body>
          <div class="error">
              <h2>📸 Photos Only</h2>
              <p>Please take a photo with your camera.</p>
          </div>
          <a href="/" class="back-btn">Try Again</a>
      </body>
      </html>
    `);
  }
  
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`📱 PicShare running on http://localhost:${PORT}`);
  console.log('📸 Mobile-optimized camera gallery app ready!');
});