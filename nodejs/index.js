const express = require("express");
const sql = require("msnodesqlv8");
const session = require("express-session");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Add session middleware
app.use(session({
  secret: "d91a0a04e7e56d47b13335b72565e9d1a89ce2d36faa4094292137ce5ae7ee58",
  resave: false,
  saveUninitialized: true
}));

const connectionString =
  "Driver={SQL Server};Server=103.190.54.22\\SQLEXPRESS,1633;Database=hrms_app;Uid=ecohrms;Pwd=EcoHrms@123;";

  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/login.html");
  });
  
  app.post("/login", (req, res) => {
    const { userid, password } = req.body;
  
    // Implement your authentication logic here
    // For example, you can query the database to check if the user exists and the password is correct
    const query = `SELECT * FROM ecohrms.data WHERE userid='${userid}'`;
    sql.query(connectionString, query, (err, rows) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred");
      } else if (rows.length > 0) {
        const user = rows[0];
        if (user.disabled) {
          res.status(401).send("Your account is disabled");
        } else if (user.inactive) {
          res.status(401).send("Your account is inactive");
        } else if (user.isactive) {
          if (user.password === password) {
            // Set the session variables
            req.session.isLoggedIn = true;
            req.session.userid = userid;
            res.send("Login successful");
          } else {
            res.status(401).send("Invalid password");
          }
        } else {
          res.status(401).send("Invalid username or password");
        }
      } else {
        res.status(401).send("Invalid username or password");
      }
    });
  });

//get all data
app.get("/data", (req, res) => {
  const query = "SELECT * FROM ecohrms.data";
  sql.query(connectionString, query, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else {
      res.send(rows);
    }
  });
});
//get specific user 
app.get("/Emp/:userid", (req, res) => {
  const userid = req.params.userid;

  const query = `SELECT * FROM ecohrms.data WHERE userid='${userid}'`;
  sql.query(connectionString, query, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else if (rows.length > 0) {
      res.send(rows[0]);
    } else {
      res.status(404).send("No matching user found");
    }
  });
});
//from userid he/she from which city
app.get("/Emp/:userid/city", (req, res) => {
  const userid = req.params.userid;

  const query = `SELECT city FROM ecohrms.data WHERE userid='${userid}'`;
  sql.query(connectionString, query, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else if (rows.length > 0) {
      res.send(rows[0].city);
    } else {
      res.status(404).send("No matching user found");
    }
  });
});


//retrieves the desired column from the table

app.get("/Emp/column/:columnName", (req, res) => {
  const columnName = req.params.columnName;

  const query = `SELECT ${columnName} FROM ecohrms.data`;
  sql.query(connectionString, query, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else if (rows.length > 0) {
      const columnData = rows.map(row => row[columnName]);
      res.send(columnData);
    } else {
      res.status(404).send("No data found");
    }
  });
});

//the user IDs but also all data for users based on the city

app.get("/Emp/city/:city", (req, res) => {
  const city = req.params.city;

  const query = `SELECT * FROM ecohrms.data WHERE city='${city}'`;
  sql.query(connectionString, query, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else if (rows.length > 0) {
      res.send(rows);
    } else {
      res.status(404).send("No matching users found");
    }
  });
});


//Check if userid already exists
app.post("/Emp", (req, res) => {
  const { userid, email, password, city } = req.body;
  const checkQuery = `SELECT * FROM ecohrms.data WHERE userid='${userid}'`;
  sql.query(connectionString, checkQuery, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else if (rows.length > 0) {
      res.status(409).send("User already exists");
    } else {
      // Insert the new user
      const query = `INSERT INTO ecohrms.data (userid, email, password, city) VALUES ('${userid}', '${email}', '${password}', '${city}')`;
  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else {
      res.send("Data inserted successfully");
    }
  });
    }
  });
});
// Update data
app.put("/Emp/:userid", (req, res) => {
  const userid = req.params.userid;
  const { email, password, city, isactive} = req.body;

  console.log("Received update request for userid:", userid);
  console.log("Updated email:", email);
  console.log("Updated password:", password);
  console.log("Updated city:", city);
  console.log("Udated isactive:",isactive);

  // Construct the update query dynamically based on the provided fields
  let updateQuery = "UPDATE ecohrms.data SET ";
  const updateParams = [];

  if (email) {
    updateQuery += "email=?, ";
    updateParams.push(email);
  }
  if (password) {
    updateQuery += "password=?, ";
    updateParams.push(password);
  }
  if (city) {
    updateQuery += "city=?, ";
    updateParams.push(city);
  }
  if(typeof isactive!== "undefined"){
    updateQuery += `isactive='${isactive}', `;
  }
  

  // Remove the trailing comma and space from the query
  updateQuery = updateQuery.slice(0, -2);

  // Add the WHERE clause to update only the specific user
  updateQuery += " WHERE userid='"+userid+"'";

  console.log("Update query:", updateQuery);

  sql.query(connectionString, updateQuery, updateParams, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else {
      console.log("Update successful");
      res.send("Data updated successfully");
    } 
  });
});

//delete data
app.delete("/Emp/:userid", (req, res) => {
  const userid = req.params.userid;

  console.log("Received delete request for userid:", userid);

  const query = `DELETE FROM ecohrms.data WHERE userid='${userid}'`;
  console.log("Delete query:", query);

  sql.query(connectionString, query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("An error occurred");
    } else if (result.rowsAffected > 0) {
      console.log("Delete successful");
      res.send("Data deleted successfully");
    } else {
      console.log("No matching user found");
      res.status(404).send("No matching user found");
    }
  });
});

app.listen(3009, () => {
  console.log("Server listening on port 3009");
});