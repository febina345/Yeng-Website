 const { MongoClient } = require('mongodb');
 const state = {
     db: null
 };

 module.exports.connect = function (done) {
     const url = 'mongodb://localhost:27017';
     const dbName = 'shopping';

     MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
         .then((client) => {
             state.db = client.db(dbName);
             console.log('Successfully connected to the database:', dbName);
            done();
         })         .catch((err) => {
            console.error('Failed to connect to MongoDB:', err);
            done(err);
         });
 };
// const mongoClient=require('mongodb').MongoClient
// const state={
//     db:null
// }
// module.exports.connect=function(done){
//     const url='mongodb://localhost:27017'
//     const dbname='shopping'

//     mongoClient.connect(url,(err,data)=>{
//         if(err) return done(err)
//             state.db=data.db(dbname)
//         done()
//     })
// }
module.exports.get = function () {
    return state.db;
};
