var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  console.log(user)
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products,user,cartCount });
  });
});

router.get('/login', (req, res) => {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{

     // Set cache control headers to prevent browser from caching the login page
    res.set('Cache-Control', 'no-store'); // Prevents caching
    res.render('user/login',{loginErr:req.session.loginErr});
    req.session.loginErr=false
  }
    
  
});

router.get('/signup', (req, res) => {
  res.render('user/signup');
});

router.post('/signup', (req, res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
console.log(response);
req.session.loggedIn=true
req.session.user=response
res.redirect('/')
  })
})
router.post('/login', (req, res) => {
  console.log("Login form data:", req.body); // Log the form data
  userHelpers.doLogin(req.body)
    .then((response) => {
      if (response.status) {
        console.log('Login successful:', response.user);
        req.session.loggedIn=true
        req.session.user=response.user
        res.redirect('/'); // Redirect to homepage after login success
      } else {
        req.session.loginErr="Invalid Username or Password"
        console.log('Login failed:', response.message);
        res.redirect('/login'); // Redirect back to login on failure
      }
    })
    .catch((err) => {
      console.error('Login error:', err);
      res.status(500).send('Login failed');
    });
});

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {
  try {
    let products = await userHelpers.getCartProducts(req.session.user._id);
    let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
    console.log(products);
   
    res.render('user/cart', { products, user: req.session.user._id, totalValue });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
});


router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log("api call")
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
  res.json({status:true})
  })
})
router.post('/change-product-quantity', (req, res, next) => {
  console.log('Request Body:', req.body);

  if (!req.body.user || !req.body.cart || !req.body.product) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  userHelpers.changeProductQuantity(req.body)
    .then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user);
      res.json(response);
    })
    .catch(next);
});

router.post('/remove-from-cart/:id', verifyLogin, (req, res) => {
  let cartId = req.session.user._id; // Get the user ID from session
  let productId = req.params.id;

  userHelpers.removeFromCart(cartId, productId)
    .then((response) => {
      if (response.status) {
        res.json({ status: true });
      } else {
        res.json({ status: false });
      }
    })
    .catch((err) => {
      console.error('Error removing product:', err);
      res.json({ status: false });
    });
});
router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
   res.json({status:true})
  })
  console.log(req.body)
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})

module.exports = router;
