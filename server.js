const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const port = 3000;
const prisma = new PrismaClient();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Login credentials
const USERNAME = "admin";
const PASSWORD = "1234";

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

app.post("/submit", async (req, res) => {
  const { firstName, place, poojaType, amount } = req.body;
  await prisma.entry.create({
    data: { firstName, place, poojaType, amount: parseInt(amount) },
  });
  res.send("Submitted successfully! <a href='/form'>Add Another</a> | <a href='/report'>See Report</a>");
});

// Summary report
app.get("/report", async (req, res) => {
  const summary = await prisma.entry.groupBy({
    by: ["poojaType"],
    _count: { poojaType: true },
  });
  const entries = await prisma.entry.findMany();
  res.render("report", { summary, entries });
});

// Individual pooja/donation report
app.get("/report/:poojaType", async (req, res) => {
  const poojaType = req.params.poojaType;
  const entries = await prisma.entry.findMany({ where: { poojaType } });
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  res.render("report_single", { poojaType, entries, total });
});

// Delete entry
app.get("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.entry.delete({ where: { id } });
  res.redirect("/report");
});

// Show edit form
app.get("/edit/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const entry = await prisma.entry.findUnique({ where: { id } });
  res.render("edit", { entry });
});

// Handle edit submission
app.post("/edit/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { firstName, place, poojaType, amount } = req.body;
  await prisma.entry.update({
    where: { id },
    data: { firstName, place, poojaType, amount: parseInt(amount) },
  });
  res.redirect("/report");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

