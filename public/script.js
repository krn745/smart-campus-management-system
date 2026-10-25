
const $ = (id) => document.getElementById(id);

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

let students = [];

async function loadStudents() {
  try {
    students = await apiRequest("/api/students");

    const total = $("totalStudents");
    if (total) total.textContent = students.length;

    const recent = $("recentStudents");
    if (recent) {
      recent.replaceChildren();

      const latest = students.slice(0, 5);

      if (latest.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.textContent = "No students registered yet.";
        row.appendChild(cell);
        recent.appendChild(row);
      } else {
        latest.forEach(student => {
          const row = document.createElement("tr");

          [student.name, student.rollNo, student.department]
            .forEach(value => {
              const cell = document.createElement("td");
              cell.textContent = value;
              row.appendChild(cell);
            });

          recent.appendChild(row);
        });
      }
    }

    renderStudents();
    if ($("loading")) $("loading").hidden = true;
  } catch (error) {
    if ($("loading")) {
      $("loading").hidden = false;
      $("loading").textContent = "Unable to load students. Check the server.";
    }

    if ($("recentStudents")) {
      $("recentStudents").textContent = "";
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "Unable to load student records.";
      row.appendChild(cell);
      $("recentStudents").appendChild(row);
    }

    if ($("message")) {
      $("message").textContent = error.message;
      $("message").style.color = "#dc2626";
    }
  }
}

function renderStudents() {
  const table = $("studentTable");
  if (!table) return;

  const keyword = ($("search")?.value || "").trim().toLowerCase();

  const filtered = students.filter(student =>
    [student.name, student.rollNo, student.department]
      .some(value => value.toLowerCase().includes(keyword))
  );

  table.replaceChildren();

  if (filtered.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = students.length
      ? "No matching students found."
      : "No students registered yet.";
    row.appendChild(cell);
    table.appendChild(row);
    return;
  }

  filtered.forEach(student => {
    const row = document.createElement("tr");

    [student.name, student.rollNo, student.department]
      .forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      if (!confirm(`Delete ${student.name}?`)) return;

      deleteButton.disabled = true;

      try {
        await apiRequest(`/api/students/${student.id}`, {
          method: "DELETE"
        });

        await loadStudents();

        if ($("message")) {
          $("message").textContent = "Student deleted successfully!";
          $("message").style.color = "#15803d";
        }
      } catch (error) {
        alert(error.message);
        deleteButton.disabled = false;
      }
    });

    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

const studentForm = $("studentForm");

if (studentForm) {
  studentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const button = studentForm.querySelector(
      'button[type="submit"]'
    );

    const message = $("message");

    const student = {
      name: $("name").value.trim(),
      rollNo: $("rollNo").value.trim(),
      department: $("department").value.trim()
    };

    if (!student.name || !student.rollNo || !student.department) {
      message.textContent = "Please fill in all fields.";
      message.style.color = "#dc2626";
      return;
    }

    button.disabled = true;
    message.textContent = "Saving student...";

    try {
      await apiRequest("/api/students", {
        method: "POST",
        body: JSON.stringify(student)
      });

      studentForm.reset();
      if ($("search")) $("search").value = "";

      await loadStudents();

      message.textContent = "Student added successfully!";
      message.style.color = "#15803d";
    } catch (error) {
      message.textContent = error.message;
      message.style.color = "#dc2626";
    } finally {
      button.disabled = false;
    }
  });
}

if ($("search")) {
  $("search").addEventListener("input", renderStudents);
}

// This script works on all pages.
loadStudents();
