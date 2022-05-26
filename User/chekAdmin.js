const checkAdmin = async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const user = await usersCollection.findOne(filter);
  const isAdmin = user?.admin;
  res.send({ isAdmin });
};

module.exports = checkAdmin;