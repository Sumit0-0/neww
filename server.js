const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));



// Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error(err.message);
  console.log("Connected to SQLite database");
});

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    place TEXT,
    poojaType TEXT,
    amount INTEGER
)`);

// Simple login (hardcoded credentials)
const USERNAME = "admin";
const PASSWORD = "1234";
// serve static files (css, js, images) from public folder
app.use(express.static(path.join(__dirname, "public")));


// Routes
app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    res.redirect("/form");
  } else {
    res.send("Invalid credentials. <a href='/'>Try again</a>");
  }
});

app.get("/form", (req, res) => {
  res.render("form");
});

app.post("/submit", (req, res) => {
  const { firstName, place, poojaType, amount } = req.body;
  db.run(
    `INSERT INTO entries(firstName, place, poojaType, amount) VALUES(?,?,?,?)`,
    [firstName, place, poojaType, amount],
    (err) => {
      if (err) console.error(err.message);
      res.send("Submitted successfully! <a href='/form'>Add Another</a> | <a href='/report'>See Report</a>");
    }
  );
});

// Summary report
app.get("/report", (req, res) => {
  db.all(`SELECT poojaType, COUNT(*) as count FROM entries GROUP BY poojaType`, (err, rows) => {
    if (err) console.error(err.message);

    db.all(`SELECT * FROM entries`, (err, allEntries) => {
      res.render("report", { summary: rows, entries: allEntries });
    });
  });
});

// Individual pooja/donation report
app.get("/report/:poojaType", (req, res) => {
  const poojaType = req.params.poojaType;

  db.all(
    `SELECT * FROM entries WHERE poojaType = ?`,
    [poojaType],
    (err, rows) => {
      if (err) console.error(err.message);

      // Calculate total amount for this pooja
      const total = rows.reduce((sum, e) => sum + e.amount, 0);

      res.render("report_single", { poojaType, entries: rows, total });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// Delete entry
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM entries WHERE id = ?`, [id], (err) => {
    if (err) console.error(err.message);
    res.redirect("/report");
  });
});
// Show edit form
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM entries WHERE id = ?`, [id], (err, row) => {
    if (err) console.error(err.message);
    res.render("edit", { entry: row });
  });
});

// Handle edit submission
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const { firstName, place, poojaType, amount } = req.body;

  db.run(
    `UPDATE entries SET firstName = ?, place = ?, poojaType = ?, amount = ? WHERE id = ?`,
    [firstName, place, poojaType, amount, id],
    (err) => {
      if (err) console.error(err.message);
      res.redirect("/report");
    }
  );
});
