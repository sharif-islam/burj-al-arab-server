const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const port = 7000;
const { MongoClient } = require("mongodb");
const app = express();
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwvev.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

var admin = require("firebase-admin");

var serviceAccount = require("./configs/bruj-al-arab-demo-firebase-adminsdk-obnae-3ad3fc7995.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client.db("burjAlArab").collection("bookings");
  console.log("db connection successfully");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking).then((result) => {
      res.send(result.acknowledged);
    });
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];

      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          if (tokenEmail == req.query.email) {
            collection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          } else {
            res.status(401).send("un-authorized access");
          }
          // ...
        })
        .catch((error) => {
          res.status(401).send("un-authorized access");
        });
    } else {
      res.status(401).send("un-authorized access");
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
