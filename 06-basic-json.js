const express = require("express");
const app = express();
const { products } = require("./data");

app.get("/", (req, res) => {
  // res.json() - method is used to serve any json compatible data like object, array, strings
  //  with the correct content-type => application/json => added automatically
  
  
  // // First basic JSON example
  // res.status(200).json([
  //   { name: "Sathish Raj", id: 11 },
  //   { name: "Dhivya Ramakrishnan", id: 12 },
  // ]);

  // // Second - more meaningful json data (products)
  res.status(200).json(products)
});

app.all("/{*any}", (req, res) => {
  res
    .status(404)
    .send(
      `"<h1 style='font-family: cursive; font-size: 28px; color: red'>Resource not found</h1>"`
    );
});

app.listen(5000, () => {
  console.log(`Have started listening at port 5000`);
});
