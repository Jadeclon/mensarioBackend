const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const cors = require('cors');
var push = require('web-push');
const mysql = require('mysql');
require('dotenv').config();



const db = mysql.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
});

app.use(cors({
      origin: ["https://mensario.netlify.app"],
      // origin: ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT"],
      credentials: true
}));
app.use(express.json());
app.use(
      express.urlencoded({
            extended: true
      })
);
app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
            key: "userId",
            secret: "important",
            resave: false,
            saveUninitialized: false,
            cookie: {
                  expires: 3600000,
            },
      })
);




let vapidKeys = {
      publicKey: 'BML-d_mtfTfGQnJChc-qPEIJ7w3x0j5p4smNp7GuImG0XuyvqU_lnUnzBeUAPgm4HOIH17Le60zn44D1DBj-9Tg',  
      privateKey: 'Lkh3A3K5IpcbyKr8eKJ-3SdMVe4yoRTy-AXZn09RcL4'
      }

push.setVapidDetails('mailto:test@code.co.uk', vapidKeys.publicKey, vapidKeys.privateKey);

let sub = {"endpoint":"https://fcm.googleapis.com/fcm/send/eyszhsQ8hl0:APA91bErdhqftt63urpo9U6n-gbofUe88TfBm-dwR9Ee4IBy3dkph56PJDpOZnxKueuZ2iCjNT0VM4zH9AaX5NhjTWuxn4vlZwl0Gcv-NMShhoARIsc_erOrOfgtC9Ge71vSgcloMALZ","expirationTime":null,"keys":{"p256dh":"BCQkYDh-6_nuKj77EY0fm4q56TNSpe-gBFLY-Q0zWSg2dWHJ46kz4UbKBOnRnqYLgnI25gPw_Yw18gWodzctIR0","auth":"861x-f2gT5cLXeotlQ1VsA"}}
push.sendNotification(sub, 'test message');


// let vapidKeys = push.generateVAPIDKeys();

// console.log(vapidKeys);


app.get('/api/get', (req, res) => {
      const sql = `SELECT * FROM articles`;

      db.query(sql, (err, result) => {
            res.send(result);
      });
});


app.post('/api/insert', (req, res) => {

      const id = req.body.id;
      const name = req.body.name;
      const city = req.body.city;
      const address = req.body.address;
      const sql = `INSERT INTO canteens (id, name, city, address) VALUES (?,?,?,?)`;
      try {
            db.query(sql, [id, name, city, address], (err, result) => {

                  if (err) {
                        console.log(err);
                  }
                  else {
                        console.log("Sucessfully inserted! aaa");
                        // console.log(result);
                  }
            });
      } catch (e) {
            console.log(e);
      }
});

app.post('/api/signup', (req, res) => {

      const username = req.body.username;
      const password = req.body.password;
      const role = req.body.role;
      const sql = `INSERT INTO users (username, password, role) VALUES (?,?,?)`;
      try {
            db.query(sql, [username, password, role], (err, result) => {

                  if (err) {
                        console.log(err);
                  }
                  else {
                        console.log("Sucessfully inserted new user!");
                        // console.log(result);
                  }
            });
      } catch (e) {
            console.log(e);
      }
});


app.post('/login', (req, res) => {
      const username = req.body.username;
      const password = req.body.password;

      db.query("SELECT * FROM users WHERE username = ?",
            [username], (err, result) => {

                  if(err) { console.log }

                  if(result.length > 0) {
                        if(password === result[0].password) {
                              req.session.user = result;
                              req.session.user[0].password = "looser";
                              // console.log(req.session.user[0]);
                              loggedIn = true;
                              res.send({ msg: "Logged in successfully!", loggedIn: true, user: req.session.user[0] });
                              // res.send("Logged in successfully!");
                        } else {
                              res.send({ msg: "Wrong username/password combination!"});
                        }
                  } else {
                        res.send({ msg: "Wrong username/password combination!"});
                  }
            }
      );
});


app.get("/login", (req, res) => {
      if(req.session.user) {
            loggedIn = true;
            res.send({ loggedIn: true, user: req.session.user[0] });
      } else {
            res.send({ loggedIn: false });
      }
});


app.delete('/api/delete/:articleId', (req, res) => {
      const articleId = req.params.articleId;
      const sql = `DELETE FROM articles WHERE articleId = ?`;

      db.query(sql, articleId, (err, result) => {
            console.log("Sucessfully deleted!");
            console.log(result);

            if (err) console.log(err);
      });
});


app.put('/api/updateUser', async (req, res) => {
      const userId = req.body.userId;
      const favoriteCanteen = req.body.favoriteCanteen;
      const favoriteMeal = req.body.favoriteMeal;
      const sql = `UPDATE users SET favoriteCanteen = ?, favoriteMeal = ? WHERE userId = ?`;
      

      db.query(sql, [favoriteCanteen, favoriteMeal, userId], (err, result) => {
            console.log("Sucessfully updated user!");
            if (err) console.log(err);
      });
});


app.listen(process.env.PORT || 5000, () => {
      console.log(`Running on port ${process.env.PORT}...`);
});