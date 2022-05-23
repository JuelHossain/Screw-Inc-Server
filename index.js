require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const verify = require("jsonwebtoken/verify");
app.use(cors());
app.use(express.json());

// verifying jwt token 
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({message:'forbidden'});
    }
    req.decoded = decoded;
    next();
  })
}
// connecting database
//-------------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@screw.vixmv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// insert data to database
//------------------------
const run = async () => {
  try {
    await client.connect();
    console.log('Mongo Connected');
    const usersCollection = client.db('Screw').collection('users');
    //auth
    // giving user a access token when login
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const user = req.body;
      updatedUser = {
        $set: user,
      };
      const result = await usersCollection.updateOne(filter, updatedUser, options);
      const token = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token, result });
      console.log(user.displayName,'posted')
    });

    app.get('/users', verifyJwt, async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
      console.log(users.length, 'user sent');
    })
    
  } finally {
    console.log("!");
  }
};
run().catch(console.dir);

// running the server
//-------------------------------------
app.get("/",verifyJwt, (req, res) => {
  res.send(" Server is running");
});

app.listen(port, () => {
  console.log("server is running on", port);
});
