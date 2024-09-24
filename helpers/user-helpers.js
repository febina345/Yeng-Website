const bcrypt = require('bcrypt');
var db = require('../Config/connection');
var collection = require('../Config/collections');
const { ObjectId } = require('mongodb');

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        const result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
        resolve(result.insertedId);
      } catch (error) {
        reject(error);
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email });

        if (user) {
          console.log("User found:", user);
          console.log("Form password:", userData.Password); // Log the password from form
          console.log("Hashed password from DB:", user.Password); // Log the hashed password from DB

          // Check if both values are present
          if (userData.Password && user.Password) {
            bcrypt.compare(userData.Password, user.Password)
              .then((status) => {
                if (status) {
                  console.log("Password match!");
                  resolve({ status: true, user });
                } else {
                  console.log("Password mismatch.");
                  resolve({ status: false, message: "Incorrect password" });
                }
              })
              .catch((err) => {
                console.log("Error in bcrypt.compare:", err);
                reject(err);
              });
          } else {
            console.log("Password data is missing.");
            resolve({ status: false, message: "Password data is missing" });
          }
        } else {
          console.log("User not found");
          resolve({ status: false, message: "User not found" });
        }
      } catch (err) {
        console.error("Login error:", err);
        reject(err);
      }
    });
  },

  addToCart: (proId, userId) => {
    let proObj = {
      item: new ObjectId(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
      if (userCart) {
        // Fix the comparison to properly compare ObjectId
        let proExist = userCart.products.findIndex(product => product.item.equals(new ObjectId(proId)))
        console.log(proExist)
        if (proExist != -1) {
          // If product exists, increment the quantity
          db.get().collection(collection.CART_COLLECTION)
            .updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(proId) },
              {
                $inc: { 'products.$.quantity': 1 }
              }
            ).then(() => {
              resolve()
            })
        } else {
          // If product doesn't exist, add the product to the cart
          db.get().collection(collection.CART_COLLECTION)
            .updateOne({ user: new ObjectId(userId) },
              {
                $push: { products: proObj }
              }
            ).then((response) => {
              resolve()
            })
        }
      } else {
        // If no cart exists, create a new one
        let cartObj = {
          user: new ObjectId(userId),
          products: [proObj]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    })
  },
 getCartProducts: (userId) => {
  return new Promise(async (resolve, reject) => {
    let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
      {
        $match: { user: new ObjectId(userId) }
      },
      {
        $unwind:'$products'
      },
      {
        $project:{
          item:'$products.item',
          quantity:'$products.quantity'
        }
      },
      {
        $lookup:{
          from:collection.PRODUCT_COLLECTION,
          localField:'item',
          foreignField:'_id',
          as:'product'
        }
      },
      {
        $project:{
          item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
        }
      }
    
    ]).toArray();
   
    
    // Check the structure of cartItems before resolving
    console.log(cartItems);
    resolve(cartItems);
  });
},
getCartCount:(userId)=>{
  return new Promise(async(resolve,reject)=>{
    let count=0
    let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
    if(cart){
         count=cart.products.length
    }
    resolve(count)
  })
},
changeProductQuantity: (details) => {
  details.count = parseInt(details.count);
  details.quantity = parseInt(details.quantity);

  if (!ObjectId.isValid(details.cart) || !ObjectId.isValid(details.product)) {
    return Promise.reject(new Error('Invalid ObjectId'));
  }

  return new Promise((resolve, reject) => {
    if (details.count === -1 && details.quantity === 1) {
      db.get().collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: new ObjectId(details.cart) },
          { $pull: { products: { item: new ObjectId(details.product) } } }
        )
        .then(() => {
          resolve({ removeProduct: true });
        })
        .catch(reject);
    } else {
      db.get().collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
          { $inc: { 'products.$.quantity': details.count } }
        )
        .then(() => {
          resolve({ status: true });
        })
        .catch(reject);
    }
  });
},
   removeFromCart: (cartId, productId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: new ObjectId(cartId) },
          {
            $pull: { products: { item: new ObjectId(productId) } }
          }
        )
        .then(() => {
          resolve({ status: true });
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
          {
            $match: { user: new ObjectId(userId) }
          },
          {
            $unwind: '$products'
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'product'
            }
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ['$product', 0] },
              price: { $toDouble: { $arrayElemAt: ['$product.Price', 0] } } // Convert Price to double
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$quantity', '$price'] } }
            }
          }
        ]).toArray();
        
        if (total.length > 0 && total[0].total) {
          console.log(total[0].total);
          resolve(total[0].total);
        } else {
          console.log('No total found for this user');
          resolve(0); // Return 0 if no total is found
        }
      } catch (error) {
        reject(error); // Handle any errors
      }
    });
  },
  
  placeOrder:(order,products,total)=>{
   return new Promise((resolve,reject)=>{
   console.log(order,products,total)
   let status=order['payment-method']==='COD'?'placed':'pending'
   let orderObj={
    deliveryDetails:{
      mobile:order.mobile,
      address:order.address,
      pincode:order.pincode
    },
    userId:new ObjectId(order.userId),
    paymentMethod:order['payment-method'],
    products:products,
    totalAmount:total,
    status:status,
    date:new Date()
   }

   db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
    db.get().collection(collection.CART_COLLECTION).deleteOne({user:new ObjectId(order.userId)})
    resolve()
   })
   })
  },
  getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
      console.log(cart)
      resolve(cart.products)
    })
  },
  getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      console.log(userId);
      let orders=await db.get().collection(collection.ORDER_COLLECTION)
      .find({userId:new ObjectId(userId)}).toArray()
      console.log(orders);
      resolve(orders)
    })
  },
  getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
       let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{_id:new ObjectId(orderId)}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item:'$products.item',
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        },
        {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
        }
       ]).toArray()
       console.log(orderItems)
       resolve(orderItems)
    })
  }
  

}
