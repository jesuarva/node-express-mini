const express = require("express");
const cors = require("cors");

const db = require("./data/db");

const port = 5555;
const server = express();

server.use(express.json());
server.use(cors());

/**
 * First argument: route to where a resource can be interacted with => the URL
 * Second argument: Callback to dela with the request
 * req: HTP request
 * res: response
 */
server.get("/api/users", (req, res) => {
  /**
   * from: https://stackoverflow.com/questions/35198208/handling-cancelled-request-with-express-node-js-and-angular?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
   */
  req.on("close", err => {
    res.send("Request cancelled");
  });

  /**
   * GET: users-form-db.then(send to client)
   */
  db
    .find()
    .then(response => {
      response && Array.isArray(response)
        ? res.json(response)
        : res
            .status(500)
            .json({ error: "The users information could not be retrieved." });
    })
    .catch(e => {
      console.log("error", e);
      res.json(error.message);
    });
});

server.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  db
    .findById(id)
    .then(response => {
      console.log("response.data", response);
      response.length === 0
        ? res
            .status(404)
            .json({ message: "The user with the specified ID does not exist." })
        : res.json(response);
    })
    .catch(e => {
      console.log("error", e);
      res
        .status(500)
        .json({ error: "The user information could not be retrieved." });
    });
});

server.post("/api/users", (req, res) => {
  const { name, bio } = req.body;
  console.log(name, bio);

  (!name || !bio) &&
    res
      .status(404)
      .json({ errorMessage: "Please provide name and bio for the user." });

  db
    .insert({ name, bio })
    .then(response => {
      // retrieve new id
      return response.id;
    })
    .then(id => {
      // Get new user => return ths Promise that generates "db.findById".
      return db.findById(id);
    })
    .then(newUser => {
      console.log("response", newUser);
      res.status(201).json(newUser);
    })
    .catch(e => {
      console.log("error", e);
      res.status(500).json({
        error: "There was an error while saving the user to the database"
      });
    });
});

server.delete("/api/users/:id", (req, res) => {
  console.log(req.params);
  const { id } = req.params;
  db
    .findById(id)
    .then(response => {
      console.log("response", response);

      // If there are no match in the DataBase --> then:
      !response.length &&
        res
          .status(404)
          .json({ message: "The user with the specified ID does not exist." });

      // Remove fro the Data Base and return the promise generate by 'db.remove()'
      return db.remove(id);
    })
    .then(response => {
      console.log("response", response);
      res.status(200).json({ message: "User deleted" });

      /**
       * SIMULATE: an error with db.delete(...) method.
       */
      // return Promise.reject("");
    })
    .catch(e => {
      console.log("error", e);
      res.status(500).json({ error: "The user could not be removed" });
    });
});

server.put("/api/users/:id", (req, res) => {
  console.log(req.params);
  const { id } = req.params;
  const { name, bio } = req.body;
  let updated;

  // If the 'name' or 'bio' are missing
  (!name || !bio) &&
    res
      .status(400)
      .json({ errorMessage: "Please provide name and bio for the user." });

  /**
   * ID no found: catch.
   *
   * ID found: update user!
   */
  db
    .findById(id)
    .then(response => {
      // Id not found
      if (!response.length) {
        return Promise.reject("Id no found");
      }

      // Id found -> then:
      return (
        db
          .update(id, { name, bio })
          .then(response => {
            console.log("response", response);
            /**
             * Response could be either 0 or 1
             */
            if (!response) {
              //  response is === 0
              return new Promise.reject("Something went wrong");
            } else {
              // response === 1
              db
                // fetch the user updated
                .findById(id)
                .then(user => (updated = user))
                // SEND response with updated-user
                .then(_ => res.status(200).json(updated));
            }
          })
          // Id something went worng updating the user
          .catch(e => {
            console.log("error", e);
            res
              .status(500)
              .json({ error: "The user information could not be modified." });
          })
      );
    })
    .catch(e => {
      console.log("error", e);
      res
        .status(404)
        .json({ message: "The user with the specified ID does not exist." });
    });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
console.log(__filename);
