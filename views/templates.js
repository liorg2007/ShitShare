const homeTemplate = (hasUploaded, success, imageFiles, galleryExists) => `
<!DOCTYPE html>
<html>
<head>
    <title>PicShare - Camera Gallery</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="/public/styles.css">
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
    <script src="/public/main.js"></script>
</body>
</html>`;

const galleryTemplate = (imageFiles) => `
<!DOCTYPE html>
<html>
<head>
    <title>Photo Gallery - PicShare</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/public/gallery.css">
</head>
<body>
    <div class="header">
        <a href="/" class="back-button">← Back</a>
        <h1>📷 Photo Gallery</h1>
        <div class="count">Loading...</div>
    </div>
    
    <div class="gallery">
        <!-- Images will be loaded dynamically via JavaScript -->
    </div>
    
    <div id="imageModal" class="modal" onclick="closeModal()">
        <span class="close">&times;</span>
        <div class="modal-content">
            <img id="modalImg" src="" alt="Full size image">
        </div>
    </div>
    <script src="/public/gallery.js"></script>
</body>
</html>`;

module.exports = {
    homeTemplate,
    galleryTemplate
};
