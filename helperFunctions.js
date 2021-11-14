const bcrypt = require("bcryptjs");
const usersDatabase = require("./data/usersdb");
const urlDatabase = require("./data/urldb");

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

module.exports = {
  generateRandomString,
  addNewUser,
  checkEmailExists,
  getUserById,
  getUserByEmail,
  urlsForUser,
  getEmailFromId
};