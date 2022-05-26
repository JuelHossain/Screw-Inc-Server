const getUser = async (req, res) => {
  const userEmail = req.params.email;
  const query = { email: userEmail };
  const users = await usersCollection.findOne(query);
  res.send(user);
};

module.exports =  getUser;