import express from 'express';
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/Auth.js";
import id from "./routes/Id.js";
import cors from "cors";
import multer from 'multer';
import path from 'path';
import tesseract from 'node-tesseract-ocr';
import bodyParser from 'body-parser';
import fs from 'fs';

dotenv.config();

// Database config
const MONGO_URI = 'mongodb://localhost:27017';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to MongoDB'));

// Rest object
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'C:/Users/ayush/Downloads/stachar-main (1)/stachar-main/Uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Change the file extension to '.jpg'
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
  }
});

// Initialize Multer with the storage configuration
const upload = multer({ storage: storage });

const tesseractConfig = {
  lang: 'eng',
  oem: 1,
  psm: 3,
};

// Route for file upload
app.post('/upload', upload.single('image'), (req, res) => {
  console.log(req.file);

  try {
    const uploadedImagePath = req.file.path;

    // Check if the file exists
    if (!fs.existsSync(uploadedImagePath)) {
      console.error('File does not exist:', uploadedImagePath);
      return res.status(500).send('File does not exist');
    }

    // Log the file path and contents
    console.log('Uploaded image path:', uploadedImagePath);

    // Recognize text from the image
    tesseract.recognize(uploadedImagePath, tesseractConfig)
      .then(text => {
        console.log("OCR Result:", text);
        res.status(201).send({
          message: 'File uploaded successfully',
          text: text
        });
      })
      .catch(error => {
        console.error('Error during OCR processing:', error);
        res.status(500).send('Error during OCR processing');
      });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use("/api/mvc/auth", authRoutes);
app.use("/api/mvc/ids", id);

// PORT
const port = 5000;

// Run listen
app.listen(port, () => {
  console.log(`STACHAR listening at http://localhost:${port}`);
});
