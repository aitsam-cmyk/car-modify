const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// ensure static files (images, css, html) are served from project folder
app.use(express.static(path.join(__dirname)));

// Serve modify.html at root to avoid "Cannot GET /"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'modify.html'));
});

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'cargarage.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database');
});

// Create cars table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        mainImg LONGTEXT NOT NULL,
        imgs LONGTEXT NOT NULL,
        desc TEXT,
        specs TEXT,
        sold INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Insert default data if table is empty
db.get('SELECT COUNT(*) as count FROM cars', (err, row) => {
    if (row.count === 0) {
        const defaultCars = [{
                name: 'Suzuki Cultus 2006',
                price: 'PKR 810,000',
                mainImg: './cul11.jpeg',
                imgs: JSON.stringify(['./cul1.jpeg', './cul2.jpeg', './cul3.jpeg', './cul4.jpeg', './cul5.jpeg', './cul6.jpeg', './cul7.jpeg', './cul8.jpeg', './cul9.jpeg', './cul10.jpeg', './cul11.jpeg', './cul12.jpeg', './cul13.jpeg']),
                desc: 'Genuine interior, accident-free,tires ok,outer Roof Genioun,machanically ok,Registered:Mansehra.',
                specs: JSON.stringify(['Engine: 1000cc', 'Condition: Very Good']),
                sold: 0
            },
            {
                name: 'Nissan Sunny 1986',
                price: 'PKR 550,000',
                mainImg: './nis8.jpeg',
                imgs: JSON.stringify(['./nis1.jpeg', './nis2.jpeg', './nis3.jpeg', './nis4.jpeg', './nis5.jpeg', './nis6.jpeg', './nis7.jpeg', './nis8.jpeg', './nis9.jpeg', './nis10.jpeg', './nis11.jpeg']),
                desc: 'Japan Import, ideal city car,Good Condition,Interior genioun,Exterior 70-75% genioun, Mechanically ok.',
                specs: JSON.stringify(['Engine: 1300cc', 'Registered:1994', 'Condition: Excellent, Home Used']),
                sold: 0
            },
            {
                name: 'Toyota Gli 2015',
                price: 'SOLD',
                mainImg: './gli2015.jpg',
                imgs: JSON.stringify(['./gli2015.jpg']),
                desc: 'Sold vehicle.',
                specs: JSON.stringify([]),
                sold: 1
            },
            {
                name: 'Toyota Corolla 2011',
                price: 'SOLD',
                mainImg: './gli 2011.jpg',
                imgs: JSON.stringify(['./gli 2011.jpg']),
                desc: 'Sold vehicle.',
                specs: JSON.stringify([]),
                sold: 1
            },
            {
                name: 'Toyota Grandi 2024',
                price: 'SOLD',
                mainImg: './grandi 2024.jpg',
                imgs: JSON.stringify(['./grandi 2024.jpg']),
                desc: 'Sold vehicle.',
                specs: JSON.stringify([]),
                sold: 1
            },
            {
                name: 'Toyota Xli 2011',
                price: 'SOLD',
                mainImg: './xli2011.jpg',
                imgs: JSON.stringify(['./xli2011.jpg']),
                desc: 'Sold vehicle.',
                specs: JSON.stringify([]),
                sold: 1
            }
        ];

        defaultCars.forEach(car => {
            db.run(
                `INSERT INTO cars (name, price, mainImg, imgs, desc, specs, sold) VALUES (?, ?, ?, ?, ?, ?, ?)`, [car.name, car.price, car.mainImg, car.imgs, car.desc, car.specs, car.sold]
            );
        });
    }
});

// API Routes

// GET all cars
app.get('/api/cars', (req, res) => {
    db.all('SELECT * FROM cars ORDER BY id DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch cars' });
            return;
        }
        const cars = rows.map(car => ({
            id: car.id,
            name: car.name,
            price: car.price,
            mainImg: car.mainImg,
            imgs: JSON.parse(car.imgs),
            desc: car.desc,
            specs: JSON.parse(car.specs),
            sold: car.sold === 1
        }));
        res.json(cars);
    });
});

// GET single car by ID
app.get('/api/cars/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM cars WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch car' });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }
        res.json({
            id: row.id,
            name: row.name,
            price: row.price,
            mainImg: row.mainImg,
            imgs: JSON.parse(row.imgs),
            desc: row.desc,
            specs: JSON.parse(row.specs),
            sold: row.sold === 1
        });
    });
});

// POST - Add new car
app.post('/api/cars', (req, res) => {
    const { name, price, mainImg, imgs, desc, specs } = req.body;

    if (!name || !price || !mainImg) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    db.run(
        `INSERT INTO cars (name, price, mainImg, imgs, desc, specs, sold) VALUES (?, ?, ?, ?, ?, ?, ?)`, [name, price, mainImg, JSON.stringify(imgs), desc, JSON.stringify(specs), 0],
        function(err) {
            if (err) {
                res.status(500).json({ error: 'Failed to add car' });
                return;
            }
            res.status(201).json({
                id: this.lastID,
                name,
                price,
                mainImg,
                imgs,
                desc,
                specs,
                sold: false
            });
        }
    );
});

// PUT - Update car
app.put('/api/cars/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, mainImg, imgs, desc, specs, sold } = req.body;

    if (!name || !price || !mainImg) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    db.run(
        `UPDATE cars SET name = ?, price = ?, mainImg = ?, imgs = ?, desc = ?, specs = ?, sold = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [name, price, mainImg, JSON.stringify(imgs), desc, JSON.stringify(specs), sold ? 1 : 0, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: 'Failed to update car' });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Car not found' });
                return;
            }
            res.json({
                id: parseInt(id),
                name,
                price,
                mainImg,
                imgs,
                desc,
                specs,
                sold: sold || false
            });
        }
    );
});

// DELETE - Remove car
app.delete('/api/cars/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM cars WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: 'Failed to delete car' });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }
        res.json({ message: 'Car deleted successfully', id });
    });
});

// PATCH - Mark car as sold
app.patch('/api/cars/:id/sold', (req, res) => {
    const { id } = req.params;

    db.run(
        `UPDATE cars SET sold = 1, price = 'SOLD', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [id],
        function(err) {
            if (err) {
                res.status(500).json({ error: 'Failed to update car' });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Car not found' });
                return;
            }
            res.json({ message: 'Car marked as sold', id });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`🚗 Car Garage Server running at http://localhost:${PORT}`);
});