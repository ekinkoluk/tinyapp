const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('view engine', "ejs");
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const usersDatabase = { };
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
  let randomString = '';
  const characterList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let x = 0; x < 6; x += 1) {
    randomString += characterList.charAt(Math.floor(Math.random() * characterList.length));
  }
  return randomString;
}

function addNewUser(userEmail, userPassword) {
  let userID = generateRandomString();
  usersDatabase[userID] = {
    id: userID,
    email: userEmail,
    password: userPassword
  };
  return userID;
}

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req,res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render("urls_index", templateVars);
  
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
    
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
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
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username); // Saves the user's username to a username cookie
  res.redirect('/urls');
});

app.post("/logout", (req,res) => {
  res.clearCookie("username");
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  const templateVars = {username: req.body.username};
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password =req.body.password;
 
  let userId = addNewUser(email, password);
  console.log("usersadatabase" ,usersDatabase);
    // Set up user ID cookie
  res.cookie("userId", userId);
   res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
