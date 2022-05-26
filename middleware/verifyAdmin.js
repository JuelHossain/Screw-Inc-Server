const {usersCollection} = '../mongodb/collections.js'
// verify admin
const verifyAdmin = async (req, res, next) => {
  const userEmail = req.decoded.email;
  const user = await usersCollection.findOne({ email: userEmail });
  if (user?.admin) {
    next();
  } else {
    res.status(403).send({ message: "forbidden" });
  }
};
module.exports = verifyAdmin;