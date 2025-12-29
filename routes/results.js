const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// MongoDB setup (replace with your model if needed)
const { MongoClient, ObjectId } = require('mongodb');
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'college_app';
const collectionName = 'results';

// Multer setup for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
// Allow up to 200 MB files
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    // Only accept PDFs
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

// GET /api/results - List all results
router.get('/', async (req, res) => {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db(dbName);
    const results = await db.collection(collectionName).find({}).toArray();
    // Attach full pdfUrl
    const baseUrl = req.protocol + '://' + req.get('host') + '/uploads/';
    const mapped = results.map(r => ({
      id: r._id,
      title: r.title,
      description: r.description,
      pdfUrl: r.pdfUrl ? baseUrl + r.pdfUrl : '',
      uploadedAt: r.uploadedAt,
      fileSize: r.fileSize || 0
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  } finally {
    await client.close();
  }
});

// POST /api/results - Upload a new result (PDF)
router.post('/', upload.single('pdf'), async (req, res) => {
  const client = new MongoClient(mongoUrl);
  try {
    const { title, description } = req.body;
    if (!title || !req.file) return res.status(400).json({ error: 'Title and PDF required' });
    await client.connect();
    const db = client.db(dbName);
    const doc = {
      title,
      description: description || '',
      pdfUrl: req.file.filename,
      uploadedAt: new Date(),
      fileSize: req.file.size
    };
    const result = await db.collection(collectionName).insertOne(doc);
    res.status(201).json({ ...doc, id: result.insertedId, pdfUrl: req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload result' });
  } finally {
    await client.close();
  }
});

// DELETE /api/results/:id - Delete a result
router.delete('/:id', async (req, res) => {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection(collectionName).findOneAndDelete({ _id: new ObjectId(req.params.id) });
    if (!result.value) return res.status(404).json({ error: 'Result not found' });
    // Delete PDF file
    if (result.value.pdfUrl) {
      const filePath = path.join(uploadDir, result.value.pdfUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'Result deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete result' });
  } finally {
    await client.close();
  }
});

// For web: handle base64 PDF upload
router.post('/', async (req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    // Web: expects { title, description, pdfBase64, fileSize }
    const client = new MongoClient(mongoUrl);
    try {
      const { title, description, pdfBase64, fileSize } = req.body;
      if (!title || !pdfBase64) return res.status(400).json({ error: 'Title and PDF required' });
      // Save PDF file
      const filename = Date.now() + '_result.pdf';
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, Buffer.from(pdfBase64, 'base64'));
      await client.connect();
      const db = client.db(dbName);
      const doc = {
        title,
        description: description || '',
        pdfUrl: filename,
        uploadedAt: new Date(),
        fileSize: fileSize || 0
      };
      const result = await db.collection(collectionName).insertOne(doc);
      res.status(201).json({ ...doc, id: result.insertedId, pdfUrl: req.protocol + '://' + req.get('host') + '/uploads/' + filename });
    } catch (err) {
      res.status(500).json({ error: 'Failed to upload result (web)' });
    } finally {
      await client.close();
    }
  } else {
    next();
  }
});

module.exports = router;
