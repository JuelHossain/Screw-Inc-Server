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
    const users = client.db('Screw').collection('users');
    //auth
    app.post('/login', async (req, res) => {
      const user = req.body;
      const result = await users.insertOne(user);
      console.log(user.displayName, 'Added Successfully to the user list');
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      res.send({ accessToken,result });
    })
    
  } finally {
    console.log("Everything is fine.");
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
