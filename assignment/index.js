require('dotenv').config();
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

//using for registration for users
app.post("/register", async (req, res) => {
  // Check if all required fields are provided
  if ( 
    !req.body.name ||
    !req.body.email ||
    !req.body.password ||
    !req.body.gender
  ) {
    return res //if not provided, send the message
      .status(400)
      .send("name,email,password and gender are required.\n 안돼!!!(ू˃̣̣̣̣̣̣︿˂̣̣̣̣̣̣ ू)");
  }
  // Check if the username or email already exists
  let existing =
    (await client.db("Assignment").collection("players").findOne({
      name: req.body.username,
    })) ||
    (await client.db("Assignment").collection("players").findOne({
      email: req.body.email,
    }));
  //if the username or email already exist, send the message
  if (existing) {
    res.status(400).send("username or email already exist");
  } else { //if not, hash the password
    const hash = bcrypt.hashSync(req.body.password, 10);
    // Find the player with the highest player_id
    const highestIdPlayer = await client.db("Assignment").collection("players").find().sort({player_id: -1}).limit(1).toArray();
    const highestId = highestIdPlayer[0] ? highestIdPlayer[0].player_id : 0;

    // Increment the highest player_id by 1
    const nextId = highestId + 1;

    let countNum = await client
      .db("Assignment")
      .collection("characters_of_players")
      .countDocuments();
    let resq = await client //insert the data into the database
      .db("Assignment")
      .collection("players")
      .insertOne({
        name: req.body.name,
        player_id: nextId,
        password: hash,
        email: req.body.email,
        gender: req.body.gender,
        //collection of the player(default character is Lillia)
        collection: {
          characterList: ["Lillia"],
          character_selected: { name: "Lillia", charId: countNum },
          charId: [countNum],
        },
        roles:"player",
        money: 0,
        points: 0,
        achievements: ["A beginner player"],
        friends: { friendList: [], sentRequests: [], needAcceptRequests: [] },
        starterPackTaken: false,
      });
    //get the character Lillia from the database
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
    console.log(Lilla[0]);
    await client //insert the character Lillia into the database
      .db("Assignment")
      .collection("characters_of_players")
      .insertOne({ char_id: countNum, characters: Lilla[0] }, { upsert: true });

    res.send(
      "Congratulation! Your account register succesfully!\nLog in to start your battle journey! \n( ◑‿◑)ɔ┏🍟--🍔┑٩(^◡^ )"
    );
  }
});

//login for users 
app.post("/userLogin", async (req, res) => {
  // Check if all required fields are provided
  if (!req.body.name || !req.body.email) {
    return res.status(400).send("name and email are required. ( ˘ ³˘)❤");
  }
  // Check if the user exists
  let resp = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and:[{name:req.body.name},{email:req.body.email}]
    });
  if (!resp) {
    res.send("User not found ⸨◺_◿⸩");
  } else {
    // Check if password is provided
    if (resp.password) {
      if (bcrypt.compareSync(req.body.password, resp.password)) {
        const token = jwt.sign({ id: resp._id,name: resp.name,player_id: resp.player_id ,email: resp.email,roles:resp.roles},process.env.JWT_SECRET,{expiresIn:'1h'});
        console.log (token);
        //if the password is correct, send the message
        res.status(200).send({
          message: "Login successful. Remember to gain your starter pack!\n(っ＾▿＾)۶🍸🌟🍺٩(˘◡˘ )",
          token: token
        });
      //if the password is wrong, send the message
      } else {
        res.send("Wrong Password ⸨◺_◿⸩");
      }
    } else { //if the password is not provided, send the message
      res.send("Password not provided ⸨◺_◿⸩");
    }
  }
});             

//login for admin
app.post("/adminLogin",async(req,res)=>{
  // Check if all required fields are provided
  if (!req.body.name || !req.body.email) {
    return res.status(400).send("name and email are required. ( ˘ ³˘)❤");
  }
  // Check if the admin exists
  let resp = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and:[{name:req.body.name},{email:req.body.email}]
    });
  //if the admin not found, send the message
  if (!resp) {
    res.send("Admin not found ⸨◺_◿⸩");
  } else {
    // Check if password is provided
    if (resp.password) {
      if (bcrypt.compareSync(req.body.password, resp.password)) {
        const token = jwt.sign({ id: resp._id,name: resp.name,email: resp.email,roles:resp.roles},process.env.JWT_SECRET,{expiresIn:'1h'});
        console.log (token);
        //if the password is correct, send the message
        res.status(200).send({
          message: "Admin login successful. Do yer thang in the admin panel!!\n(っ＾▿＾)۶🍸🌟🍺٩(˘◡˘ )",
          token: token //send the token
        });
      //if the password is wrong, send the message
      } else {
        res.send("Wrong Password ⸨◺_◿⸩");
      }
    } else { //if the password is not provided, send the message
      res.send("Password not provided ⸨◺_◿⸩");
    }
  }
})

//login to get startpack 
app.patch("/login/starterpack",verifyToken, async (req, res) => {
  // Check if name is provided
  if (!req.body.name) {
      return res.status(400).send("name is required.☜(`o´)");
    }
  // Check if the user is authorised to take the starter pack
  if (req.identify.roles == "player" && req.identify.name == req.body.name) {
    
    const min = 1000; //minimum amount of money
    const max = 2000; //maximum amount of money
    const newMoneyAmount = Math.floor(Math.random() * (max - min + 1)) + min;//random amount of money
    let user = await client
      .db("Assignment")
      .collection("players")
      .findOneAndUpdate(
        {
          $and: [
            {
              name: req.body.name,
            },
            { starterPackTaken: { $eq: false } }, //check if the starter pack is taken
          ],
        },
        //update the money and starter pack taken
        { $set: { starterPackTaken: true, money: newMoneyAmount } },
        { returnOriginal: false }
      );
    //if the starter pack is already taken, send the message
    if (user === null) {
      res.status(400).send("Starter pack already taken (╯°□°）╯");
    } else {
      res.send( //if the starter pack is not taken, send the message
        `Total amount of RM ${newMoneyAmount} is given to player ${req.body.name}🤑🤑🤑 `
      );
    }
  }else{ //if the user is not authorised, send the message
    return res.status(401).send("You are not authorised to take the starter pack");
  }
});

//in funtion of adding chest(developer token needed)
app.post("/chests",verifyToken,async (req, res) => {
  // Check if all required fields are provided
  // Check if the user is authorised to create a chest
  if (req.identify.roles == "admin") {
    if (
      !req.body.chest ||
      !req.body.price ||
      !req.body.characters ||
      !req.body.Max_power_level
    ) {
      return res //if not provided, send the message
        .status(400)
        .send(
          "chest,price,characters and Max_power_level are required.\n -`д´- "
        );
    }
    // Check if the chest already exists
    let existing = await client.db("Assignment").collection("chests").findOne({
      chest: req.body.chest,
    });
    //if the chest already exist, send the message
    if (existing) {
      res.status(400).send("Chest already exist ಠ_ಠ");
    } else { // Check if the character already exists in the characters array
      if (req.body.characters.includes(req.body.character)) {
        return res.status(400).send("Character already in characters array ಠ_ಠ");
      }
      let chest = await client.db("Assignment").collection("chests").insertOne({
        chest: req.body.chest,
        price: req.body.price,
        characters: req.body.characters,
        Max_power_level: req.body.Max_power_level,
      });
      res.send(chest);
    }
  }else{ //if the user is not authorised, send the message
    return res.status(401).send("You are not authorised to create a chest");
  }
});

//in function of adding character(developer token needed)
app.post("/character",verifyToken, async (req, res) => {
  // Check if all required fields are provided
  // Check if the user is authorised to create a character
  if(req.identify.roles != "admin"){
    return res.status(401).send("You are not authorised to create a character");
  }else{
    if (
      !req.body.character_name ||
      !req.body.health ||
      !req.body.attack ||
      !req.body.type ||
      !req.body.speed
    ) {
      return res //if not provided, send the message
        .status(400)
        .send(
          "character_name,health,attack,type and speed are required.\n ໒( ⇀ ‸ ↼ )७)"
        );
    }
    // Check if the character already exists
    let existing = await client
      .db("Assignment")
      .collection("characters")
      .findOne({
        name: req.body.character_name,
      });
    //if the character already exist, send the message
    if (existing) {
      res.status(400).send("Character already exist (╬≖_≖)");
    } else { //if not, insert the data into the database
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
  }
});

//reading the profile of the user
app.get("/readUserProfile/:player_name", verifyToken, async (req, res) => {
  if (
    req.identify.roles == "player" &&
    req.identify.name == req.params.player_name
  ) {
    let document = await client
      .db("Assignment")
      .collection("players")
      .aggregate([
        {
          $match: { name: req.params.player_name },
        },
        {
          $project: {
            _id: 0,
            player_id: 1,
            name: 1,
            gender: 1,
            money: 1,
            collection: 1,
            points: 1,
            friends: 1,
            achievments: 1,
            notifications: 1,
          },
        },
        {
          $lookup: {
            from: "players",
            localField: "friends.friendList",
            foreignField: "player_id",
            as: "friends.friendList",
          },
        },
        {
          $lookup: {
            from: "characters_of_players",
            localField: "collection.charId",
            foreignField: "char_id",
            as: "collection.charId",
          },
        },
        {
          $lookup: {
            from: "characters_of_players",
            localField: "collection.character_selected.charId",
            foreignField: "char_id",
            as: "collection.character_selected.charId",
          },
        },
        {
          $project: {
            player_id: 1,
            name: 1,
            gender: 1,
            money: 1,
            points: 1,
            "collection.characterList": 1,
            "collection.character_selected.name": 1,
            "collection.character_selected.charId.char_id": 1,
            "collection.character_selected.charId.characters": 1,
            "collection.charId.char_id": 1,
            "collection.charId.characters": 1,
            "friends.friendList.player_id": 1,
            "friends.friendList.points": 1,
            "friends.friendList.name": 1,
            "friends.friendList.gender": 1,
            "friends.needAcceptRequests": 1,
            achievments: 1,
            notifications: 1,
          },
        },
        {
          $project: {
            "collection.charId._id": 0,
          },
        },
      ])
      .toArray();
    res.send(document);
  } else {
    return res.status(401).send("You are not authorised to read this player");
  }
});
//everyone can read each other(users and developers)
app.get("/read/:player_name", verifyToken,async (req, res) => {
  // Check if the user is authorised to read the profile
  if(req.identify.roles == "player" ||req.identify.roles == "admin"){
    let document = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      {
        $match: { name: req.params.player_name },//match the name of the player
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
        $lookup: { //lookup the friends of the player
          from: "players",
          localField: "friends.friendList",
          foreignField: "player_id",
          as: "friendsInfo",
        },
      },
      {
        $project: {
          player_id: 1,
          name: 1,
          gender: 1,
          "collection.characterList": 1,
          points: 1,
          achievments: 1,
          "friendsInfo.player_id": 1,
          "friendsInfo.name": 1,
        },
      },
      {
        $lookup: { //lookup the characters of the player
          from: "characters",
          localField: "collection.characterList",
          foreignField: "name",
          as: "characterInfo",
        },
      },
      {
        $project: {
          player_id: 1,
          name: 1,
          gender: 1,
          "characterInfo.name": 1,
          "characterInfo.health": 1,
          "characterInfo.attack": 1,
          "characterInfo.speed": 1,
          "characterInfo.type": 1,
          points: 1,
          achievments: 1,
          "friendsInfo.player_id": 1,
          "friendsInfo.name": 1,
        },
      },
    ])
    .toArray();
  res.send(document);
  }else{ //if the user is not authorised, send the message
    return res.status(401).send("You are not authorised to read this player");
  }
});

//need Developer token
//to add character to chest
app.patch("/add_character_to_chest",verifyToken,async (req, res) => {
  // Check if all required fields are provided
  // Check if the user is authorised to add character to chest
  if(req.identify.roles == "admin"){
      if (!req.body.chest || !req.body.character_name) {
        return res
          .status(400)
          .send("chest and character_name are required. \n٩(๑ `н´๑)۶");
      }
      // Check if the chest exists
      let result2 = await client
        .db("Assignment")
        .collection("chests")
        .findOne({ chest: req.body.chest });
      //if the chest not found, send the message
      if (!result2) {
        return res.status(404).send("Chest not found|･ω･｀)");
      }
      // Check if the character exists
      if (result2.characters.includes(req.body.character_name)) {
        return res.status(400).send("Character already exist in the chest |･ω･)ﾉ");
      }
      // Add the character to the chest
      const result = await client
        .db("Assignment")
        .collection("chests")
        .updateOne(
          { chest: req.body.chest },
          { $addToSet: { characters: req.body.character_name } }
        );
      res.send("Character added successfully ૮ ºﻌºა");
  }else{ //if the user is not authorised, send the message
    return res.status(401).send("You are not authorised to add character to chest");
  }
});

//need Developer token
//to delete character from chest
app.patch("/delete_character", verifyToken, async (req, res) => {
  // Check if all required fields are provided
  // Check if the user is authorised to delete character from chest
  if (req.identify.roles != "admin") {
    return res.status(401).send("You are not authorised to delete this character");
  }
  if (!req.body.chest || !req.body.char_name) {
    return res.status(400).send("name and char_name are required. ( ˘ ³˘)❤");
  }
  // Check if the character exists
  let char = await client.db("Assignment").collection("characters").find({
    name: req.body.char_name,
  });
  if (char) {
    await client.db("Assignment").collection("characters").deleteOne({
      name: req.body.char_name,
    });
    let char_chest = await client.db("Assignment").collection("chests").find({
      chest: req.body.chest,
    });
    // Check if the character exists in the chest
    // Delete the character from the chest
    if (char_chest) {
      await client
        .db("Assignment")
        .collection("chests")
        .updateOne(
          {
            chest: req.body.chest,
          },
          {
            $pull: {
              characters: req.body.char_name,
            },
          }
        );
      res.send("Character deleted successfully ( ˘ ³˘)❤");
    } else {
      res.status(400).send("Character in chest not found ( ˘︹˘ )");
    }
  } else {
    res.status(400).send("Character not found ( ˘︹˘ )");
  }
});

//need Developer token
//to update character
app.patch("/characterupdate/:charactername",verifyToken,async (req, res) => {
  // Check if all required fields are provided
  // Check if the user is authorised to update character
  if(req.identify.roles == "admin"){
    if (
      !req.body.health ||
      !req.body.attack ||
      !req.body.speed ||
      !req.body.type
    ) {
      return res //if not provided, send the message
        .status(400)
        .send("health,attack,speed and type are required.（＞д＜）");
    }
    // Check if the character exists
    let existing = await client
      .db("Assignment")
      .collection("characters")
      .findOne({
        name: req.params.charactername,
      });
    //if the character not found, send the message
    if (!existing) {
      res.status(400).send("Character does not exist (´つヮ⊂)");
    } else { //if not, update the data into the database
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
  }else{ //if the user is not authorised, send the message
    res.status(403).send("You are not authorised to update this character");
  }
});

// To send a friend request for users only
app.post("/send_friend_request", verifyToken, async (req, res) => {
  // Check if requesterId and requestedId are provided
  if (!req.body.requesterId || !req.body.requestedId) {
    return res
      .status(400)
      .send("requesterId and requestedId are required. (◡́.◡̀)(^◡^ )");
  }
  // Check if the user is authorised to send a friend request
  if(req.identify.roles == "player" && req.identify.player_id == req.body.requesterId){
    // Check if requesterId and requestedId are different
    if (parseInt(req.body.requesterId) === parseInt(req.body.requestedId)) {
      return res
        .status(400)
        .send("You cannot send a friend request to yourself\n໒( ̿❍ ᴥ ̿❍)u");
    }
    // Check if the requester player exists
    const requester = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.body.requesterId) });
    // Check if the requested player exists
    const requested = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.body.requestedId) });
    //if the requester or requested not found, send the message
    if (!requester || !requested) {
      return res.status(404).send("Either players not found ૮ ⚆ﻌ⚆ა?");
    }
    // Check if the players are already friends
    if (requester.friends.friendList.includes(requested.player_id)) {
      return res
        .status(404)
        .send("The player is already in your friend list ૮ ⚆ﻌ⚆ა?");
    }
    // Check if friend request has already been sent
    if (
      requester &&
      requester.friends &&
      requester.friends.sentRequests &&
      requester.friends.sentRequests.indexOf(parseInt(req.body.requestedId)) !==
        -1
    ) {
      return res.status(400).send("Friend request already sent");
    }
    // Send the friend request
    const sent = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: parseInt(req.body.requesterId) },
        { $push: { "friends.sentRequests": parseInt(req.body.requestedId) } }
      );
    // Add the friend request to the requested player
    const sent2 = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: parseInt(req.body.requestedId) },
        {
          $push: {
            "friends.needAcceptRequests": parseInt(req.body.requesterId),
          },
        }
      );
    //if the friend request failed to send, send the message
    if (sent.modifiedCount === 0 && sent2.modifiedCount === 0) {
      res.status(400).send("Failed to send friend request");
    } else {
      res.send("Friend request sent! \n(っ◔◡◔)っ ♥ ᶠᵉᵉᵈ ᵐᵉ /ᐠ-ⱉ-ᐟﾉ");
    }
  }else{ //if the user is not authorised, send the message
    return res.status(401).send("You are not authorised to send this friend request");
}});

// To  accept a friend request for users only
app.patch("/accept_friend_request", verifyToken, async (req, res) => {
  // Check if accepterId and requesterId are provided
  if (!req.body.accepterId || !req.body.requesterId) {
    return res
      .status(400)
      .send("accepterId and requesterId are required ㅇㅅㅇ");
  }
  // Check if the user is authorised to accept a friend request
  if(req.identify.roles == "player" && req.identify.player_id == req.body.accepterId){
    if (parseInt(req.body.accepterId) === parseInt(req.body.requesterId)) {
      return res
        .status(400)
        .send("You cannot accept a friend request from yourself");
    }
    // Check if the requester player exists
    const requester = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.body.requesterId) });
    // Check if the accepter player exists
    const accepter = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.body.accepterId) });
    //if the requester or accepter not found, send the message
    if (!requester || !accepter) {
      return res.status(404).send("Either players not found (=ↀωↀ=)");
    }
    // Move the friend request from needAcceptRequests to friends
    const accept = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        {
          player_id: parseInt(req.body.accepterId),
          "friends.needAcceptRequests": parseInt(req.body.requesterId),
        },
        {
          $pull: {
            "friends.needAcceptRequests": parseInt(req.body.requesterId),
          },
          $push: { "friends.friendList": parseInt(req.body.requesterId) },
        }
      );
    console.log(accept);
    // Move the friend request from sentRequests to friends
    const accept2 = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        {
          player_id: parseInt(req.body.requesterId),
          "friends.sentRequests": parseInt(req.body.accepterId),
        },
        {
          $pull: { "friends.sentRequests": parseInt(req.body.accepterId) },
          $push: { "friends.friendList": parseInt(req.body.accepterId) },
        }
      );
    console.log(accept2);
    //if the friend request failed to accept, send the message
    if (accept.modifiedCount === 0 && accept2.modifiedCount === 0) {
      res.status(400).send("Failed to accept friend request (=ↀωↀ=)");
    } else { //if the friend request is accepted, send the message
      console.log(accepter.friends.friendList.length);
      res.send("Friend request accepted (ﾐⓛᆽⓛﾐ)✧");
      // Check if the player has more than 5 friends
      // Add the achievement to the player
      if (accepter.friends.friendList.length = 5) {
        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            { player_id: parseInt(req.body.accepterId) },
            { $addToSet: { achievements: "Makes more friends (=✪ᆽ✪=)" } }
          );
      }
    }
  }else{ //if the user is not authorised, send the message
    return res.status(401).send("You are not authorised to accept this friend request");
}});

/// API to remove a friend from a user's friend list
app.patch("/remove_friend/:requesterId/:friendId", verifyToken, async (req, res) => {
  // Check if the user is a player and the requester ID matches the authenticated player's ID
  if(req.identify.roles == "player" && req.identify.player_id == req.params.requesterId){
    // Check if requesterId and friendId are different
    if (parseInt(req.params.requesterId) === parseInt(req.params.friendId)) {
      return res.status(400).send("You cannot remove yourself (╯ ͠° ͟ʖ ͡°)╯┻━┻");
    }
    // Check if both players exist in the database
    const requester = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.params.requesterId) });

    const friend = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.params.friendId) });

    if (!requester || !friend) {
      return res.status(404).send("Either players not found (˃̣̣̥⌓˂̣̣̥ )");
    }
    // Remove the friend from the requester’s friend list
    const remove1 = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: parseInt(req.params.requesterId) },
        { $pull: { "friends.friendList": parseInt(req.params.friendId) } }
      );
    // Remove the requester from the friend’s friend list
    const remove2 = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: parseInt(req.params.friendId) },
        { $pull: { "friends.friendList": parseInt(req.params.requesterId) } }
      );
    // Check if both removals were successful
    if (remove1.modifiedCount === 0 && remove2.modifiedCount === 0) {
      res.status(400).send("Failed to remove friend ╥__╥");
    } else {
      res.send("Friend removed ‧º·(˚ ˃̣̣̥⌓˂̣̣̥ )‧º·");
    }
  }else{
    return res.status(401).send("You are not authorised to remove this friend");
  }
});

// API for users to update their profile
app.patch("/update/:name", verifyToken, async (req, res) => {
  // Validate required fields
  if (
    !req.body.name ||
    !req.body.email ||
    // !req.body.password ||
    !req.body.gender
  ) {
    return res
      .status(400)
      .send("name,email,password and gender are required.\n( ˘▽˘)っ♨");
  }
  // Check if the user is a player and the name matches the authenticated player's name
  if(req.identify.roles == "player" && req.identify.name == req.params.name){
    // Hash the password (commented out)
    // const hash = await bcrypt.hash(req.body.password, 10);
    
    // Update the player’s profile in the database
    let require = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        {
          name: req.params.name
        },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            gender: req.body.gender, 
          },
        }
      );
      // Retrieve the updated player record
      let result = await client.db("Assignment").collection("players").findOne({name:req.body.name});
      console.log(require);
    // Check if the update was successful
    if (require.modifiedCount === 0) {
      res.status(400).send("Updated failed (˃̣̣̥⌓˂̣̣̥ )");
    } else {
      // Generate a new JWT token with the updated information
      const newToken = jwt.sign({ id: result._id,name: result.name,player_id: result.player_id ,email: result.email,roles:result.roles},process.env.JWT_SECRET,{expiresIn:'1h'});
      res.send({
        message: "Profile updated successfully 🍲_(ﾟ◇ﾟ；)ノﾞ",
        token: newToken
      });
    }
  } else {
    return res.status(401).send("You are not authorised to update this player");
  }
});

// API for users to delete their account
app.delete("/delete/:name",verifyToken, async (req, res) => {
  // Check if the user is a player and the name matches the authenticated player's name
  if(req.identify.roles == "player" && req.identify.name == req.params.name){
    // Find the player in the database
    let existing = await client.db("Assignment").collection("players").findOne({
      name: req.params.name,
    });
    if (existing) {
        // Delete the player’s account
        let delete_req = await client
              .db("Assignment")
              .collection("players")
              .deleteOne({
                name: req.params.name,
              });
            res.send(delete_req);
            console.log(req.params);
    }else{
      res.status(400).send("Player not found ( ˘︹˘ )");
    }
  } else {
    return res.status(401).send("You are not authorised to delete this player");
  }
});

// API for users to read chests
app.get("/readchests", verifyToken, async (req, res) => {
  // Check if the user is a player or admin
  if(req.identify.roles == "player" || req.identify.roles == "admin"){
    // Retrieve chests from the database
    const chests = await client
      .db("Assignment")
      .collection("chests")
      .aggregate([{ $project: { _id: 0, chest: 1, price: 1, characters: 1 } }])
      .toArray();
    res.send(chests);
  }
  else{
    return res.status(401).send("You are not authorised to view the chests");
  }
});

// API for players to buy a chest and get a character
app.patch("/buying_chest", verifyToken, async (req, res) => {
  // Check if required fields are provided
  if (!req.body.name || !req.body.email || !req.body.chest) {
    return res
      .status(400)
      .send("name,email and chest are required. ( ･ิ⌣･ิ)📦(‘∀’●)♡");
  }
  // Check if the user is authorized (player or name matches)
  if(req.identify.roles == "player" || req.identify.name == req.body.name) {
    // Retrieve player data from the database
    let player = await client
      .db("Assignment")
      .collection("players")
      .findOne({
        $and: [{ name: req.body.name }, { email: req.body.email }],
      });
    // Retrieve chest data from the database
    let chest = await client.db("Assignment").collection("chests").findOne({
      chest: req.body.chest,
    });
    // Randomly select a character from the chest
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
  
    // Check if player exists
    if (!player) {
      return res.status(400).send("User or email are wrong ༼☯﹏☯༽");
    }
    // Check if the player has enough money to buy the chest
    if (player.money < chest.price) {
      return res.send(
        "Not enough money to buy chest. Please compete more battles to earn more money.(இ﹏இ`｡)"
      );
    }
  
    // If chest is found
    if (chest) {
      // Check if the player already has the character
      if (
        player.collection.characterList.includes(
          character_in_chest[0].characters[0].name
        )
      ) {
        let index = player.collection.characterList.indexOf(
          character_in_chest[0].characters[0].name
        );
        console.log(index);
        // Power up the existing character
        let your_char = await client
          .db("Assignment")
          .collection("characters_of_players")
          .findOneAndUpdate(
            {
              char_id: player.collection.charId[index],
            },
            {
              $inc: {
                "characters.health": 100,
                "characters.attack": 100,
                "characters.speed": 0.1,
              },
            }
          );
        console.log(your_char);
        return res.send(
          character_in_chest[0].characters[0].name +
            ` already exist in your collection, power up instead 💪🏼`
        );
      } else {
        // Add the new character to the player's collection and deduct the chest price
        let buying = await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            {
              name: req.body.name,  
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
          return res.send("Failed to buy character (☍﹏⁰)｡");
        } else {
          // Assign a new character ID and insert into the characters_of_players collection
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
            // Insert the new character into the player's collection
            await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              {
                name: req.body.name,
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
            // Assign a new character ID and insert into the characters_of_players collection
          await client
            .db("Assignment")
            .collection("characters_of_players")
            .insertOne({ char_id: countNum, characters: randomChar[0] });
          // Update the player's character ID list
          await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { name: req.body.name },
              {
                $push: {
                  "collection.charId": countNum,
                },
              },
              { upsert: true }
            );
          // Check if the player has collected all characters and grant an achievement
          if (player.collection.characterList.length === 21) {
            await client
              .db("Assignment")
              .collection("players")
              .updateOne(
                { player_id: player.player_id },
                {
                  $addToSet: {
                    achievements:
                      "Congraturation!!!👑You complete all characters collection🏆",
                  },
                }
              );
          }
          // Return a success message
          return res.send(
            "Chest bought successfully🦍, you got " +
              character_in_chest[0].characters[0].name +
              " in your collection."
          );
        }
      }
    } else {
      // Return an error message if the chest is not found
      res.send("Chest not found(T⌓T)");
    }
  }else{
    // Return an error message if the user is not authorized
    return res.status(401).send("You are not authorised to buy a chest");
  }
});

// API for admin to delete a chest
app.delete("/deleteChest/:chestName",verifyToken,async(req,res)=>{
  if(req.identify.roles == "admin"){
    // Check if the chest exists in the database
    let existing_chest = await client.db("Assignment").collection("chests").findOne({
      chest: req.params.chestName
    });
    
    // If chest exists, delete it
    if(existing_chest){
        let delete_req = await client.db("Assignment").collection("chests").deleteOne({
        chest: req.params.chestName
      });
        console.log(delete_req);
        res.status(200).send("Chest deleted successfully q(≧▽≦q)");
    }else{
      res.status(400).send("Chest not found ( ˘︹˘ )");
    }
    
  }else{
    res.status(403).send("You are not authorised to delete this chest");
  }
});

// API to get the leaderboard
app.get("/leaderboard", verifyToken, async (req, res) => {
    if (req.identify.roles == "player" || req.identify.roles == "admin") {
      // Retrieve and sort players by points in descending order
      let leaderboard = await client
      .db("Assignment")
      .collection("players")
      .aggregate([
        {
          $sort: {
            points: -1,
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            player_id: 1,
            gender: 1,
            points: 1,
          },
        },
      ])
      .toArray();
    if (leaderboard.length > 0) {
      // Give achievement to the top player
      await client
        .db("Assignment")
        .collection("players")
        .updateOne(
          { player_id: leaderboard[0].player_id },
          {
            $addToSet: { achievements: "You are the Top of King in this Game👑" },
          }
        );
    }
    res.send(leaderboard);
    } else {
    return res.status(401).send("You are not authorised to view the leaderboard");
  }
});

// An API to change the selected character for a player
app.patch("/change_selected_char", verifyToken, async (req, res) => {
  // Check if the necessary fields are present in the request body
  if (!req.body.name || !req.body.email || !req.body.character_selected) {
    return res
      .status(400)
      .send("name,email and character_selected are required.（◎ー◎；）");
  }
  // Check if the user is a player and their name matches the request body
  if(req.identify.roles == "player" && req.identify.name == req.body.name){
    
    // Find the player in the database
    let player = await client
      .db("Assignment")
      .collection("players")
      .findOne({
        $and: [{ name: req.body.name }, { email: req.body.email }],
      });
    // If the player is not found, return a 404 error
    if (!player) {
      return res.status(404).send("Player not found 👨🏾‍❤️‍👨🏾");
    }
    // Find the index of the selected character in the player's character list
    let index = player.collection.characterList.indexOf(
      req.body.character_selected
    );
    // If the character is not found in the list, return a 400 error
    if (index === -1) {
      return res.status(400).send("Character not found in character list (◔ヘ◔)");
    }
    // Check if the character ID list is an array
    if (!Array.isArray(player.collection.charId)) {
      return res.status(400).send("Character ID list not found (◔ヘ◔)");
    }
    // Get the character ID corresponding to the selected character
    const char_id = player.collection.charId[index];

    // Find the character in the characters_of_players collection
    let read_id = await client
      .db("Assignment")
      .collection("characters_of_players")
      .findOne({ char_id: char_id });
    // If the character is not found, return a 404 error
    if (!read_id) {
      return res.status(404).send("Character not found (◔ヘ◔)");
    }

    // Update the player's selected character in the database
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
    // If no documents were modified, return a 400 error
    if (selected_char.modifiedCount === 0) {
      return res.status(400).send("Failed to change selected character (◔ヘ◔)");
    } else {
      // If the update was successful, return a success message
      res.send(
        "Your selected character has been changed to " +
          req.body.character_selected +
          "🐣"
      );
    }
  } else {
    // If the user is not authorized, return a 401 error
    return res.status(401).send("You are not authorised to change the selected character");
  }
});

// An API to start a battle
app.patch("/battle", verifyToken, async (req, res) => {
  // Check if the necessary fields are present in the request body
  if (!req.body.name || !req.body.email) {
    return res.status(400).send("name and email are required. ( ˘ ³˘)❤");
  }
  // Check if the user is a player and their name matches the request body
  if(req.identify.roles == "player" && req.identify.name == req.body.name){

    // Find the user in the database
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
    // If the user is not found, return a 404 error
    if (!user) {
      return res.status(404).send("Player not found ໒( ⊡ _ ⊡ )७");
    } else if (user.collection.character_selected === null) {
      // If the user has not selected a character, return a 400 error
      return res.status(400).send("Character not selected. (◔_◔)🍔🍕");
    }
    // Get the attacker's data from the database
    let attacker = await client
      .db("Assignment")
      .collection("players")
      .aggregate([
        { $match: { name: req.body.name } },
        { $project: { _id: 0, name: 1, player_id: 1, collection: 1 } },
      ])
      .toArray();
    // Avoid selecting the same player as both attacker and defender
    let defender;
    do {
      defender = await client
        .db("Assignment")
        .collection("players")
        .aggregate([
          {$match:{name:{$ne:"admin"}}},
          { $sample: { size: 1 } },
          { $project: { _id: 0, name: 1, player_id: 1, collection: 1 } },
        ])
        .toArray();
    } while (attacker[0].player_id === defender[0].player_id);

    // Log the attacker and defender for debugging
    console.log(attacker[0]);
    console.log(defender[0]);

    // If either the attacker or defender is not found, return a 400 error
    if (!attacker[0] || !defender[0]) {
      return res.status(400).send("Player not found (●･̆⍛･̆●)");
    }
    // Get the character IDs of the attacker and defender
    const charId_attacker = attacker[0].collection.character_selected.charId;
    const charId_defender = defender[0].collection.character_selected.charId;
    console.log(charId_attacker);
    console.log(charId_defender);
    
    // Find the attacker's character in the characters_of_players collection
    let attacker_character = await client
      .db("Assignment")
      .collection("characters_of_players")
      .findOne({ char_id: charId_attacker });

    // Find the defender's character in the characters_of_players collection
    let defender_character = await client
      .db("Assignment")
      .collection("characters_of_players")
      .findOne({ char_id: charId_defender });

    // Log the characters for debugging
    console.log(attacker_character);
    console.log(defender_character);
    let battle_round = 0;
    let newHealthDefender;
    let newHealthAttacker;

    // If both characters are found, proceed with the battle
    if (attacker_character && defender_character) {
      do {
        // Calculate the new health of the defender after an attack
        newHealthDefender =
          defender_character.characters.health -
          attacker_character.characters.attack *
            attacker_character.characters.speed;

        // Calculate the new health of the attacker after an attack
        newHealthAttacker =
          attacker_character.characters.health -
          defender_character.characters.attack *
            defender_character.characters.speed;

        // Update the characters' health
        defender_character.characters.health = newHealthDefender;
        attacker_character.characters.health = newHealthAttacker;

        battle_round++;
      } while (
        defender_character.characters.health > 0 &&
        attacker_character.characters.health > 0
      );

      // Log the battle round and health for debugging
      console.log(`Battle round: ${battle_round}`); 
      console.log("Attacker health left: ", newHealthAttacker );
      console.log("Defender health left: ", newHealthDefender );
    } else {
      // If either character is not found, return a 400 error
      return res.status(400).send("Character not found(●･̆⍛･̆●)");
    }

    // Determine the winner and loser based on remaining health
    let winner =
      newHealthAttacker > newHealthDefender ? attacker[0].name : defender[0].name;
    let loser =
      newHealthAttacker < newHealthDefender ? attacker[0].name : defender[0].name;

    // If the health of both characters is equal, return a draw message
    if (newHealthAttacker === newHealthDefender) {
      return res.send("Draw. Try attack again with your luck and brain👋≧◉ᴥ◉≦");
    } else {
      if (battle_round > 0) {
        // Record the battle result
        let battleRecord = {
          attacker: attacker[0].name,
          defender: defender[0].name,
          battleRound: battle_round,
          winner: winner,
          date: new Date(),
        };

        await client
            .db("Assignment")
            .collection("battle_record")
            .insertOne({ battleRecord });

        // Log the winner, loser, and battle record for debugging
        console.log(winner);
        console.log(loser);
        console.log(battleRecord);

        // If the attacker lost, send a message
        if (loser == attacker[0].name) {
          res.send(`Nice try, you will be better next time!≧◠ᴥ◠≦✊`);
        } else {
          // If the attacker won, send a message
          res.send(`Congratulations, you won the battle after ${battle_round} rounds!\(≧∇≦)/`);
        }
        // Update the winner's points and money, and add a notification
        await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { name: winner },
              {
                $inc: { points: 3, money: 500 },
                $set: {
                  notification: `Congratulations, you won a battle!≧◠‿◠≦✌`,
                },
              },
              { upsert: true }
            );

        // Decrease the loser's points and add a notification
        await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { name: loser },
              {
                $inc: { points: -1 },
                $set: {
                  notification: "You are being attacked in the game!( ˘︹˘ )",
                },
              },
              { upsert: true }
            );

        // Ensure that the loser's points do not go below 0
        await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { name: loser, points: { $lt: 0 } },
              {
                $set: { points: 0 },
              }
            );

        // Check if the winner has the "First win" achievement and add it if not
        let playerRecord = await client
            .db("Assignment")
            .collection("players")
            .findOne({ name: winner });

        if (
          playerRecord &&
          playerRecord.achievements &&
          !playerRecord.achievements.includes("First win")
        ) {
          await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { name: winner },
              {
                $addToSet: {
                  achievements: "First win",
                },
              }
            );
        }
      } else {
        // If the battle round is 0, return a battle failed message
        res.send("Battle failed 川o･-･)ﾉ");
      }
    }
  } else {
    // If the user is not authorized, return a 401 error
    return res.status(401).send("You are not authorised to battle this player");
  }
});

// An API to read the battle record of a player
app.get("/read_battle_record/:player_name",verifyToken, async (req, res) => {
  // Check if the user is a player and their name matches the request parameters
  if(req.identify.roles == "player" && req.identify.name == req.params.player_name){
    // Find the player's battle history in the database
    let history = await client
    .db("Assignment")
    .collection("battle_record")
    .find({
      $or: [
        { "battleRecord.attacker": req.params.player_name },
        { "battleRecord.defender": req.params.player_name },
      ],
    })
    .toArray();

    // Log the history for debugging
    console.log(history);

    // If no history is found, return a 404 error
    if (history.length === 0) {
      return res
        .status(404)
        .send("No history found for this player (ﾐ〒﹏〒ﾐ)Gambateh!");
    }

    // Send the player's battle history
    res.send(history);
  } else {
    // If the user is not authorized, return a 401 error
    return res.status(401).send("You are not authorised to read the battle record of this player");
  }
});

// An API to delete a player's battle record
app.delete("/deleteBattleRecord/:player_name",verifyToken,async(req,res)=>{
  // Check if the user is an admin
  if(req.identify.roles == "admin"){
    // Delete the player's battle record from the database
    let delete_req = await client.db("Assignment").collection("battle_record").deleteMany({
      "battleRecord.attacker": req.params.player_name
    });
    // Log the delete request for debugging
    console.log(delete_req);
    // Send a success message
    res.status(200).send("Battle record deleted successfully ( ˘︹˘ )");
  } else {
    // If the user is not authorized, return a 403 error
    res.status(403).send("You are not authorised to delete the battle record");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//Path:package.json
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { message } = require('statuses');
const uri =
  `mongodb+srv://b022210249:${process.env.MongoDb_password}@cluster0.qexjojg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token,process.env.JWT_SECRET, (err, decoded) => {
    console.log(err)

    if (err) return res.sendStatus(403)

    req.identify = decoded

    next()
  })
}
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