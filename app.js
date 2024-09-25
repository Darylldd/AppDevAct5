const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');  
app.use(express.static('public')); 

const db = mysql.createConnection({
    host: 'localhost',  
    user: 'root',      
    password: '',      
    database: 'music_db' 
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database.');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');  
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  
    }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    getUploadedSongs((songs) => {
        res.render('index', { songs });  
    });
});

app.post('/upload', upload.single('mp3file'), (req, res) => {
    const songName = req.body.songName;  
    const artistName = req.body.artistName;  
    const filename = req.file.filename;
    const filepath = `/uploads/${filename}`;

    const query = 'INSERT INTO songs (song_name, artist_name, filename, filepath) VALUES (?, ?, ?, ?)';
    db.query(query, [songName, artistName, filename, filepath], (err, result) => {
        if (err) {
            console.error(`Failed to insert into database: ${err}`);
            return res.status(500).send('Database error');
        }
        console.log('File information saved to database');
        res.redirect('/');
    });
});

app.post('/delete', (req, res) => {
    const songId = req.body.song_id;

    const query = 'SELECT filepath FROM songs WHERE id = ?';
    db.query(query, [songId], (err, results) => {
        if (err || results.length === 0) {
            console.error(`Song not found: ${err}`);
            return res.status(404).send('Song not found');
        }

        const filepath = path.join(__dirname, 'public', results[0].filepath);

        fs.unlink(filepath, (err) => {
            if (err) {
                console.error(`Failed to delete file: ${err}`);
                return res.status(500).send('File deletion error');
            }

            const deleteQuery = 'DELETE FROM songs WHERE id = ?';
            db.query(deleteQuery, [songId], (err) => {
                if (err) {
                    console.error(`Failed to delete from database: ${err}`);
                    return res.status(500).send('Database deletion error');
                }
                console.log('File and database entry deleted successfully.');
                res.redirect('/');
            });
        });
    });
});

function getUploadedSongs(callback) {
    const query = 'SELECT * FROM songs ORDER BY uploaded_at DESC';
    db.query(query, (err, results) => {
        if (err) throw err;
        callback(results);
    });
}

app.post('/favorite', (req, res) => {
    const songId = req.body.song_id;
    const isFavorite = req.body.is_favorite === 'true';

    const query = 'UPDATE songs SET is_favorite = ? WHERE id = ?';
    db.query(query, [isFavorite, songId], (err) => {
        if (err) {
            console.error(`Failed to update favorite status: ${err}`);
            return res.status(500).send('Database update error');
        }
        res.redirect('/');
    });
});

app.get('/favorites', (req, res) => {
    const query = 'SELECT * FROM songs WHERE is_favorite = true ORDER BY uploaded_at DESC';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.render('favorites', { songs: results });
    });
});


app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
