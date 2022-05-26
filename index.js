require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const verify = require("jsonwebtoken/verify");
const pay = require("./payment");
const SSLCommerzPayment = require("sslcommerz").SslCommerzPayment;

app.use(cors());
app.use(express.json());

// verifying jwt token
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "forbidden" });
    }
    req.decoded = decoded;
    next();
  });
};
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
    console.log("Mongo Connected");
    const usersCollection = client.db("Screw").collection("users");
    const productsCollection = client.db("Screw").collection("products");
    const ordersCollection = client.db("Screw").collection("orders");
    //auth
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
    // giving user a access token when login
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const user = req.body;
      updatedUser = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedUser,
        options
      );
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token, result });
    });

    //make admin only admin can do that
    app.put("/users/admin/:email", verifyJwt, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const value = req.body;
      updatedUser = {
        $set: value,
      };
      const result = await usersCollection.updateOne(filter, updatedUser);
      res.send(result);
    });
    // check admin
    app.get("/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);
      const isAdmin = user?.admin;
      res.send({ isAdmin });
    });
    //get all users (only admin can get user information)
    app.get("/users", verifyJwt, verifyAdmin, async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    // get a single user by email only admin can do that
    app.get("/users/:email", verifyJwt, verifyAdmin, async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const users = await usersCollection.findOne(query);
      res.send(user);
    });
    //delete user only admin can do that
    app.delete("/users/:email", verifyJwt, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    //posting product
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
      console.log(product.name, "posted");
    });
    // counting products
    app.get("/productCounts", async (req, res) => {
      const count = await productsCollection.countDocuments();
      res.send({ count });
      console.log('total products :', count);
    });

    // getting all products
    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = productsCollection.find(query);
      let products;
      if (page || size) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }
      res.send(products);
      console.log(products.length, 'sent successfully');
    });

    // getting one product with id
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
      console.log(result.name, 'sent');
    });

    // updating products by id
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const newProduct = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: newProduct,
      };
      const result = await productsCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
      console.log(productsCollection.name,'updated')
    });
    //deleting single product from data base
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
      console.log(productsCollection.name, "deleted");
    });
     app.post("/orders", async (req, res) => {
       const order = req.body;
       const result = await ordersCollection.insertOne(order);
       res.send(result);
       console.log(order.product_name, "posted");
     });
    app.get('/payment/:id', verifyJwt, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.findOne(query);
      console.log(result);
     const sslcommer =await  new SSLCommerzPayment(
       process.env.SSL_STORE_ID,
       process.env.SSL_PASS,
       false
     ); //true for live default false for sandbox
      await sslcommer.init(result).then((data) => {
        console.log(data);
      //  process the response that got from sslcommerz
       https://developer.sslcommerz.com/doc/v4/#returned-parameters
       if (data?.GatewayPageURL) {
         return res.status(200).redirect(data?.GatewayPageURL);
       } else {
         return res
           .status(400)
           .json({ message: "ssl session was not successful" });
       }
     });
      console.log("order details sent of", result.product_name);
    });

    app.get(`/payment/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const data = ordersCollection.findOne(query);
      console.log(data);
      res.send(data);
      const sslcommer = new SSLCommerzPayment(
        process.env.SSL_STORE_ID,
        process.env.SSL_PASS,
        false
      ); //true for live default false for sandbox
      sslcommer.init(data).then((data) => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#returned-parameters
        if (data?.GatewayPageURL) {
          return res.status(200).redirect(data?.GatewayPageURL);
        } else {
          return res
            .status(400)
            .json({ message: "ssl session was not successful" });
        }
      });
    });
  } finally {
    console.log("!");
  }
};
run().catch(console.dir);

// running the server
//-------------------------------------
app.get("/", verifyJwt, (req, res) => {
  res.send(" Server is running");
});

app.listen(port, () => {
  console.log("server is running on", port);
});
