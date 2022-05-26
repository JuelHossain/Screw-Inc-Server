const jwt = require("jsonwebtoken");

const createUser = async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const options = { upsert: true };
  const user = req.body;
  updatedUser = {
    $set: user,
  };
  const result = await usersCollection.updateOne(filter, updatedUser, options);
  const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  res.send({ token, result });
};

module.exports = createUser;
