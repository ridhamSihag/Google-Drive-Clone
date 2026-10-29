const express = require('express');
const router = express.Router();
const { body , validationResult } = require('express-validator');

router.get('/register' , (req,res) =>{
    res.render('register');
})

router.post('/register',(req,res)=>{
    console.log(req.body)
    res.send('User registered');

})



module.exports = router;
  