const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { addAchievement } = require("./Achievements");

app.use(express.json());
app.use(express.static("public"));

//e.g using for registration
app.post("/register", async (req, res) => {
  let existing =
    (await client.db("Assignment").collection("players").findOne({
      name: req.body.username,
    })) ||
    (await client.db("Assignment").collection("players").findOne({
      email: req.body.email,
    }));

  if (existing) {
    res.status(400).send("username or email already exist");
  } else {
    const hash = bcrypt.hashSync(req.body.password, 10);
    let count = await client
      .db("Assignment")
      .collection("players")
      .countDocuments();
    let countNum = await client
      .db("Assignment")
      .collection("characters_of_players")
      .countDocuments();
    let resq = await client
      .db("Assignment")
      .collection("players")
      .insertOne({
        name: req.body.name,
        player_id: count,
        password: hash,
        email: req.body.email,
        gender: req.body.gender,
        //I set them as default ya
        collection: {
          characterList: ["Lillia"],
          character_selected: { name: "Lillia", charId: countNum },
          charId: [countNum],
        },
        money: 0,
        points: 0,
        achievments: ["A beginner player"],
        friends: { friendList: [], sentRequests: [], needAcceptRequests: [] },
        //can do relationship??
        starterPackTaken: false,
      });
    let Lilla = await client
      .db("Assignment")
      .collection("characters")
      .aggregate([
        {
          $match: { name: "Lillia" },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            health: 1,
            attack: 1,
            speed: 1,
            type: 1,
          },
        },
      ])
      .toArray();
    console.log(Lilla);
    await client
      .db("Assignment")
      .collection("characters_of_players")
      .insertOne({ char_id: countNum, characters: Lilla }, { upsert: true });

    res.send({
      message:
        "Congratulation! Your account register succesfully! Log in to start your battle journey!",
      data: resq,
    });
  }
});

app.patch("/login/starterpack/:numId", async (req, res) => {
  const min = 1000;
  const max = 2000;
  const newMoneyAmount = Math.floor(Math.random() * (max - min + 1)) + min;
  let user = await client
    .db("Assignment")
    .collection("players")
    .findOneAndUpdate(
      {
        $and: [
          {
            player_id: parseInt(req.params.numId),
          },
          { starterPackTaken: { $eq: false } },
        ],
      },
      { $set: { starterPackTaken: true, money: newMoneyAmount } },
      { returnOriginal: false }
    );
  if (user === null) {
    res.status(400).send("Starter pack already taken");
  } else {
    res.send(
      `Total amount of RM ${newMoneyAmount} is given to player id ${req.params.numId} `
    );
  }
});

//in funtion of adding chest
app.post("/chest", async (req, res) => {
  let existing = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest_name,
  });
  if (existing) {
    res.status(400).send("Chest already exist");
  } else {
    let chest = await client.db("Assignment").collection("chests").insertOne({
      chest: req.body.chest_name,
    });
    res.send(chest);
  }
});
//in function of adding character
app.post("/character", async (req, res) => {
  let existing = await client
    .db("Assignment")
    .collection("characters")
    .findOne({
      name: req.body.character_name,
    });
  if (existing) {
    res.status(400).send("Character already exist");
  } else {
    let character = await client
      .db("Assignment")
      .collection("characters")
      .insertOne({
        name: req.body.character_name,
        health: req.body.health,
        attack: req.body.attack,
        type: req.body.type,
      });
    res.send(character);
  }
});

app.get("/login", async (req, res) => {
  let resp = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      name:
        req.body.name ||
        (await client.db("Assignment").collection("players").findOne({
          email: req.body.email,
        })),
    });
  if (!resp) {
    res.send("User not found");
  } else {
    // Check if password is provided
    if (resp.password) {
      if (bcrypt.compareSync(req.body.password, resp.password)) {
        res.send("Login successful. Remember to gain your starter pack!");
      } else {
        res.send("Wrong Password");
      }
    } else {
      res.send("Password not provided");
    }
  }
});

//get read user profile******
app.get("/read/:player_id", async (req, res) => {
  let document = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      {
        $match: { player_id: parseInt(req.params.player_id) },
      },
      {
        $project: {
          _id: 0,
          player_id: 1,
          name: 1,
          gender: 1,
          "collection.characterList": 1,
          points: 1,
          "friends.friendList": 1,
          achievments: 1,
        },
      },
      {
        $lookup: {
          from: "players",
          localField: "friends.friendList",
          foreignField: "player_id",
          as: "aa",
        },
      },
      //add project
      {
        $lookup: {
          from: "chest",
          localField: "collection",
          foreignField: "chests",
          as: "collection",
        },
      },
      {
        $lookup: {
          from: "characters",
          localField: "collection",
          foreignField: "name",
          as: "characterInfo",
        },
      },
    ])
    .toArray();
  res.send(document);
});

//need Developer token
app.patch("/add_character_to_chest", async (req, res) => {
  let result2 = await client
    .db("Assignment")
    .collection("chests")
    .findOne({ chest: req.body.chest });
  if (!result2) {
    return res.status(404).send("Chest not found");
  }
  if (result2.characters.includes(req.body.character_name)) {
    return res.status(400).send("Character already exist in the chest");
  }

  const result = await client
    .db("Assignment")
    .collection("chests")
    .updateOne(
      { chest: req.body.chest },
      { $addToSet: { characters: req.body.character_name } }
    );
  res.send("Character added successfully");
});

//need Developer token
app.patch("/characterupdate/:charactername", async (req, res) => {
  let existing = await client
    .db("Assignment")
    .collection("characters")
    .findOne({
      name: req.params.charactername,
    });
  if (!existing) {
    res.status(400).send("Character does not exist");
  } else {
    let character = await client
      .db("Assignment")
      .collection("characters")
      .updateOne(
        {
          name: req.params.charactername,
        },
        {
          $set: {
            health: req.body.health,
            attack: req.body.attack,
            speed: req.body.speed,
            type: req.body.type,
          },
        }
      );
    res.send(character);
  }
});

// To send a friend request
app.post("/send_friend_request/:requesterId/:requestedId", async (req, res) => {
  // Check if requesterId and requestedId are different
  if (parseInt(req.params.requesterId) === parseInt(req.params.requestedId)) {
    return res.status(400).send("You cannot send a friend request to yourself");
  }
  // Check if both players exist
  const requester = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.requesterId) });

  const requested = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.requestedId) });

  if (!requester || !requested) {
    return res.status(404).send("Either players not found");
  }
  if (requester.friends.friendList.includes(requested.player_id)) {
    return res.status(404).send("The player is already in your friend list");
  }
  // Check if friend request has already been sent
  if (
    requester &&
    requester.friends &&
    requester.friends.sentRequests &&
    requester.friends.sentRequests.indexOf(parseInt(req.params.requestedId)) !==
      -1
  ) {
    return res.status(400).send("Friend request already sent");
  }
  // Send the friend request
  const sent = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.requesterId) },
      { $push: { "friends.sentRequests": parseInt(req.params.requestedId) } }
    );
  const sent2 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.requestedId) },
      {
        $push: {
          "friends.needAcceptRequests": parseInt(req.params.requesterId),
        },
      }
    );
  if (sent.modifiedCount === 0 && sent2.modifiedCount === 0) {
    res.status(400).send("Failed to send friend request");
  } else {
    res.send("Friend request sent");
  }
});

// To  accept a friend request
app.patch(
  "/accept_friend_request/:requestedId/:requesterId",
  async (req, res) => {
    // Check if requesterId and requestedId are different
    if (parseInt(req.params.requesterId) === parseInt(req.params.requestedId)) {
      return res
        .status(400)
        .send("You cannot accept a friend request from yourself");
    }
    // Check if both players exist
    const requester = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.params.requesterId) });

    const requested = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.params.requestedId) });

    if (!requester || !requested) {
      return res.status(404).send("Either players not found");
    }
    // Move the friend request from needAcceptRequests to friends
    const accept = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        {
          player_id: parseInt(req.params.requestedId),
          "friends.needAcceptRequests": parseInt(req.params.requesterId),
        },
        {
          $pull: {
            "friends.needAcceptRequests": parseInt(req.params.requesterId),
          },
          $push: { "friends.friendList": parseInt(req.params.requesterId) },
        }
      );
    console.log(accept);
    const accept2 = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        {
          player_id: parseInt(req.params.requesterId),
          "friends.sentRequests": parseInt(req.params.requestedId),
        },
        {
          $pull: { "friends.sentRequests": parseInt(req.params.requestedId) },
          $push: { "friends.friendList": parseInt(req.params.requestedId) },
        }
      );
    console.log(accept2);
    if (accept.modifiedCount === 0 && accept2.modifiedCount === 0) {
      res.status(400).send("Failed to accept friend request");
    } else {
      res.send("Friend request accepted");
      if (player.friends.friendList.length > 5) {
        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            { player_id: parseInt(req.params.requestedId) },
            { $addToSet: { achievements: "Makes more friends" } }
          );
      }
    }
  }
);

app.patch("/remove_friend/:requesterId/:friendId", async (req, res) => {
  // Check if requesterId and friendId are different
  if (parseInt(req.params.requesterId) === parseInt(req.params.friendId)) {
    return res.status(400).send("You cannot remove yourself");
  }
  // Check if both players exist
  const requester = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.requesterId) });

  const friend = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.friendId) });

  if (!requester || !friend) {
    return res.status(404).send("Either players not found");
  }
  // Remove the friend from the friendList of the requester
  const remove1 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.requesterId) },
      { $pull: { "friends.friendList": parseInt(req.params.friendId) } }
    );
  // Remove the requester from the friendList of the friend
  const remove2 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.friendId) },
      { $pull: { "friends.friendList": parseInt(req.params.requesterId) } }
    );
  if (remove1.modifiedCount === 0 && remove2.modifiedCount === 0) {
    res.status(400).send("Failed to remove friend");
  } else {
    res.send("Friend removed");
  }
});

app.patch("/update/:id", async (req, res) => {
  let require = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          name: req.body.username,
          email: req.body.email,
          gender: req.body.gender, //password??
          password: hash,
        },
      }
    );
  if (require.modifiedCount === 0) {
    res.status(400).send("Updated failed");
  } else {
    res.send("Profile updated successfully");
  }
});

app.delete("/delete/:id", async (req, res) => {
  let delete_req = await client
    .db("Assignment")
    .collection("users")
    .deleteOne({
      _id: new ObjectId(req.params.id),
    });
  res.send(delete_req);
  console.log(req.params);
});

app.get("/chests", async (req, res) => {
  const chests = await client
    .db("Assignment")
    .collection("chests")
    .aggregate([{ $project: { _id: 0, chest: 1, price: 1, characters: 1 } }])
    .toArray();

  res.send(chests);
});

app.patch("/buying_chest", async (req, res) => {
  let player = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: [{ name: req.body.name }, { email: req.body.email }],
    });
  let chest = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest,
  });
  // Randomly select a character from the characters array
  let character_in_chest = await client
    .db("Assignment")
    .collection("chests")
    .aggregate([
      { $match: { chest: req.body.chest } },
      { $unwind: "$characters" },
      { $sample: { size: 1 } },
      {
        $lookup: {
          from: "characters",
          localField: "characters",
          foreignField: "name",
          as: "characters",
        },
      },
    ])
    .toArray();
  console.log(player);
  console.log(character_in_chest[0]);
  console.log(character_in_chest[0].characters);
  console.log(character_in_chest[0].characters[0].name);
  console.log(chest);

  if (!player) {
    return res.status(400).send("User or email are wrong");
  }
  // Check if the player has enough money
  if (player.money < chest.price) {
    return res.send(
      "Not enough money to buy chest. Please compete more battles to earn more money"
    );
  }

  if (chest) {
    if (
      player.collection.characterList.includes(
        character_in_chest[0].characters[0].name
      )
    ) {
      let index = player.collection.characterList.indexOf(
        character_in_chest[0].characters[0].name
      );
      console.log(index);
      let your_char = await client
        .db("Assignment")
        .collection("characters_of_players")
        .findOneAndUpdate(
          {
            char_id: index,
          },
          {
            $inc: {
              "characters.$[].health": 100,
              "characters.$[].attack": 100,
              "characters.$[].speed": 0.1,
            },
          }
        );
      console.log(your_char);

      // let powerUp = await client
      //   .db("Assignment")
      //   .collection("players")
      //   .updateOne(
      //     {
      //       $and: [
      //         { name: req.body.name },
      //         { email: req.body.email },
      //         {
      //           "collection.characterList": {
      //             $elemMatch: {
      //               name: character_in_chest[0].characters[0].name,
      //             },
      //           },
      //         },
      //       ],
      //     },

      //     {
      //       $inc: {
      //         "collection.characterList.$.health": 100,
      //         "collection.characterList.$.attack": 100,
      //         "collection.characterList.$.speed": 0.1,
      //       },
      //     }
      //   );
      // console.log(powerUp);
      return res.send(
        // powerUp,
        character_in_chest[0].characters[0].name +
          ` already exist in your collection, power up instead` +
          your_char
      );
    } else {
      let buying = await client
        .db("Assignment")
        .collection("players")
        .updateOne(
          {
            player_id: player.player_id,
          },
          {
            $addToSet: {
              "collection.characterList":
                character_in_chest[0].characters[0].name,
            },
            $inc: {
              money: -chest.price,
            },
            $set: {
              upset: true,
            },
          }
        );
      console.log(buying);
      if (buying.modifiedCount === 0) {
        return res.send("Failed to buy character");
      } else {
        let countNum = await client
          .db("Assignment")
          .collection("characters_of_players")
          .countDocuments();
        let randomChar = await client
          .db("Assignment")
          .collection("characters")
          .aggregate([
            {
              $match: { name: character_in_chest[0].characters[0].name },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                health: 1,
                attack: 1,
                speed: 1,
                type: 1,
              },
            },
          ])
          .toArray();
        await client
          .db("Assignment")
          .collection("characters_of_players")
          .insertOne({ char_id: countNum, characters: randomChar });
        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            { player_id: player.player_id },
            {
              $push: {
                "collection.charId": countNum,
                // name: character_in_chest[0].characters,
              },
            },
            { upsert: true }
          );

        // Check if the player has collected 21 characters
        if (player.collection.characterList.length === 21) {
          await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { player_id: player.player_id },
              {
                $addToSet: {
                  achievements:
                    "Congraturation! You complete the characters collection",
                },
              }
            );
        }

        return res.send(
          "Chest bought successfully, you got " +
            character_in_chest[0].characters[0].name +
            " in your collection."
        );
      }
    }
  } else {
    res.send("Chest not found");
  }
});

//put point
app.get("/leaderboard", async (req, res) => {
  let leaderboard = await client
    .db("Assignment")
    .collection("players")
    .find()
    .sort({
      points: -1,
    })
    .toArray();
  if (leaderboard.length > 0) {
    // Give achievement to the top player
    await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: leaderboard[0].player_id },
        { $addToSet: { achievements: "You are the Top of King in this Game" } }
      );
  }
  res.send(leaderboard);
});

app.patch("/change_selected_char", async (req, res) => {
  let player = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: [{ name: req.body.name }, { email: req.body.email }],
    });
  if (!player) {
    return res.status(404).send("Player not found");
  }
  let index = player.collection.characterList.indexOf(
    req.body.character_selected
  );
  if (index === -1) {
    return res.status(400).send("Character not found in character list");
  }
  if (!Array.isArray(player.collection.charId)) {
    return res.status(400).send("Character ID list not found");
  }
  const char_id = player.collection.charId[index];

  let read_id = await client
    .db("Assignment")
    .collection("characters_of_players")
    .findOne({ char_id: char_id });
  if (!read_id) {
    return res.status(404).send("Character not found");
  }

  let selected_char = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { name: req.body.name },
      {
        $set: {
          "collection.character_selected.name": req.body.character_selected,
          "collection.character_selected.charId": char_id,
        },
      }
    );
  if (selected_char.modifiedCount === 0) {
    return res.status(400).send("Failed to change selected character");
  } else {
    res.send(
      "Your selected character has been changed to " +
        req.body.character_selected
    );
  }
});

//This api useless
// app.get("/battle/:id", async (req, res) => {
//   const name = await client
//     .db("Assignment")
//     .collection("players")
//     .aggregate([
//       {
//         $match: { name: req.params.selectName },
//       },
//       {
//         $project: {
//           _id: 0,
//           name: 1,
//           point: 1,
//           collection: 1,
//         },
//       },
//     ])
//     .toArray();

//   if (player) {
//     res.send(name);
//   } else {
//     res.status(400).send("Player not found");
//   }
// });

app.patch("/battle", async (req, res) => {
  const user = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: [
        {
          name: req.body.name,
          email: req.body.email,
        },
      ],
    });
  const attacker = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      { $sample: { size: 1 } },
      { $project: { _id: 0, name: 1, player_id: 1, collection: 1 } },
      {
        $lookup: {
          from: "characters_of_players",
          localField: "character_selected",
          foreignField: "char_id",
          as: "character_selected",
        },
      },
    ]);
  const defender = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      { $sample: { size: 1 } },
      { $project: { _id: 0, name: 1, player_id: 1, collection: 1 } },
      {
        $lookup: {
          from: "characters_of_players",
          localField: "character_selected",
          foreignField: "char_id",
          as: "character_selected",
        },
      },
    ])
    .toArray();

  console.log(attacker);
  console.log(defender[0]);
  //need to read char of player*******
  let newHealthAttacker =
    attacker.collection.character_selected.character.health;
  let newHealthDefender =
    defender[0].collection.character_selected.character.health;
  let battleCount = 0;
  if (attacker.player_id === defender[0].player_id) {
    return res.status(400).send("You cannot battle with yourself");
  }
  if (!attacker || !defender[0]) {
    return res.status(400).send("Player not found");
  }
  if (attacker && defender) {
    while (newHealthAttacker > 0 && newHealthDefender > 0) {
      newHealthAttacker -=
        attacker.character_selected.attack * attacker.character_selected.speed;
      newHealthDefender -=
        defender[0].character_selected.attack *
        defender[0].character_selected.speed;
      battleCount++;
    }
    let winner =
      newHealthAttacker > newHealthDefender ? attacker.name : defender[0].name;
    let battleRecord = {
      attacker: attacker.name,
      defender: defender.name,
      battleCount: battleCount,
      winner: winner,
      date: new Date().getDate(),
    };
    console.log(battleRecord);
    console.log(winner);
    await client
      .db("Assignment")
      .collection("players")
      .updateOne({ name: winner }, { $inc: { points: 3 } });

    if (newHealthAttacker <= 0) {
      res.send(`Nice try, you will be better next time!`);
    } else {
      res.send(
        `Congratulations, you won the battle after ${battleCount} rounds!`
      );
    }
    await client
      .db("Assignment")
      .collection("battle_history")
      .updateOne(
        { player_id: attacker.player_id },
        { $push: { battles: battleRecord } },
        { upsert: true }
      );
    await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: player.player_id },
        {
          $push: {
            characters: {
              _id: countNum,
              name: character_in_chest[0].characters,
            },
          },
          $addToSet: {
            achievements: "First win",
          },
        },
        { upsert: true }
      );

    res.send("Battle completed");
  } else {
    res.status(400).send("Battle failed");
  }
});

app.get("/achievements/:player_id", async (req, res) => {
  let user = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      player_id: req.params.player_id,
      achievements: { $exists: true },
    });
  if (!user) {
    res.status(404).send("Find a way to get your achievements!");
  }
  res.send(user.achievements);
});

app.get("/history/:player_id", async (req, res) => {
  let history = client
    .db("Assignment")
    .collection("battle_history")
    .find({
      $and: [
        { player_id: req.params.player_id },
        { battles: { $exists: true } },
      ],
    });
  console.log(history);
  if (!history) {
    return res.status(404).send("No history found for this player");
  }

  res.send(history);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//Path:package.json
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://b022210249:Asdfghjkl2326@cluster0.qexjojg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);