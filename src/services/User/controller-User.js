const User_model = require('./model-User.js').User_model;
const SeekerBaseInfo= require('../seeker/model-seeker').SeekerBaseInfo;
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const console = require('console');
const { ENV } = require('../../config/env.js');
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.CLIENT_ID)

/**
 * @param {*}salt  - For password hashing algorithm
 * @param {*} privKeyPath - Private lic key path
 * @param {*} Priv_key - private key to creat signature of JWT
 **/
const salt = 8;
const privKeyPath = path.join(__dirname, '../..', 'id_rsa_priv.pem');
const Priv_key = fs.readFileSync(privKeyPath, 'utf8');

//**************************Generate token**************************************** */
function issueJwt(user) {

  const expiresIn = '24h'; 

  const payload = {
    id: user.id,
    iat: Math.floor(Date.now() / 1000),
    role: user.role
  };

  const signedToken = jsonwebtoken.sign(payload, Priv_key, {
    expiresIn: expiresIn,
    algorithm: 'RS256',
  });

  return signedToken;
  // return 'Bearer ' + signedToken;
}

function setToken(res,user){
  res.clearCookie("auth");
  const tokenObject = issueJwt(user);
  res.send({"tokenObject":tokenObject}).status(200)
  // .cookie("auth",tokenObject,{
  //   //httpOnly:true,
  //   sameSite: "none",
  //   secure: ENV == 'dev' ? false : true,
  // })
  
  //.redirect("https://litfair.herokuapp.com/hi")
  ;
}
const refreshJWT =async (req, res)=>{
    setToken(res,req.user)
}
const getAllUsers = async (req, res) => {
  console.log(req.user.id)
  let data = await User_model.findAll({});
  res.json(data);
};

const addUser = async (req, res,next) => {

  let email = null;
  let password = null;
  let provider = null;
  let external_id = null;
  let role= null;
  let fname =null;
  let lname = null;

  if(req.user){
    provider = req.user.provider;
    external_id = req.user.id;
    email = req.user.email;
    password = provider + external_id;
    role=="Seeker"
  } else {
    email = req.body.email;
    password = req.body.password;
    role = req.body.role;
  }
  bcrypt.hash(password, salt, async (err, hash) => {
     try{ 
        const user= await User_model.
        create({
          email,
          password: hash,
          role,
          external_type: provider,
          external_id
        }).then(
          (user) => { 
        req.body.id=user.id;
        req.body.tokenObject=issueJwt(user)
        //create new seeker
        next();
      })
    }
     catch(err){
      res.status(400).send({ msg: err.message });
     };
  });

  
};

const login = (req, res) => {
 
  const email = req.body.email;
  const password =req.body.password;
  
  User_model.findOne({ where: { email: email } })
    .then(async (user) => {
      if (user) {
        const matches = await bcrypt.compare(password, user.password);
        if (matches) {
             setToken(res,user)
        } else {
          res.status(401).json({ msg: 'Invalid email or password' });
        }
      } else {
        res.status(401).json({ msg: 'Invalid email or password' });
      }
    })
    .catch((err) => {
      res.status(500).json({ msg: err.message});
    });
  }

const googleLogin = (req, res) => {
    try{
     setToken(res,req.user)
    }
    catch(err){
      res.status(500).send({ msg: err.message})
    }
}
const logout =(req, res) => {
  res.clearCookie("auth");
  res.sendStatus(200)
}

module.exports = { getAllUsers,refreshJWT, addUser, login,googleLogin, logout };