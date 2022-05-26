const makeAdmin = async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const value = req.body;
  updatedUser = {
    $set: value,
  };
  const result = await usersCollection.updateOne(filter, updatedUser);
  res.send(result);
};

module.exports = makeAdmin;