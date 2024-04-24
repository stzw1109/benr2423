
const bcrypt = require('bcrypt');
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())
app.use(express.static('public'));

//e.g using for registration

app.post('/register',async(req,res) => {
    let existing = await client.db("Assignment").collection("users").findOne({
      name: req.body.username
  }) || await client.db("Assignment").collection("users").findOne({
      email: req.body.email
  });

    if (existing) {
      res.status(400).send("username or email already exist")
    } else {
      const hash = bcrypt.hashSync(req.body.password, 10);
  
    let resq = await client.db("Assignment").collection("users").insertOne({
          name: req.body.username,
          password: hash,
          email: req.body.email,
          gender: req.body.gender
      });
      res.send(resq);
    }
})

app.post('/chest' ,async(req,res) => {
  let existing = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest_name
});
  if (existing) {
    res.status(400).send("Chest already exist")
  } else {
    let chest = await client.db("Assignment").collection("chests").insertOne({
      chest: req.body.chest_name,
      price: req.body.price
    });
    res.send(chest);
    }
  }
)

app.post('/character' ,async(req,res) => {
  let existing = await client.db("Assignment").collection("characters").findOne({
    name: req.body.character_name
});
  if (existing) {
    res.status(400).send("Character already exist")
  } else {
    let character = await client.db("Assignment").collection("characters").insertOne({
      name: req.body.character_name,
      health: req.body.health,
      attack: req.body.attack,
      defense: req.body.defense,
      type: req.body.type,
      character_power: req.body.character_power
    });
    res.send(character);
    }
  }
)

app.post('/login',async(req,res) => { 
  let resp = (await client.db("Assignment").collection("users").findOne({
    name: req.body.username
})    
)||(
    await client.db("Assignment").collection("users").findOne({
    email: req.body.email
    }));

console.log(resp);
console.log(req.body);

  if(!resp){
    res.send('User not found');
  }else{
   // Check if password is provided
if (req.body.password) {
  if (bcrypt.compareSync(req.body.password, resp.password)) {
    res.send('Login successful');
  } else {
    res.send('Wrong Password');
  }
} else {
  // Handle case where password is not provided
  // This is where you might decide to return an error or a specific message
  res.send('Password field is missing');
}
  }
  
})

//get read user profile
app.get('/read/:id',async(req,res) => {
  
  let rep = await client.db("Assignment").collection("users").findOne({
    //username: req.params.username
    _id: new ObjectId(req.params.id)
  
  });
    
    res.send(rep);
    console.log(req.params);
    //console.log(rep);
})

app.patch('/chest_update/:chestname',async(req,res) => {
  let existing_chest = await client.db("Assignment").collection("chests").findOne({
    chest: req.params.chestname
  });

  if(existing_chest){
    let new_chest = await client.db("Assignment").collection("chests").updateOne({
      chest: req.params.chestname
    },{
      $set:{
        chest: req.body.chest_name,
        price: req.body.price
      }
    });
    console.log(existing_chest);
    console.log(new_chest);
    res.send('Chest updated successfully');
  }else{
    res.send('Chest not found');
  }
})

app.patch('/add_character_to_chest/:chestId',async(req,res) => {
  const Character = req.body.character_name;

  const existingChest = await client.db("Assignment").collection("chests").findOne({
    _id: new ObjectId(req.params.chestId)
  });

  const existingCharacter = await client.db("Assignment").collection("characters").findOne({
    name: Character
  });

  if(Array.isArray(Character)){

    if (!existingCharacter && !existingChest) {
         res.status(400).send("Chest or character does not exist")
    } else {
          let character_power_level = 0;

          for (const character of Character) {
            let individual_character_power = await client.db("Assignment").collection("characters").findOne({
              name: character
            });
            character_power_level += individual_character_power.character_power;
          }
          
          if(existingChest.total_power_level){
            character_power_level = character_power_level + existingChest.total_power_level;
          };

          let chest = await client.db("Assignment").collection("chests").updateOne({
            _id: new ObjectId(req.params.chestId)
          },{
            $set:{
              total_power_level: character_power_level
            },
            $addToSet:{
              characters:{
                $each:Character
              }
            }
          });
          res.send({message: 'Characters added to chest'});
          }
  }else{
        if (!existingChest && !existingCharacter) {
          res.status(400).send("Chest or Character does not exist")
        } else {
          let character_power_level = 0;
            let individual_character_power = await client.db("Assignment").collection("characters").findOne({
              name: req.body.character_name
            });
            character_power_level += individual_character_power.character_power;
        
          let chest = await client.db("Assignment").collection("chests").updateOne({
            _id: new ObjectId(req.params.chestId)
          },{
            $set:{
              total_power_level: character_power_level
            },
            $addToSet:{
              //chest: req.body.chest_name,
              characters:req.body.character_name
            }
          });
          res.send({message: 'Character added to chest'});
          }
  }
  
  }
)

app.patch('/characterupdate/:charactername',async(req,res) => {
  let existing = await client.db("Assignment").collection("characters").findOne({
    name: req.params.charactername
  });
  if (!existing) {
    res.status(400).send("Character does not exist")
  } else {
    let character = await client.db("Assignment").collection("characters").updateOne({
      name: req.params.charactername
    },{
      $set:{
        health: req.body.health,
        attack: req.body.attack,
        defense: req.body.defense,
        type: req.body.type,
        character_power: req.body.character_power
      }
    });
    res.send(character);
    }
  }
)

app.patch('/addfriend/:username',async(req,res) => {
    // Assuming req.body.friends is an array of friend names
  const friends = req.body.friend;

  // Check if friends array is provided and not empty
  if (!Array.isArray(friends) || friends.length === 0) {

      let existing = await client.db("Assignment").collection("users").findOne({
        name: req.body.friend
      });

      if (existing) {
        //if array of friends not provded
        let friend_addition = await client.db("Assignment").collection("users").updateOne({
          name: req.params.username
        },{
          $addToSet: {
            friends:  req.body.friend
          }
        });

        let friend_addition2 = await client.db("Assignment").collection("users").updateOne({
          name:req.body.friend
        },{
          $addToSet: {
            friends: req.params.username
          }
        });
        
        res.send("friend added successfully");
        console.log(friend_addition,friend_addition2);
        
      } else {
        res.status(400).send("User does not exist")
      }
      
  }else{
     //array of friends is present
      for (const friend of friends) {
        let existing = await client.db("Assignment").collection("users").findOne({
          name: friend
        });

        if (!existing) {
          return res.status(400).send(`User ${friend} does not exist`);
        }

        let friend_addition = await client.db("Assignment").collection("users").updateOne({
          name: req.params.username
        }, {
          $addToSet: {
            friends: friend
          }
      });
        let friend_addition2 = await client.db("Assignment").collection("users").updateOne({
            name:friend
          },{
            $addToSet: {
              friends: req.params.username
            }
        });
    }
    
    // Send a response after all friends have been added
    res.send({ message: 'Friends added successfully' });
  }
 
})

//update user profile
app.patch('/update/:id',async(req,res) => {
      //might need to update the part if they want to change the password , must hash the new password
      let require = await client.db("Assignment").collection("users").updateOne({
        _id: new ObjectId(req.params.id)
      },{
        $set:{
          name: req.body.username,
          email: req.body.email,
          gender: req.body.gender
        }
      });

      res.send(require);
    console.log(req.body);
})

app.patch('/buying_chest/:username',async(req,res) => {
  let user_existing = (await client.db("Assignment").collection("users").findOne({
    name: req.params.username
  
}))||(await client.db("Assignment").collection("users").findOne({
  email: req.params.username
}));

  let chest_existing = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.collection  
  })
  console.log(user_existing,chest_existing);

  if (user_existing && chest_existing){
    let buying = await client.db("Assignment").collection("users").updateOne({$or:[{
      //filter by username or email
      name: req.params.username
    },{
      email: req.params.username
    }]},{
      //operation
      $set:{
        collection: req.body.collection
      }
      
    });
    console.log(buying);
    console.log(req.body);
  }else{
    res.status(400).send('User or chest not found');
  }
  
})

app.patch('/money_generator/:username',async(req,res) => {
  const min = 1000;
  const max = 2000;
  const newMoneyAmount = Math.floor(Math.random() * (max - min + 1)) + min;

  let user_existing = await client.db("Assignment").collection("users").findOne({
    name:req.params.username
  });

  if(user_existing){ 
    let money = await client.db("Assignment").collection("users").updateOne({
      name: req.params.username
    },{
      $set:{
        money: newMoneyAmount
      }
    });
    res.send(`Amount: RM ${newMoneyAmount} is given to ${req.params.username}`);
    console.log(money);
  }else{
    res.status(400).send('User not found');
  }

})

app.patch('/battle/:id_1/:id_2',async(req,res) => {
    
})

//delete user profile
app.delete('/delete/:id',async(req,res) => {
  let delete_req = await client.db("Assignment").collection("users").deleteOne({
    _id: new ObjectId(req.params.id)
  });
  res.send(delete_req);
  console.log(req.params);  
})

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://samuel:yeehai@benr2423.jgm92s9.mongodb.net/?retryWrites=true&w=majority&appName=BENR2423";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
