const express = require("express");
const { Storage } = require('@google-cloud/storage');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Inisialisasi Google Cloud Storage dan Google Cloud Vision client
const storage = new Storage();
const vision = new ImageAnnotatorClient();

// Nama bucket Google Cloud Storage
const bucketName = 'lawmate_user_bucket';
const folderName = 'gambar_ocr/';

// Konfigurasi multer untuk menangani unggah file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Batas ukuran file: 5 MB
  },
});

// Fungsi untuk mengunggah gambar ke Google Cloud Storage
const uploadImage = async (req, res, next) => {
  try {
    const file = req.file;

    // Periksa apakah file dan file.buffer ada
    if (!file || !file.buffer) {
      return res.status(400).json({ error: "Tidak ada file yang diunggah" });
    }

    // Menyimpan buffer file yang diunggah ke req untuk digunakan di middleware selanjutnya
    req.uploadedFileBuffer = file.buffer;

    // Menulis file ke disk
    const filePath = path.join(__dirname, file.originalname);
    fs.writeFileSync(filePath, file.buffer);

    // Mengunggah file ke Google Cloud Storage
    const destination = `${folderName}${file.originalname}`;
    await storage.bucket(bucketName).upload(filePath, {
      destination: destination,
      gzip: true,
    });

    // Menghapus file dari disk
    fs.unlinkSync(filePath);

    // Lanjut ke middleware selanjutnya
    next();
  } catch (error) {
    console.error('Error during image upload:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Fungsi untuk melakukan OCR pada file
const ocrImage = async (req, res, next) => {
  try {
    // Pastikan buffer file yang telah disimpan di req
    const imageType = req.imageType
    const gs_URI = req.gs_URI
    console.log(imageType)
    if(imageType !== 'chat' || imageType == undefined){
      console.log('Image is not a chat or undefined')
      next()
    }
    // Lakukan OCR pada file
    const [result] = await vision.textDetection(gs_URI);
    const detections = result.textAnnotations;

    // Kirim respons OCR
    return res.status(200).json({ result: detections });
  } catch (error) {
    console.error('Error during OCR:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  uploadImage,
  ocrImage,
};
