const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAdmin, isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Configure multer for general file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images and 3D model files
    const filetypes = /jpeg|jpg|png|gif|glb|gltf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Invalid file type!');
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Configure storage for product files (models and thumbnails)
const productFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    
    if (file.fieldname === 'model') {
      uploadDir = path.join(__dirname, '..', 'uploads', 'models');
    } else if (file.fieldname === 'thumbnail') {
      uploadDir = path.join(__dirname, '..', 'uploads', 'thumbnails');
    } else {
      uploadDir = path.join(__dirname, '..', 'uploads');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Configure multer for product files
const productFileUpload = multer({
  storage: productFileStorage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'model') {
      // Only accept .glb files for models
      if (path.extname(file.originalname).toLowerCase() !== '.glb') {
        return cb(new Error('Only .glb files are allowed for 3D models'));
      }
    } else if (file.fieldname === 'thumbnail') {
      // Only accept image files for thumbnails
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for thumbnails'));
      }
    }
    
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Upload single file
router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Upload product files (model and thumbnail)
router.post('/product-files', isAdmin, (req, res) => {
  console.log('Product files upload request received');
  
  // Use the middleware but handle errors properly
  const upload = productFileUpload.fields([
    { name: 'model', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]);
  
  upload(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        message: err.message || 'Error uploading files',
        error: err.toString()
      });
    }
    
    try {
      console.log('Files received:', req.files ? Object.keys(req.files) : 'none');
      
      const modelFile = req.files?.model?.[0];
      const thumbnailFile = req.files?.thumbnail?.[0];
      
      if (!modelFile && !thumbnailFile) {
        console.error('No files uploaded');
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      // Get base URL from request (including protocol, host, port)
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      console.log('Base URL for file paths:', baseUrl);
      
      const response = {};
      
      if (modelFile) {
        // Verify the file exists
        const modelPath = path.join(__dirname, '..', 'uploads', 'models', modelFile.filename);
        if (!fs.existsSync(modelPath)) {
          console.error(`Model file not found at path: ${modelPath}`);
          return res.status(500).json({ message: 'Model file was not saved correctly' });
        }
        
        console.log('Model file saved:', modelFile.filename, 'size:', modelFile.size, 'bytes', 'path:', modelPath);
        
        // Include both relative and absolute URLs
        response.modelUrl = `/uploads/models/${modelFile.filename}`;
        response.modelFullUrl = `${baseUrl}/uploads/models/${modelFile.filename}`;
        
        console.log('Model URLs generated:', {
          relative: response.modelUrl,
          full: response.modelFullUrl
        });
      }
      
      if (thumbnailFile) {
        // Verify the file exists
        const thumbnailPath = path.join(__dirname, '..', 'uploads', 'thumbnails', thumbnailFile.filename);
        if (!fs.existsSync(thumbnailPath)) {
          console.error(`Thumbnail file not found at path: ${thumbnailPath}`);
          return res.status(500).json({ message: 'Thumbnail file was not saved correctly' });
        }
        
        console.log('Thumbnail file saved:', thumbnailFile.filename, 'size:', thumbnailFile.size, 'bytes', 'path:', thumbnailPath);
        
        // Include both relative and absolute URLs
        response.thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
        response.thumbnailFullUrl = `${baseUrl}/uploads/thumbnails/${thumbnailFile.filename}`;
        
        console.log('Thumbnail URLs generated:', {
          relative: response.thumbnailUrl,
          full: response.thumbnailFullUrl
        });
      }
      
      console.log('Sending complete response:', response);
      
      res.json({
        message: 'Files uploaded successfully',
        ...response
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Error processing uploaded files',
        error: error.toString()
      });
    }
  });
});

// Delete temporary file
router.delete('/temp/:filename', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads/temp', req.params.filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router; 