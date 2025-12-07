const express = require("express");
const router = express.Router();

const {
  getPeople,
  createPerson,
  createPersonPostman,
  updatePerson,
  deletePerson,
} = require("../controllers/people");


// SETTING UP ROUTES has two ways/flavors


// // 1. ROUTE setup FLAVOR ONE

// // Get the people list
// router.get("/", getPeople);

// // Save new people list
// router.post("/", createPerson);

// // sample dummy post route setup - to test postman
// router.post("/postman", createPersonPostman);

// // put method to update existing data
// router.put("/:personId", updatePerson);

// // delete method to deleting a particular existing data
// router.delete("/:personId", deletePerson);


// 2. ROUTE setup FLAVOR TWO => basically chain methods - with same route

router.route('/').get(getPeople).post(createPerson)
router.route('/postman').post(createPersonPostman)
router.route('/:personId').put(updatePerson).delete(deletePerson)


module.exports = router;
