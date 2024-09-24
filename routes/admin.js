var express = require('express');
const { ObjectId } = require('mongodb')
const { helpers } = require('handlebars');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');


/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    console.log(products);
    res.render('admin/view-products',{admin:true,products});
  })
  

});
router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})

router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.Image);

  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.Image
    console.log(id);
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-product")
      }else{
        console.log(err)
      }
    })
   
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
 
})
// GET edit product
router.get('/edit-product/:id', async (req, res) => {
  try {
    const proId = req.params.id;
    if (!ObjectId.isValid(proId.toString())) {
      return res.status(400).send('Invalid product ID');
    }
    let product = await productHelpers.getProductDetails(proId);
    res.render('admin/edit-product', { product });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).send('Internal server error');
  }
});

// POST update product
router.post('/edit-product/:id', (req, res) => {
  try {
    const proId = req.params.id;
    if (!ObjectId.isValid(proId.toString())) {
      return res.status(400).send('Invalid product ID');
    }

    productHelpers.updateProduct(proId, req.body).then(() => {
      if (req.files && req.files.Image) {
        let image = req.files.Image;
        image.mv('./public/product-images/' + proId + '.jpg', (err) => {
          if (!err) {
            res.redirect('/admin');
          } else {
            console.error('Error uploading image:', err);
            res.status(500).send('Error uploading image');
          }
        });
      } else {
        res.redirect('/admin');
        if(req.files.Image){
          let image=req.files.Image
          image.mv('./public/product-images/' + proId + '.jpg')  
        }
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Internal server error');
  }
});
module.exports = router;
