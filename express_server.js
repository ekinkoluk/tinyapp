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
  let user_id = generateRandomString();
  usersDatabase[user_id] = {
    id: user_id,
    email: userEmail,
    password: userPassword
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


function getUserById(userId) {
  return usersDatabase[userId];
}

function getUserByEmail(userEmail) {
  for (id in usersDatabase) {
    if (usersDatabase[id]['email'] === userEmail) {
      return usersDatabase[id];
    }
  }
}
function checkEmailExists(userEmail) {
  for (id in usersDatabase) {
    if (usersDatabase[id]['email'] === userEmail) {
      return true;
    }
  }
  return false;
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
    user: getUserById(req.cookies.user_id)
  };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req,res) => {
  const templateVars = {
    urls: urlDatabase,
    user: getUserById(req.cookies["user_id"])
  };
  res.render("urls_index", templateVars);
  
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
    
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user_id: req.cookies["user_id"] };
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
  templateVars = {user: getUserByEmail(req.cookies.user_id)};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  let u_email = '';
  let u_password = '';
  for (let user in usersDatabase) {
    if (usersDatabase[user]['email'] === req.body.email && req.body.password === usersDatabase[user]['password']) {
      u_email = req.body.email;
      u_password = req.body.password;
      res.cookie("user_id", getUserByEmail(u_email)["id"]); 
    }
  }
  
  res.redirect('/urls');
});

app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  const templateVars = {user: getUserById(req.cookies.user_id)};
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
    let userId = addNewUser(email, password);
  }

    // Set up user ID cookie
  res.cookie("user_id", getUserByEmail(email)["id"]);
   res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
