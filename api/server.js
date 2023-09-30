const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require("fs");
const cors = require("cors");
const jwt = require('jsonwebtoken')
app.use(bodyParser.json());
app.use(cors());
const port = 3001;
let x = 1;
const secret = 'yomama'

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(authHeader){
    // Verify Token
    const token = authHeader;
    jwt.verify(token, secret, (err, user) =>{
      if(err){
        return res.sendStatus(403);
      }
      req.user = user
      next();
    });
  }
  else{
    console.log('error is here my friend')
    res.status(401);
  }
}

app.get('/profile' , authenticateJWT , (req, res) =>{
  res.json({
    username : req.user.username
  })
})


app.post('/signup' ,   (req, res) =>{
  const { username, password } = req.body;
  fs.readFile("database.json", "utf8", (err, data) => {

    if (err) throw err;

    const users = JSON.parse(data);

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }
    const newUser = {
      id: Math.floor(Math.random() * 1000),
      username: username,
      password: password,
    };
    users.push(newUser);
    fs.writeFile("database.json", JSON.stringify(users), (err) => {
      if (err) throw err;
      const token = jwt.sign({ username: newUser.username, id: newUser.id }, secret);
      res.status(201).json({msg : 'success' ,  token });
    });
  });
})

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  console.log('control reaches here and we are fine');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = decoded;
    next();
  });
};
app.use('/todo/:username', verifyToken);

app.post('/signin' , (req, res) =>{
  const { username, password } = req.body;

  fs.readFile("database.json", "utf8", (err, data) => {
    if (err) throw err;

    const users = JSON.parse(data);

    const user = users.find(u => u.username === username);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username, id: user.id }, secret);

    res.status(201).json({msg : 'success' ,  token });
  });
})



app.listen(port, () =>{
  console.log(`App listening on port ${port}`)
});


