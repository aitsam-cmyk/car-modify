// ✅ Express built-in parsers + clean setup
const express = require('express');
const app = express();

const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

/* ---------- Config ---------- */
const PORT = process.env.PORT || 3000;

// ⚠️ Agar Railway volume use karna ho to DATABASE_PATH ko env me set karein,
// e.g. "/data/cargarage.db" (Volume mount path). Warna local "data/cargarage.db" ban jayega.
const DB_DIR = path.join(__dirname, 'data');
if (!process.env.DATABASE_PATH) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}
const dbPath = process.env.DATABASE_PATH || path.join(DB_DIR, 'cargarage.db');

/* ---------- Middleware ---------- */
app.use(cors());

// ⚠️ Parsers ko sirf **ek dafa** configure karein (no duplicates)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files (images/css/html) — project root se serve
app.use(express.static(path.join(__dirname)));

/* ---------- Health Check & Root ---------- */
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Root par aapka main HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'modify.html'));
});

/* ---------- SQLite Connection & Schema ---------- */
const db = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
        if (err) {
            console.error('SQLite connection error:', err);
        } else {
            console.log('Connected to SQLite database at:', dbPath);
        }
    }
);

// ✅ Ensure table (IF NOT EXISTS) — first run par create ho jayega
db.run(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    mainImg TEXT NOT NULL,
    imgs TEXT NOT NULL,
    desc TEXT,
    specs TEXT,
    sold INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
    if (err) console.error('Table creation error:', err);
});

// ✅ Seed only if empty
db.get('SELECT COUNT(*) as count FROM cars', (err, row) => {
    if (err) {
        console.error('Count query error:', err);
        return;
    }
    if (row && row.count === 0) {
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
            { name: 'Toyota Gli 2015', price: 'SOLD', mainImg: './gli2015.jpg', imgs: JSON.stringify(['./gli2015.jpg']), desc: 'Sold vehicle.', specs: JSON.stringify([]), sold: 1 },
            { name: 'Toyota Corolla 2011', price: 'SOLD', mainImg: './gli 2011.jpg', imgs: JSON.stringify(['./gli 2011.jpg']), desc: 'Sold vehicle.', specs: JSON.stringify([]), sold: 1 },
            { name: 'Toyota Grandi 2024', price: 'SOLD', mainImg: './grandi 2024.jpg', imgs: JSON.stringify(['./grandi 2024.jpg']), desc: 'Sold vehicle.', specs: JSON.stringify([]), sold: 1 },
            { name: 'Toyota Xli 2011', price: 'SOLD', mainImg: './xli2011.jpg', imgs: JSON.stringify(['./xli2011.jpg']), desc: 'Sold vehicle.', specs: JSON.stringify([]), sold: 1 }
        ];

        const stmt = db.prepare(`INSERT INTO cars (name, price, mainImg, imgs, desc, specs, sold) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        defaultCars.forEach(car => {
            stmt.run(car.name, car.price, car.mainImg, car.imgs, car.desc, car.specs, car.sold);
        });
        stmt.finalize();
        console.log('Inserted default seed data ✅');
    }
});

/* ---------- API Routes ---------- */

// GET all cars
app.get('/api/cars', (req, res) => {
    db.all('SELECT * FROM cars ORDER BY id DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch cars' });
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
        if (err) return res.status(500).json({ error: 'Failed to fetch car' });
        if (!row) return res.status(404).json({ error: 'Car not found' });
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
    if (!name || !price || !mainImg) return res.status(400).json({ error: 'Missing required fields' });

    db.run(
        `INSERT INTO cars (name, price, mainImg, imgs, desc, specs, sold) VALUES (?, ?, ?, ?, ?, ?, ?)`, [name, price, mainImg, JSON.stringify(imgs || []), desc || '', JSON.stringify(specs || []), 0],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to add car' });
            res.status(201).json({ id: this.lastID, name, price, mainImg, imgs: imgs || [], desc: desc || '', specs: specs || [], sold: false });
        }
    );
});

// PUT - Update car
app.put('/api/cars/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, mainImg, imgs, desc, specs, sold } = req.body;
    if (!name || !price || !mainImg) return res.status(400).json({ error: 'Missing required fields' });

    db.run(
        `UPDATE cars
     SET name = ?, price = ?, mainImg = ?, imgs = ?, desc = ?, specs = ?, sold = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`, [name, price, mainImg, JSON.stringify(imgs || []), desc || '', JSON.stringify(specs || []), sold ? 1 : 0, id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update car' });
            if (this.changes === 0) return res.status(404).json({ error: 'Car not found' });
            res.json({ id: Number(id), name, price, mainImg, imgs: imgs || [], desc: desc || '', specs: specs || [], sold: !!sold });
        }
    );
});

// DELETE - Remove car
app.delete('/api/cars/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM cars WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to delete car' });
        if (this.changes === 0) return res.status(404).json({ error: 'Car not found' });
        res.json({ message: 'Car deleted successfully', id });
    });
});

// PATCH - Mark car as sold
app.patch('/api/cars/:id/sold', (req, res) => {
    const { id } = req.params;
    db.run(
        `UPDATE cars SET sold = 1, price = 'SOLD', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update car' });
            if (this.changes === 0) return res.status(404).json({ error: 'Car not found' });
            res.json({ message: 'Car marked as sold', id });
        }
    );
});

/* ---------- Start server (Railway requires 0.0.0.0) ---------- */
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚗 Car Garage Server running at http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} busy. Kill the process using it or set PORT to a different value.`);
    } else {
        console.error('Server error:', err);
    }
});

/* ---------- Graceful shutdown ---------- */
function shutdown() {
    try { db.close(); } catch {}
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);