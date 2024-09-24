const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure Body-Parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Storage setup for multer to store uploaded files in 'public/uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route for homepage
app.get('/', (req, res) => {
    res.render('index', { songs: getUploadedSongs() });
});

// Route to handle file upload
app.post('/upload', upload.single('mp3file'), (req, res) => {
    res.redirect('/');
});

// Route to handle deleting a song
app.post('/delete', (req, res) => {
    const song = req.body.song;

    // Path to the file that should be deleted
    const filePath = path.join(__dirname, 'public/uploads', song);

    // Check if the file exists, and then remove it
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Failed to delete file: ${err}`);
        } else {
            console.log(`${song} was deleted successfully.`);
        }
    });

    res.redirect('/');
});

// Helper function to get all uploaded songs
function getUploadedSongs() {
    const dirPath = path.join(__dirname, 'public/uploads');
    const files = fs.readdirSync(dirPath);
    const songs = files.filter(file => file.endsWith('.mp3'));
    return songs;
}

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
