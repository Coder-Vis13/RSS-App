//you have to obey all constraints set in the db 

//node scripts/insertTestUser.js - what was used to add it

//user_id : 2


const pool = require("../config/db");

const insertTestUser = async () => {
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING user_id`,
      ["Test User", "testuser@example.com", "testpasswordhash"]
    );
    console.log("Test user created with user_id:", result.rows[0].user_id);
  } catch (err) {
    console.error("Error creating test user:", err);
  } finally {
    pool.end(); // close DB connection
  }
};

insertTestUser();


//for deleting later: DELETE FROM users WHERE email = 'testuser@example.com';