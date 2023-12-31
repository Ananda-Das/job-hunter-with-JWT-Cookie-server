const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://job-hunter-188ab.web.app", "https://job-hunter-188ab.firebaseapp.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//verify Token
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "forbidden" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    //error
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    //
    console.log("object", decoded);
    req.user = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    // await client.connect();

    //Jobs Collections Name
    const JobCategoryCollection = client.db("JobHunterDB").collection("JobCategory");
    const JobsInfoCollection = client.db("JobHunterDB").collection("JobsInfo");
    const ApplyJobCollection = client.db("JobHunterDB").collection("ApplyJobs");

    //auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1h" });

      res
        .cookie("token", token, {
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

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
      const result = await JobsInfoCollection.insertOne(jobInfo);
      res.send(result);
    });

    //get specifice job info
    app.get("/api/v1/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await JobsInfoCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.send({ message: error.message });
      }
    });

    //get specifice a user posted job
    app.get("/api/v1/my/jobs", verifyToken, async (req, res) => {
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: "Forbiden Access" });
      }
      let query = {};
      if (req.query?.userEmail) {
        query = { userEmail: req.query.userEmail };
      }
      const result = await JobsInfoCollection.find(query).toArray();
      res.send(result);
    });

    //update a job
    app.put("/api/v1/job/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedjob = req.body;
      console.log(updatedjob);
      const job = {
        $set: {
          comName: updatedjob.comName,
          comimg: updatedjob.comimg,
          bannerUrl: updatedjob.bannerUrl,
          title: updatedjob.title,
          category: updatedjob.category,
          salary: updatedjob.salary,
          deadline: updatedjob.deadline,
          description: updatedjob.description,
        },
      };

      const result = await JobsInfoCollection.updateOne(filter, job, options);
      res.send(result);
    });

    //for delete a job
    app.delete("/api/v1/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await JobsInfoCollection.deleteOne(query);
      res.send(result);
    });

    //get specifice a user applied job
    app.get("/api/v1/my/applied/jobs", verifyToken, async (req, res) => {
      // console.log("to sdff", req.cookies.token);
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: "Forbiden Access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await ApplyJobCollection.find(query).toArray();
      res.send(result);
    });

    //Apply for job
    app.post("/api/v1/apply/jobs/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const ApplyJobInfo = req.body;
      const applicantNo = {
        $inc: { jobApplicant: 1 },
      };
      const jobApplicationInfo = await JobsInfoCollection.updateOne(filter, applicantNo);
      const result = await ApplyJobCollection.insertOne(ApplyJobInfo);
      console.log(jobApplicationInfo);
      console.log(result);
      res.send({ result, jobApplicationInfo });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
