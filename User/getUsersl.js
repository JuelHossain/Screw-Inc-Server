const getUsers = async (req, res) => {
  const query = {};
  const users = await usersCollection.find(query).toArray();
  res.send(users);
};
module.exports = getUsers;