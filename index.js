var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');

const passport = require('passport')
const initializePassport = require('./passport-config')

require('dotenv').config()

mongoose.connect(process.env.MONGODB_URI, {
    // mongoose.connect('mongodb://localhost/game-website-cloud', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;
var users = db.collection('users');

initializePassport(
    passport,
    (email) => {
        return db.collection('users').find({ email: email }).toArray()
    },
    (id) => {
        return db.collection('users').find({ _id: mongoose.Types.ObjectId(id) }).toArray()
    }
)

const app = express();

app.use(bodyParser.json())
app.use(express.static('.')) // you can find the static html files in this directory
app.use(bodyParser.urlencoded({ extended: true }))
app.use(flash())
app.use(session({
    secret: "abcdefg",
    resave: false, // do you want to resave session variables if nothing has changed
    saveUninitialized: false, // do you want to save empty values
}))
app.use(passport.initialize())
app.use(passport.session())

db.on('error', () => console.log('Error in connecting to the database'));
db.once('open', () => console.log('Connected to database'));

app.post("/sign_up", (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var password = req.body.password;

    var data = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": password,
        "games": []
    }

    db.collection('users').insertOne(data, (err, collection) => {
        if (err) {
            throw err;
        }
        console.log("Record inserted successfully.");
    });

    return res.redirect('sign-in.html');
})

app.get('/', async(req, res) => {
    p = await req.user
    if (p) { p = p[0] }
    return res.render('index.ejs', {
        user: p
    });
}).listen(process.env.PORT || 3000)

app.get('/login', (req, res) => {
    return res.redirect('sign-in.html');
})

app.post("/login", passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect('/');
})

app.get("/library", async(req, res) => {
    p = await req.user
    if (p) { p = p[0] }
    res.render('library.ejs', {
        user: p
    })
})

app.get("/cart", async(req, res) => {
    p = await req.user
    if (p) { p = p[0] }
    res.render('cart.ejs', {
        user: p
    })
})

app.post("/addtocart", async(req, res) => {

    p = await req.user
    if (p) { p = p[0] } else { return res.redirect('sign-in.html') }

    var g = p.games
    g.push(req.body)

    db.collection('users').updateOne({ email: p.email }, {
        $set: { "games": g }
    })

    res.render('cart.ejs', {
        user: p
    })
})

app.post("/removefromcart", async(req, res) => {

    p = await req.user
    if (p) { p = p[0] } else { return res.redirect('sign-in.html') }

    i = parseInt(req.body.num)
    var g = p.games
    g.splice(i, 1)

    db.collection('users').updateOne({ email: p.email }, {
        $set: { "games": g }
    })

    res.render('cart.ejs', {
        user: p
    })
})

app.get("/about-us", async(req, res) => {
    p = await req.user
    if (p) { p = p[0] }
    return res.render('about-us.ejs', {
        user: p
    })
})

console.log('Listening on PORT 3000' + process.env.PORT);