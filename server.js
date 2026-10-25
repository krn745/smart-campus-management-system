
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3000;

// Create or open the database file
const db = new Database(path.join(__dirname, "campus.db"));

// Create the students table
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rollNo TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Get all students
app.get("/api/students", (req, res) => {
  const students = db
    .prepare("SELECT * FROM students ORDER BY id DESC")
    .all();

  res.json(students);
});

// Add a new student
app.post("/api/students", (req, res) => {
  const { name, rollNo, department } = req.body;

  if (
    typeof name !== "string" ||
    typeof rollNo !== "string" ||
    typeof department !== "string" ||
    !name.trim() ||
    !rollNo.trim() ||
    !department.trim()
  ) {
    return res.status(400).json({
      message: "Please fill in all student details."
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO students (name, rollNo, department)
      VALUES (?, ?, ?)
    `).run(name.trim(), rollNo.trim(), department.trim());

    res.status(201).json({
      message: "Student added successfully!",
      id: Number(result.lastInsertRowid)
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        message: "This roll number already exists."
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Unable to add student."
    });
  }
});

// Delete a student
app.delete("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      message: "Invalid student ID."
    });
  }

  const result = db
    .prepare("DELETE FROM students WHERE id = ?")
    .run(id);

  if (result.changes === 0) {
    return res.status(404).json({
      message: "Student not found."
    });
  }

  res.json({ message: "Student deleted successfully!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Smart Campus running at http://localhost:${PORT}`);
});
