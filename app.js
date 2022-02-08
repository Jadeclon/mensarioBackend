const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const cors = require('cors');
var webPush = require('web-push');
const mysql = require('mysql');
require('dotenv').config();



const db = mysql.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
});

app.use(cors({
    //   origin: ["https://mensario.netlify.app"],
      origin: ["http://localhost:3000"],
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


if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)
{
    console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY "+
      "environment variables. You can use the following ones:");
    console.log(webPush.generateVAPIDKeys());
    return;
}

// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
    'https://serviceworke.rs/',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);



app.get("/vapidPublicKey", (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});


app.post("/register", (req, res) => {
    // A real world application would store the subscription info.
    res.sendStatus(201);
});

app.post("/sendNotification", (req, res) => {
    const subscription = req.body.subscription;
    const payload = req.body.payload;
    const options = {
      TTL: req.body.ttl
};



    setTimeout(function()
    {
      webPush.sendNotification(subscription, payload, options)
      .then(function() {
        res.sendStatus(201);
      })
      .catch(function(error) {
        console.log(error);
        res.sendStatus(500);
      });
    }, req.body.delay * 1000);
  });


// let vapidKeys = {
//       publicKey: 'BML-d_mtfTfGQnJChc-qPEIJ7w3x0j5p4smNp7GuImG0XuyvqU_lnUnzBeUAPgm4HOIH17Le60zn44D1DBj-9Tg',  
//       privateKey: 'Lkh3A3K5IpcbyKr8eKJ-3SdMVe4yoRTy-AXZn09RcL4'
// }


// app.post('/notification', (req, res) => {


//       const endpoint = req.body.endpoint;
//       const p256dh = req.body.p256dh;
//       const auth = req.body.auth;
//       const userId = req.body.userId;

//       push.setVapidDetails('mailto:test@code.co.uk', vapidKeys.publicKey, vapidKeys.privateKey);

//       let sub = {
//             endpoint: endpoint,
//             expirationTime: null,
//             keys: {
//                   p256dh: p256dh,
//                   auth: auth
//             }
//       };

//       var options = {
//             gcmAPIKey: 'AIzaSyD1JcZ8WM1vTtH6Y0tXq_Pnuw4jgj_92yg',
//             TTL: 60
//           };

//       push.sendNotification(sub, 'test message', options).then( () => {
//             console.log("Notification should work!");
//       })
//       .catch((err) => {
//             console.log(err);
//       });


//       const sql = `INSERT INTO users (endpoint, p256dh, auth) VALUES (?,?,?) WHERE userId = ?`;

//       db.query(sql, [endpoint, p256dh, auth, userId], (err, result) => {

//             if(err) { console.log(err) } else {

//                   res.send("Result: " + result);
//             }
            
//       });
// });


// app.get('/blabla', (req, res) => {

//       console.log("blabla!!!")

//       if (Notification.permission == 'granted') {
//             navigator.serviceWorker.getRegistration().then(function(reg) {
//                   reg.showNotification('Hello world!');
//             });
//       }
// });



// let vapidKeys = push.generateVAPIDKeys();

// console.log(vapidKeys);



app.post('/api/insert', (req, res) => {

      const id = req.body.id;
      const name = req.body.name;
      const city = req.body.city;
      const address = req.body.address;
      const lat = req.body.lat;
      const lng = req.body.lng;
      console.log("Type: " + typeof lat)
      const sql = `INSERT INTO canteens (id, name, city, address, lat, lng) VALUES (?,?,?,?,?,?)`;
      // try {
            db.query(sql, [id, name, city, address, lat, lng], (err, result) => {

                  if (err) {
                        console.log(err);
                  }
                  else {
                        res.send("Sucessfully inserted canteen "+ id + "!")
                        console.log("Sucessfully inserted canteen "+ id + "!");
                        // console.log(result);
                  }

                  console.log("Result: " + result);
            });
      // } catch (e) {
      //       console.log(e);
      // }
});


app.get("/getCanteens", (req, res) => {
      // if(!req.session.user) { return res.send("You are not logged in!"); }
      
      const sql = `SELECT * FROM canteens`;

      db.query(sql, (err, result) => {
            res.send(result);
      });
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
                        if(err.sqlMessage.includes("Duplicate"))
                        {
                              res.send({ msg: err.sqlMessage, loggedIn: false });
                        }
                  }
                  else {
                        console.log("Sucessfully inserted new user!");
                        res.send({ msg: "Signed up successfully!", loggedIn: true});
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

      db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {

                  if(err) { console.log }

                  if(result.length > 0) {
                        if(password === result[0].password) {
                              req.session.user = result;
                              req.session.user[0].password = "?";
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

app.post("/logout", (req, res) => {
      delete req.session.user;
      loggedIn = false;
      res.send("Logout");
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