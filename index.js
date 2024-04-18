const bcrypt = require('bcrypt');
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())

//e.g using for registration
app.post('/register',async(req,res) => {
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


app.post('/login',async(req,res) => { 
      let resp = await client.db("Restful_API").collection("user").findOne({
        name: req.body.username
})
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
      
});

//get read user profile
app.get('/read/:id',async(req,res) => {
   /* console.log(req.params); 
     let resq = await client.db("testing").collection("file_1").find({
      name:req.params.username,
      email: req.params.email
    });

     res.send(resq);
*/
let rep = await client.db("testing").collection("file_1").findOne({
  //username: req.params.username
  _id: new ObjectId(req.params.id)

});
  res.send(rep);
  console.log(req.params);
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
app.delete('/delete/:id',async(req,res) => {
  let delete_req = await client.db("testing").collection("file_1").deleteOne({
    _id: new ObjectId(req.params.id)
  });
  res.send(delete_req);
  console.log(req.params);  
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
