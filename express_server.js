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
  let userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(userPassword, 10);
  usersDatabase[userID] = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };
  return userID;
}
function checkIdExists(userID) {
  if (userID in usersDatabase) {
    return true;
  } else if (userID in urlDatabase) {
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

function getUserById(userID) {
  return usersDatabase[userID];
}

function getUserByEmail(userEmail) {
  for (id in usersDatabase) {
    if (usersDatabase[id]['email'] === userEmail) {
      return usersDatabase[id];
    }
  }
}
function urlsForUser(id) {
  let userUrls = { };
  for (shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl]['userID'] === id) {
      userUrls[shortUrl] = {...urlDatabase[shortUrl]};
    }
  }
  return userUrls;
}
const getEmailFromId = (user_id) => {
  if(usersDatabase[user_id]) {
    return usersDatabase[user_id].email;
  }
};


app.get("/", (req, res) => {
  if(req.session.user_id){
  res.redirect ('/urls/new');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req,res) => {
 
  const templateVars = {
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


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.session.user_id , email: getEmailFromId(req.session.user_id), user:getUserById(req.session.user_id) };
    let user_id = req.session.user_id;
    if(user_id){
      res.render("urls_new", templateVars);
    }else{
      res.status(403).redirect("/login");
    }
  });

  app.get("/urls/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL;
    if (!req.session.user_id) {
      return res.redirect('/login');
    } else if (req.session.user_id !== urlDatabase[shortURL].userID) {
     res.status(400);
    }
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user_id: getUserById(req.session.user_id), email: getEmailFromId(req.session.user_id) };
    return res.render("urls_show", templateVars);
  });









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











app.post('/urls/:shortURL/delete', (req, res) => {

    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
 
});
app.post('/urls/:shortURL/', (req, res) => {
  if (req.session.user_id) {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL; 
    res.redirect("/urls"); 
  } else {
    let templateVars = { user: getUserById(req.session.user_id)};
    res.render("login", templateVars);
  }
});


app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect('/urls');
  }
  templateVars = {user_id: req.session.user_id, email: getEmailFromId(req.session.user_id)};
  res.render("login", templateVars);
});      

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

app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  const templateVars = {user_id: req.session.user_id, email: getEmailFromId(req.session.user_id) };
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
