var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())


//e.g using for registration
app.post('/register',async(req,res) => {
  if(req.body.username == null || req.body.password == null){
      return res.status(401).send("Please enter username and password")
  };
  
  let existing  = await client.db("Restful_API").collection("user").findOne({
    name: req.body.username
  });

  if (existing) {
    res.status(400).send("username already exist")
  } else {
    const hash = bcrypt.hashSync(req.body.password, 10);

  let resq = await client.db("Restful_API").collection("user").insertOne({
        name: req.body.username,
        age: req.body.age,
        gender: req.body.gender,
        faculty: req.body.faculty,
        password: hash //req.body.password
    })
    res.send(resq);
  }
})

// user login api 
app.post('/login', async (req, res) => {
  // step #1: req.body.username ??
  if (req.body.username != null && req.body.password != null) {
    let result = await client.db("maybank2u").collection("users").findOne({
      username: req.body.username
    })

    if (result) {
      // step #2: if user exist, check if password is correct
      if (bcrypt.compareSync(req.body.password, result.password) == true) {
        // password is correct
        var token = jwt.sign(
          { _id: result._id, username: result.username, name: result.name },
          'passwordorangsusahnakhack'
        );
        res.send(token)
      } else {
        // password is incorrect
        res.status(401).send('wrong password')
      }

    } else {
      // step #3: if user not found
      res.status(401).send("username is not found")
    }
  } else {
    res.status(400).send("missing username or password")
  }
})

app.post('/login',async(req,res) => { 

      let resp = await client.db("Restful_API").collection("user").findOne({
        name: req.body.username
});
  console.log(resp);
  console.log(req.body);

      if(!resp){
        res.send('User not found');
      }else{
       // Check if password is provided
        if (req.body.password) {
          if (bcrypt.compareSync(req.body.password, resp.password)) {
            var token = jwt.sign({ _id: resp._id,username: resp.name, password:resp.password, gender: resp.gender}, 'digga',{expiresIn:"1h"});
            console.log(`login successful. Welcome ${resp.name}`);
            res.send(token);
            
          } else {
            res.send('Wrong Password');
          }
        } else {
          // Handle case where password is not provided
          // This is where you might decide to return an error or a specific message
          res.send('Password field is missing');
        }
      }
      
});

app.post('/buy',verifyToken,async(req,res)=>{
  const token = req.headers.authorization.split(" ")[1];
  console.log(`Token: ${token} `);

  // var decoded = jwt.verify(token, 'digga');
  console.log(req.identify);
  res.send(req.identify);
  

})

//get read user profile
app.get('/read/:id',async(req,res) => {
  const token = req.headers.authorization.split(" ")[1];
  var decoded = jwt.verify(token, 'digga');
  
  if(decoded._id == req.params.id){
    let rep = await client.db("Restful_API").collection("user").findOne({
      _id: new ObjectId(req.params.id)
    });
    res.send(rep);
    console.log(rep);
    console.log(req.params);
  }else{
    res.status(400).send('Unauthorized access');
  }
   
  //console.log(rep);
 })

//update user profile
app.patch('/update/:id',async(req,res) => {

      let require = await client.db("testing").collection("file_1").updateOne({
        _id: new ObjectId(req.params.id)
      },{
        $set:{
          username: req.body.username
        }
      });

      res.send(require);
    console.log(req.body);
})

//delete user profile
app.delete('/delete/:id',verifyToken,async(req,res) => {
  if(req.identify._id != req.params.id){
    res.status(400).send('Unauthorized access');
  }else{
    let delete_req = await client.db("Restful_API").collection("user").deleteOne({
    _id: new ObjectId(req.params.id)
  });
    res.send(delete_req);
    console.log(req.params);  
  }
})


app.get('/', (req, res) => {
   res.send('Testing for class!')
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

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, "digga", (err, decoded) => {
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
