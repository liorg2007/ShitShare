const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { homeTemplate, galleryTemplate } = require('./views/templates');

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
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
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

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configure session
app.use(session({
  secret: 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use('/public', express.static(publicDir));

// Middleware to check if user has uploaded
const requireUpload = (req, res, next) => {
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
  
  fs.readdir(uploadsDir, (err, files) => {
    const imageFiles = err ? [] : files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    const galleryExists = imageFiles.length > 0;
    res.send(homeTemplate(hasUploaded, success, imageFiles, galleryExists));
  });
});

app.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    req.session.hasUploaded = true;
    res.redirect('/?success=1');
  });
});

app.get('/gallery', requireUpload, (req, res) => {
  res.send(galleryTemplate([]));  // Send empty template, JavaScript will load images
});

// API endpoint for paginated gallery data
app.get('/gallery/data', requireUpload, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12; // Number of images per page - smaller batch for better UX
  
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading gallery' });
    }
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }).sort((a, b) => {
      // Sort by timestamp in filename, most recent first
      const timestampA = parseInt(a.split('-')[0]);
      const timestampB = parseInt(b.split('-')[0]);
      return timestampB - timestampA;
    });
    
    const totalImages = imageFiles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedImages = imageFiles.slice(startIndex, endIndex);
    
    res.json({
      images: paginatedImages,
      currentPage: page,
      totalPages: Math.ceil(totalImages / limit),
      totalImages: totalImages
    });
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

// Paginated API endpoint for gallery images
app.get('/api/gallery', requireUpload, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;

    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading gallery' });
        }
        
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        }).sort((a, b) => {
            // Sort by timestamp in filename (newest first)
            const timeA = a.split('-')[0];
            const timeB = b.split('-')[0];
            return timeB - timeA;
        });
        
        const totalImages = imageFiles.length;
        const totalPages = Math.ceil(totalImages / perPage);
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedImages = imageFiles.slice(startIndex, endIndex);
        
        res.json({
            images: paginatedImages,
            currentPage: page,
            totalPages,
            totalImages
        });
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send('File too large');
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).send('Only image files are allowed');
  }
  
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`📱 PicShare running on http://localhost:${PORT}`);
});
