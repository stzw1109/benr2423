const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); 

app.post('/', (req, res) => { 
    res.send(req.body);
});

app.get('/', (req, res) => {
    res.send('POSTMAN GET!')
});

app.listen(port, () => { 
    console.log(`Server listening at http://localhost:${port}`)
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://samuel:yeehai@benr2423.jgm92s9.mongodb.net/?retryWrites=true&w=majority&appName=BENR2423";
const client = new MongoClient(uri, {
 serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
 }
});

const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

async function run() {
    try {
        await client.connect();
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Hash the password
        const hashedPassword = await bcrypt.hash(myPlaintextPassword, saltRounds);

        // Compare the password with the hash
        const isMatch = await bcrypt.compare(myPlaintextPassword, hashedPassword);
        console.log(isMatch); // Should be true

        const isNotMatch = await bcrypt.compare(someOtherPlaintextPassword, hashedPassword);
        console.log(isNotMatch); // Should be false

        // Insert the hashed password into MongoDB
        let result = await client.db("testing").collection("file_1").insertOne({
            name: "pzy",
            password: hashedPassword
        });

        console.log(result);
    } catch (err) {
        console.error(err);
    } finally { n 
        await client.close();
    }
}

run().catch(console.dir);
