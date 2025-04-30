// Add this line to serve static files from the uploads directory, 
// making sure to place it BEFORE the routes definition
// This will make models and thumbnails accessible from the frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set proper MIME type for .glb files
    if (path.extname(filePath) === '.glb') {
      res.setHeader('Content-Type', 'model/gltf-binary');
    }
  }
}));

// ... continue with existing code 