const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log(`Post request body - FORM-ENCODED`, req.body);
  const { name } = req.body;
  if (name) {
    res
      .status(200)
      .send(
        `<h1 style="font-family: cursive;"> Welcome dear <span style="color: green">${name}</span></h1>`
      );
    return;
  }

  res
    .status(400)
    .send(
      `<h1 style="font-family: cursive; color: red">Please provide valid user info</h1>`
    );
});

module.exports = router;
