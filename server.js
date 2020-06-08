if (process.env.NODE_ENV !=='production'){ //if in development
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
    passport,   //configuring passport
    email => users.find(user => user.email == email),    //finding user based on email
    id => users.find(user => user.id == id)
)

const users = [] //array to store users -> should be stored using MongoDB

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false})) //telling app that we want to take form and want to access them from inside request var in post method
app.use(flash())
app.use(session({ 
    secret: process.env.SESSION_SECRET,
    resave: false,   // dont resave if nothings changed
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method')) //override method for post/delete function


app.get('/',checkAuthenticated, (req, res) => { // /= home page , request and response variable
    res.render('index.ejs',{name: req.user.name})  //
})

app.get('/login', checkNotAuthenticated, (req,res) => {  //login page
    res.render('login.ejs')  
})

app.post('/login',checkNotAuthenticated,  passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req,res) => {  //login page / asynchronous code to use try catch
    res.render('register.ejs')  
})

app.post('/register',checkNotAuthenticated,  async(req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({    //pushing new user
            id: Date.now().toString(),
            name: req.body.name, //after .body refers to name field in ejs file
            email: req.body.email,
            password: hashedPassword

        })
        res.redirect('/login')
    }catch{
        res.redirect('/register')

    }
    console.log(users)

})

app.delete('/logout', (req, res)=> {
    req.logOut()
    res.redirect('/login')
})

function checkAuthenticated( req, res, next){  //middleware to see if user is logged in
    if (req.isAuthenticated()){
        return next() //if user is logged in, go to next function
    }

    res.redirect('/login')  //if user is not logged in, go to login page
}

function checkNotAuthenticated( req, res, next){    //middleware to see if user is loggen in
    if (req.isAuthenticated()){
        return res.redirect('/')   //if user is logged in, go to home page 
    }
    next()
}

app.listen(3000)