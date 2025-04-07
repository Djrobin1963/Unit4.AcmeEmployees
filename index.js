/* import and initialize express app */
const express = require(`express`);
const { Client } = require(`pg`);
const app = express();
const PORT = process.env.PORT || 3000;
/* this middleware deals with CORS errors and allows the client on port 5173 to access the server */
const cors = require("cors");
/* morgan is a logging library that allows us to see the requests being made to the server */
const morgan = require("morgan");
const employees = require("./db/index");

// Database Setup
const client = new Client({
  connectionString: process.env.DATABASE_URL || 3000,
});

client.connect(); // connection

/* set up express middleware */
app.use(morgan("dev"));
const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Create table */

const createTables = async () => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(25) NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT false
      );
    `);
    console.log("Table 'employees' created (if not exists)");
  } catch (err) {
    console.error("Error creating table:", err);
  }
};

const seedData = async () => {
  try {
    console.log("Checking if database needs seeding...");

    // Check if there are any employees in the table
    const result = await client.query("SELECT COUNT(*) FROM employees");
    const count = parseInt(result.rows[0].count, 10);

    if (count === 0) {
      console.log("Seeding database...");
      for (const employee of employees) {
        await client.query(
          "INSERT INTO employees (name, phone, is_admin) VALUES ($1, $2, $3)",
          [employee.name, employee.phone, employee.is_admin]
        );
      }
      console.log("Seeding complete");
    } else {
      console.log("Database already seeded, skipping...");
    }
  } catch (err) {
    console.error("Error seeding data:", err);
  }
};

// SEED DATA FUNCTION #1

/*
const seedData = async () => {
  try {
    console.log("Seeding database...");
    
    for (const employee of employees) {
      await client.query(
        "INSERT INTO employees (name, phone, is_admin) VALUES ($1, $2, $3)",
        [employee.name, employee.phone, employee.is_admin]
      );
    }

    console.log("Seeding complete");
  } catch (err) {
    console.error("Error seeding data:", err);
  }
}; */

// Initialize database
const init = async () => {
  await createTables();
  await seedData();
  console.log("Database initialized");
};

init();

/* set up intial hello world route */
app.get(`/`, (req, res) => {
  res.send(`Hello World!`);
});

/* set up api route */
app.get("/api/employees", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM employees");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const { name, phone, is_admin } = req.body;
    const result = await client.query(
      "INSERT INTO employees (name, phone, is_admin) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, is_admin]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* our middleware won't capture 404 errors, so we're setting up a separate error handler for those*/
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});
/* initialize server (listen) */
app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
