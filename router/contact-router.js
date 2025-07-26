const express = require('express');



const router = express.Router();
const {contact} = require('../controllers/contactcontroller');

router.post("/contact",contact);




module.exports = router;