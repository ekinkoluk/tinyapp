const PORT = 8080; // default port 8080
const express = require("express");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const app = express();

app.use(cookieSession({
  name: 'session',
  keys :['key1', 'key2']
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const usersDatabase = { };




function generateRandomString() {
  let randomString = '';
  const characterList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let x = 0; x < 6; x += 1) {
    randomString += characterList.charAt(Math.floor(Math.random() * characterList.length));
  }
  return randomString;
}

function addNewUser(userEmail, userPassword) {
  let user_id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(userPassword, 10);
  usersDatabase[user_id] = {
    id: user_id,
    email: userEmail,
    password: hashedPassword
  };
  return user_id;
}
function checkIdExists(userId) {
  if (userId in usersDatabase) {
    return true;
  } else if (userId in urlDatabase) {
    return true;
  }
  return false;
}
function checkEmailExists(userEmail) {
  for (id in usersDatabase) {
    if (usersDatabase[id]['email'] === userEmail) {
      return true;
    }
  }
  return false;
}

function getUserById(userId) {
  return usersDatabase[userId];
}

function getUserByEmail(userEmail) {
  for (id in usersDatabase) {
    if (usersDatabase[id]['email'] === userEmail) {
      console.log("hey",urlDatabase);
      return usersDatabase[id];
    }
  }
}
function urlsForUser(id) {
  let userUrls = { };
  for (shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl]['userId'] === id) {
      userUrls[shortUrl] = {...urlDatabase[shortUrl]};
    }
  }
  return userUrls;
}

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if(urlDatabase[shortURL] === false) {
    res.sendStatus(404);
  }
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  if(req.session.user_id){
  res.redirect ('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: req.session.user_id };
    let user_id = req.session.user_id;
    if(user_id){
      res.render("urls_new", templateVars);
    }else{
      res.status(403).redirect("/login");
    }
    
    
 
});


app.get("/urls", (req,res) => {
  const templateVars = {
    urls: urlDatabase,
    user: req.session.user_id
  };
  res.render("urls_index", templateVars);
  
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
    
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: getUserById(req.cookies.user_id) };
  res.render("urls_show", templateVars);
});


app.post('/urls/:shortURL/delete', (req, res) => {

    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
 
});
app.post('/urls/:shortURL/', (req, res) => {
  
    urlDatabase[req.params.shortURL] = req.body.longURL;
    res.redirect('/urls');
  
});

app.get("/login", (req, res) => {
  templateVars = {user: req.session.user_id};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  let u_email = '';
  let u_password = '';
  for (let user in usersDatabase) {
    if (usersDatabase[user]['email'] === req.body.email && bcrypt.compareSync(req.body.password === usersDatabase[user]['password'])) {
      u_email = req.body.email;
      u_password = req.body.password;
      req.session.user_id = usersDatabase[user]['id'];
    }
    else{
      res.sendStatus(403);
    }
  }
  if(!checkEmailExists(u_email)){
      res.sendStatus(403);
  }
  
  res.redirect('/urls');
});

app.post("/logout", (req,res) => {
  res.session = null;
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  const templateVars = {user: req.session.user_id, users:usersDatabase};
  if(req.session.user_id){
    res.redirect('/urls/');
  }
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password =req.body.password;
  if (email === "" || password === "") {
    res.status(400).send('<h1>Error!</h1> <p>You need to enter values for email and password.</p>');
  } else if(checkEmailExists(email)){
    res.status(400).send('<h1>Error!</h1> <p>This email already has an account. Try another one.</p>');
  }else{
    req.session.user_id = addNewUser(email, password);
    res.redirect("/urls");
  }
});

   
  

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
