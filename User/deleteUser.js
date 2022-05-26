const deleteUser = async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const result = await usersCollection.deleteOne(filter);
  res.send(result);
};
module.exports = deleteUser;