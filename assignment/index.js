
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
          gender: req.body.gender,
          collection: req.body.collection,
          money: req.body.money
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
      chest: req.body.chest_name
    });
    res.send(chest);
    }
  }
)

app.patch('/chestupdate/:chestId',async(req,res) => {
  const Character = req.body.character_name;

  if(Array.isArray(Character)){

    let existing = await client.db("Assignment").collection("chests").findOne({
      _id: new ObjectId(req.params.chestId)
    });
    let existing2 = await client.db("Assignment").collection("characters").findOne({
      name: Character
    });

    if (!existing && !existing2) {
      res.status(400).send("Chest does not exist")
    } else {
      let chest = await client.db("Assignment").collection("chests").updateOne({
        _id: new ObjectId(req.params.chestId)
      },{
        $addToSet:{
          //chest: req.body.chest_name,
          characters:{
            $each:Character
          }
        }
      });
      res.send({message: 'Characters added to chest'});
      }
  }else{

    let existing = await client.db("Assignment").collection("chests").findOne({
      _id: new ObjectId(req.params.chestId)
    });
    let existing2 = await client.db("Assignment").collection("characters").findOne({
      name: Character
    });

    if (!existing && !existing2) {
      res.status(400).send("Chest does not exist")
    } else {
      let chest = await client.db("Assignment").collection("chests").updateOne({
        _id: new ObjectId(req.params.chestId)
      },{
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
      type: req.body.type
    });
    res.send(character);
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
        type: req.body.type
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

//update user profile
app.patch('/update/:id',async(req,res) => {

      let require = await client.db("Assignment").collection("users").updateOne({
        _id: new ObjectId(req.params.id)
      },{
        $unset:{
          friends: req.body.friends
        }
      });

      res.send(require);
    console.log(req.body);
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

    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    //insert one document with the said information
    /*let result = await client.db("testing").collection("file_1").insertOne({
        name: "Samuel",
        age: 20,
        gender:"male",
        faculty: "FTKEK"
      });
    */

   //to find the document with the said information
   /*
    let result = await client.db("testing").collection("file_1").find({name:'Samuel'},
    {
      //projection is used to select the fields to be displayed
      projection:{age:0,gender:0}
      }
        ).toArray();
   */ 
   
   //update a document with the said information
   /*
    let result = await client.db("testing").collection("file_1").updateOne(
      {_id:new ObjectId('660518d9aa2fa53121de3f66')},
      {
        $set:{
          faculty:'FTKEK',
          gender:'female'
        },
        //push must be used for array only
        $push:{
          faculty:'FKEKK',
          gender: 'male'
        }
        
      }
    );
    */
   //delete a document with the said information
   /*
    let result = await client.db("testing").collection("file_1").deleteOne(
      {
        _id:new ObjectId('65efc07a441e4b25a99534c0')
      }
    );
   */ 
   //console.log(result);
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
