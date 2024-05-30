const { MongoClient } = require('mongodb');

async function listDatabases(client) {
    databasesList = await client.db().admin().listDatabases();
  
    console.log("Databases:");
    databasesList.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
  }

async function main(){
    
    const uri = "mongodb+srv://samuel:yeehai@benr2423.jgm92s9.mongodb.net/?retryWrites=true&w=majority&appName=BENR2423";
    const client = new MongoClient(uri);

    try{
        await client.connect();
        console.log("Connected correctly to MongoDB");
        await listDatabases(client);

        //to find and project name,email and accounts of Leslie Martinez
        const result = await client.db("sample_analytics").collection("customers").aggregate([
            {
              '$match': {
                'name': 'Leslie Martinez'
              }
            }, {
              '$project': {
                'name': 1, 
                'email': 1, 
                'accounts': 1, 
                '_id': 0
              }
            }
          ]).toArray();
        console.log(result);
        
        //to find and project name,email and accounts of Leslie Martinez and lookup the account details
        let lookupResult = await client.db("sample_analytics").collection("customers").aggregate([
            {
              '$match': {
                'name': 'Leslie Martinez'
              }
            },{
              '$lookup': {
                'from': 'accounts', 
                'localField': 'accounts', 
                'foreignField': 'account_id', 
                'as': 'accountDetails'
              }
            }
          ]).toArray();
        console.log(lookupResult);
    }catch(e){
        console.error(e);
    }finally{
        await client.close();
    }
}

main().catch(console.error);