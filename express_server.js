const PORT = 8080; // default port 8080
const express = require("express");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const app = express();
const urlDatabase = require("./data/urldb");
const {
  generateRandomString,
  addNewUser,
  checkEmailExists,
  getUserById,
  getUserByEmail,
  urlsForUser,
  getEmailFromId
} = require('./helperFunctions');

app.use(cookieSession({
  name: 'session',
  keys :['key1', 'key2']
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");



//homepafe to login when not logged in

app.get("/", (req, res) => {
  if(req.session.user_id){
  res.redirect ('/urls');
  } else {
    res.redirect('/login');
  }
});

//display user URLS
app.get("/urls", (req,res) => {
 
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: getUserById(req.session.user_id),
    user_id: req.session.user_id,
    email: getEmailFromId(req.session.user_id)
  };
  if(req.session.user_id) {
    res.render("urls_index", templateVars);
  }else {
     res.redirect('/login');
  }
});

//creates a new shortURL
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  if(longURL === "") {
    res.status(400).send("<h1>Error!</h1> <p>You need to enter a url to shorten.<p>");
  }

  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL : longURL,
     userID: req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
});

//gets url database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//directs create a new URL page
app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.session.user_id , email: getEmailFromId(req.session.user_id), user:getUserById(req.session.user_id) };
    let user_id = req.session.user_id;
    if(user_id){
      res.render("urls_new", templateVars);
    }else{
      res.status(403).redirect("/login");
    }
  });

  //crated new URL
  app.get("/urls/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL;
    if (!req.session.user_id || req.session.user_id !== urlDatabase[shortURL].userID) {
      res.status(400).send("<h1>Error!</h1> <p>You do not have access to this page. Please login with another account.<p>");
    } else if (req.session.user_id !== urlDatabase[shortURL].userID) {
     res.status(400);
    }
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user_id: getUserById(req.session.user_id), email: getEmailFromId(req.session.user_id) };
    return res.render("urls_show", templateVars);
  });

  //deletes the shortURL
  app.post('/urls/:shortURL/delete', (req, res) => {
    if(!req.session.user_id || req.session.user_id !== urlDatabase[req.params.shortURL].userID){
      res.render("login", templateVars);
    } 
    
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
 
});

//redirects to shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if(urlDatabase[shortURL] === false) {
    res.sendStatus(404);
  }
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});




app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



//update URL
app.post('/urls/:shortURL/', (req, res) => {
  if (req.session.user_id) {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL; 
    res.redirect("/urls"); 
  } else {
    let templateVars = { user: getUserById(req.session.user_id)};
    res.render("login", templateVars);
  }
});

//login page
app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect('/urls');
  }
 let templateVars = {user_id: req.session.user_id, email: getEmailFromId(req.session.user_id)};
  res.render("login", templateVars);
});      

//login
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send("<h1>Error!</h1> <p>You need to enter values for email and password.<p>");
  } else if (checkEmailExists(email) === false) {
    res.status(403).send("<h1>Error!</h1> <p>Couldn't find an account with that email. Try again.</p>");
  } else if (bcrypt.compareSync(password, getUserByEmail(email)["password"])) {
    req.session.user_id = getUserByEmail(email)["id"];
    res.redirect("/urls");
  } else { // This will be triggered if the password is invalid
    res.status(401).send('<h1>Error!</h1> <p>Please check your email and password and try again.</p>');
  }
 
});

//logout
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect('/urls');
});

//register page
app.get("/register", (req, res) => {
  let templateVars = {user_id: req.session.user_id, email: getEmailFromId(req.session.user_id) };
  if(req.session.user_id){
    res.redirect('/urls/');
  }
  res.render("register", templateVars);
});

//register a new user
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
