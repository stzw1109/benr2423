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
      ])
      .toArray();
    console.log(player);
    console.log(character_in_chest[0]);
    console.log(character_in_chest[0].characters);
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
        player.collection.characterList.includes(character_in_chest[0].characters)
      ) {
        let powerUp = await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            {
              $and: [{ name: req.body.name }, { email: req.body.email }],
              "collection.characterList.name": character_in_chest[0].characters,
            },
            {
              $inc: {
                "collection.characterList.$.health": 100,
                "collection.characterList.$.attack": 100,
                "collection.characterList.$.speed": 0.1,
              },
            }
          );
        return res.send(
          powerUp,
          "Character already exist in your collection, power up instead"
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
                "collection.characterList": character_in_chest[0].characters,
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
          await client
            .db("Assignment")
            .collection("characters_of_players")
            .updateOne(
              { player_id: player.player_id },
              {
                $addToSet: {
                  _id: new client.ObjectID(),
                  name: character_in_chest[0].characters,
                },
              },
              { upsert: true }
            );
          await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { player_id: player.player_id },
              {
                $push: {
                  _id: new client.ObjectID(),
                  name: character_in_chest[0].characters,
                },
              },
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
                    _id: new client.ObjectID(),
                    name: character_in_chest[0].characters,
                  },
                },
                $addToSet: {
                  achievements: "First win",
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
                    achievements: "Congraturation! You  complete the characters collection",
                  },
                }
              );
          }
  
          return res.send(
            "Chest bought successfully, you got " +
              character_in_chest[0].characters +
              " in your collection."
          );
        }
      }
    } else {
      res.send("Chest not found");
    }
  });