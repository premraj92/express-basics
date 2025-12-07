const { people } = require("../data");

const getPeople = (req, res) => {
  res.status(200).json({ success: true, people });
};

const createPerson = (req, res) => {
  console.log(`Post request body - JSON`, req.body);
  const { name } = req.body;
  if (name) {
    res.status(201).json({ success: true, person: name });
    return;
  }

  res.status(400).json({ success: false, msg: "Please provide user name" });
};

const createPersonPostman = (req, res) => {
  console.log(`req body JSON `, req.body);
  const { name } = req.body;

  if (name) {
    return res.status(201).json({
      success: true,
      data: [...people, { name, id: people.length + 1 }],
    });
  }

  res.status(400).json({ success: false, data: "Please provide a valid name" });
};

const updatePerson = (req, res) => {
  const { personId } = req.params;
  const name = req.body?.name;
  console.log(
    `personId of record to be updated `,
    personId,
    ` ANd his new name is `,
    name
  );

  const doesPersonExist = people.find(
    (person) => person.id === Number(personId)
  );

  if (!personId || !name) {
    return res.status(400).json({
      success: false,
      msg: "Please provide the id of the resource to be updated && their new name",
    });
  }

  if (!doesPersonExist) {
    return res.status(404).json({
      success: false,
      msg: `No resource with the Id ${personId} found`,
    });
  }

  const updatedPeopleList = people.map((person) =>
    person.id === Number(personId) ? { ...person, name } : person
  );
  res.status(200).json({ success: true, data: updatedPeopleList });
};

const deletePerson = (req, res) => {
  const { personId } = req.params;
  console.log(`personId of record to be deleted `, personId);

  const doesPersonExist = people.find(
    (person) => person.id === Number(personId)
  );

  if (!personId) {
    return res.status(400).json({
      success: false,
      msg: "Please provide the id of the resource to be deleted",
    });
  }

  if (!doesPersonExist) {
    return res.status(404).json({
      success: false,
      msg: `No resource with the Id ${personId} found`,
    });
  }

  const updatedPeopleList = people.filter(
    (person) => person.id !== Number(personId)
  );

  res.status(200).json({ success: true, data: updatedPeopleList });
};

module.exports = {
  getPeople,
  createPerson,
  createPersonPostman,
  updatePerson,
  deletePerson,
};
