require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const verify = require("jsonwebtoken/verify");
const pay = require("./payment");
const query = require("express/lib/middleware/query");
const SSLCommerzPayment = require("sslcommerz").SslCommerzPayment;

app.use(cors());
app.use(express.json());
app.enable("trust proxy");
//
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
const client = new MongoClient(process.env.MONGODB_URI, {
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
    const paymentsCollection = client.db("Screw").collection("payments");
    const reviewCollection = client.db("Screw").collection("review");
    const ipnCollection = client.db("Screw").collection("ipn");
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
      const token = await jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
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
    app.get("/users/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const users = await usersCollection.findOne(query);
      res.send(users);
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
      console.log("total products :", count);
    });

    // getting all products
    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = await productsCollection.find(query);
      let products;
      if (page && size) {
        products = await cursor
          .sort({ _id: -1 })
          .skip(page > 1 ? (page - 1) * size : 0)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }
      res.send(products);
      console.log(products.length, "sent successfully");
    });

    // getting one product with id
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
      console.log(result.name, "sent");
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
      const result = await productsCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
      console.log(productsCollection.name, "updated");
    });
    //deleting single product from data base
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
      console.log(productsCollection.name, "deleted");
    });
    //posting orders
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
      console.log(order.product_name, "posted");
    });
    //getting all orders
    app.get("/orders", async (req, res) => {
      const query = {};
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
      console.log("all orders sent");
    });
    // getting single orders by id
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.findOne(query);
      res.send(result);
    });
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      result = await ordersCollection.deleteOne(query);
      res.send(result);
    });
    // updating orders paid or not
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: payment,
      };
      const result = await ordersCollection.updateOne(query, updatedDoc, {
        upsert: true,
      });
      res.send(result);
      console.log(payment, "paid");
    });
    // getting user order by email
    app.get("/myOrders", async (req, res) => {
      const email = req.query.email;
      const filter = { userEmail: email };
      const result = await ordersCollection.find(filter).toArray();
      res.send(result);
    });
    //posting reviews
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    // getting all recent reviews
    app.get("/reviews", async (req, res) => {
      const size = parseInt(req.query.size);
      let result;
      if (size) {
        result = await reviewCollection
          .find({})
          .sort({ _id: -1 })
          .limit(size)
          .toArray();
      } else {
        result = await reviewCollection.find({}).sort({ _id: -1 }).toArray();
      }
      res.send(result);
    });
    //getting review by id
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });
    // getting my reviews by email
    app.get("/myreviews", async (req, res) => {
      const email = req.query.email;
      const filter = { userEmail: email };
      const result = await reviewCollection.find(filter).toArray();
      res.send(result);
    });
    //updating reviews
    app.put("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const newReview = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: newReview,
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
      console.log(reviewCollection.userName, "review updated");
    });
    // deleting reviews
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
      console.log(reviewCollection.userName, "review deleted");
    });
    // app.post('/payments', async (req, res) => {
    //   const payment = req.body;
    //   const result = await paymentsCollection.insertOne(payment);
    //   res.send(result);
    //   console.log('payment', 'posted');
    // });
    // app.put("/payments/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const status = req.body
    //   const filter = { _id: ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedDoc = {
    //     $set: status,
    //   };
    //   const result = await paymentsCollection.updateOne(
    //     filter,
    //     updatedDoc,
    //     options
    //   );
    //   res.send(result);
    //   console.log(status.transactionId, "paid");
    // })
    // app.get("/payments/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const paymentData = await paymentsCollection.findOne(query);
    //   const sslcommer = new SSLCommerzPayment(
    //     process.env.SSL_STORE_ID,
    //     process.env.SSL_PASS,
    //     false
    //    ); //true for live default false for sandbox
    //   sslcommer.init(paymentData).then((data) => {
    //     console.log('212', data);
    //      if (data.status==='SUCCESS') {
    //        console.log(data.GatewayPageURL);
    //        res.status(200).redirect(data.GatewayPageURL);
    //     }
    //    });
    // });
    // app.post('/ipn', async (req, res) => {
    //   console.log(req);
    //   result = await ipnCollection.insertOne(req.body);
    //   res.send(req.body);
    // })
    // // app.get('/validate', async (req, res) => {
    // //   const data = res.headers.sessionkey;
    // //   console.log(data);
    // // })
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
