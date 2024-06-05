const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())

app.post('/register',async(req,res)=>{
    let existing  = await client.db('Restful_API').collection('lab3').findOne({
        name: req.body.username
    });

    if(existing){
        res.status(400).send('username already exist')
    }else{
        let result = await client.db("Restful_API").collection("lab3").insertOne({
            name: req.body.username,
            password: req.body.password,
            gender: req.body.gender,
            faculty: req.body.faculty
        });
    res.send(result);
    }
})

app.get('/readingUserInfo',async(req,res)=>{
    let result = await client.db("Restful_API").collection("lab3").find().toArray();
    if(!result){
        res.send('no data found');
    }else{
        res.send(result);
    }
})

app.patch('/updateUserInfo/:id',async(req,res)=>{
    let result = await client.db("Restful_API").collection("lab3").updateOne({
        _id : new ObjectId(req.params.id)
    },{
        $set:{
            name: req.body.username,
            password: req.body.password,
            gender: req.body.gender,
            faculty: req.body.faculty
        }
    }); 

    if(!result){
        res.send('no data found');
    }else{
        res.send(result);
    }
})

app.delete('/deleteUserInfo/:id',async(req,res)=>{
    let result = await client.db("Restful_API").collection("lab3").deleteOne({
        _id : new ObjectId(req.params.id)
    });
    res.send(result);
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
      //await client.close();
    }
  }
  run().catch(console.dir);
  