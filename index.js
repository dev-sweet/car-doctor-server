const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 9000;
const app = express();

// middle wares

app.use(cors());
app.use(express.json());

// connect server to the database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mdcv625.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const serviceDb = client.db("serviceDb");
    const orderDb = client.db("orderDb");
    const serviceCollection = serviceDb.collection("serviceCollection");
    const orderCollection = serviceDb.collection("orderCollection");

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

    // post an order
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
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
