const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 9000;
const app = express();

// middle wares

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// connect server to the database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mdcv625.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verfyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized!" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    req.user = decoded;
    next();
  });
};
async function run() {
  try {
    await client.connect();
    const serviceDb = client.db("serviceDb");
    const orderDb = client.db("orderDb");
    const serviceCollection = serviceDb.collection("serviceCollection");
    const orderCollection = orderDb.collection("orderCollection");

    // auth api
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: false,
        })
        .send({ success: true });
    });
    // services get all
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find({});

      const result = await cursor.toArray();
      res.send(result);
    });

    // services get single
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // orders
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders", verfyToken, async (req, res) => {
      if (req.query.email !== req.user.email) {
        return res.status(403).json("Forbidded Access!");
      }
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = { $set: { status: req.body.status } };
      const result = await orderCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.delete("/orders/:id", async (req, res) => {
      const result = await orderCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Doctor is runnign now!");
});

app.listen(port, () => {
  console.log(`Doctor Server is runnig at port: ${port}`);
});
