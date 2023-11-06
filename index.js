const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qfsxze0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //Jobs Collections Name
    const JobCategoryCollection = client.db("JobHunterDB").collection("JobCategory");
    const JobsInfoCollection = client.db("JobHunterDB").collection("JobsInfo");

    //Get Job Category Info
    app.get("/api/v1/jobsCategory", async (req, res) => {
      const cursor = JobCategoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //get all job info
    app.get("/api/v1/all/jobs", async (req, res) => {
      const cursor = JobsInfoCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //Add job Info
    app.post("/api/v1/add/jobs", async (req, res) => {
      const jobInfo = req.body;
      // console.log(jobsInfo);
      const result = await JobsInfoCollection.insertOne(jobInfo);
      res.send(result);
    });

    //get specifice a user posted job
    app.get("/api/v1/my/jobs", async (req, res) => {
      let query = {};
      if (req.query?.userEmail) {
        query = { userEmail: req.query.userEmail };
      }
      const result = await JobsInfoCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job Hunter is Running!");
});

app.listen(port, () => {
  console.log(`Job Hunter listening on port ${port}`);
});
