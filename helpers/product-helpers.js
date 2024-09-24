const { Collection } = require('mongodb')
var db=require('../Config/connection')
var collection=require('../Config/collections')
const ObjectId= require('mongodb').ObjectId;
module.exports={

    addProduct:(product,callback)=>{
       console.log(product) 
       db.get().collection('product').insertOne(product).then((result)=>{
       
        callback(result.insertedId)
       //callback(data.ops[0]._id)
       })
       .catch((err) => {
        console.error('Error inserting product:', err);
        callback(null, err);
    });
    },
    getAllProducts:()=>{
return new Promise(async(resolve,reject)=>{
    let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
    resolve(products)
})
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .deleteOne({ _id: new ObjectId(proId) })  // Use 'new' keyword
                .then((response) => {
                    console.log(response);
                    resolve(response);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(proId) })
            .then((product) => {
              resolve(product);
            })
            .catch((err) => {
              reject(err);
            });
        });
      },
      updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({ _id: new ObjectId(proId) }, {
              $set: {
                Name: proDetails.Name,
                Description: proDetails.Description,
                Price: proDetails.Price,
                Category: proDetails.Category
              }
            })
            .then((response) => {
              resolve(response);
            })
            .catch((err) => {
              reject(err);
            });
        });
      }
}