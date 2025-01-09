
const clientSessions = require('client-sessions');
const authData = require("./modules/auth-service")

const express = require('express')
const app = express();
const legoData = require("./modules/legoSets");
const path = require('path')

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

legoData.initialize()
    .then(authData.initialize)
    .then(function () {
        server.listen(3000, function () {
            console.log(`app listening on: 3000`);
        });
    }).catch(function (err) {
        console.log(`unable to start server: ${err}`);
    });

    app.use(
        clientSessions({
          cookieName: 'session', // this is the object name that will be added to 'req'
          secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
          duration: 10 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
          activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
        })
      );

      app.use((req, res, next) => {
        res.locals.session = req.session;
        next();
        })

        function ensureLogin(req, res, next) {
            if (!req.session.user) {
              res.redirect('/login');
            } else {
              next();
            }
          }

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
require('pg'); // explicitly require the "pg" module
const Sequelize = require('sequelize');
const { error } = require('console');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/about', (req, res) => {
    res.render('about')
})

app.get('/monsters/collection', (req, res) => {

    legoData.getSetsByTheme(req.query.theme || "").then((value) => {
        console.log(value);
        res.render('sets', { legoSets: value })
        // console.log(value)
    })
        .catch((err) => {
            res.status(404).render('404', { message: "No Sets found for a matching theme" })
        })
})

app.get('/monsters/collection/:num', (req, res) => {

    legoData.getSetByNum(req.params.num).then((value) => {
        res.render("set", { set: value })
    })
        .catch((err) => {
            res.status(404).render('404', { message: "No Sets found for a specific set num" })
        })
})


app.get('/monsters/add', ensureLogin, (req, res) => { //route 1
    legoData.getAllThemes()
        .then((themeData) => {
            res.render('addSet', { themes: themeData });
        })
        .catch((error) => {
            res.status(404).render('404', { message: "error " });
        });
})

app.post('/monsters/add', ensureLogin, (req, res) => { // route 2

    const setData = req.body;
    setData.userName = req.session.user.userName;
    legoData.addSet(setData)
    .then(() => {
        
        console.log(setData);
            res.redirect('/monsters/collection');
        })
        .catch((err) => {

            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });

})

app.get('/monsters/edit/:num', ensureLogin, (req, res) => { //route 3
    setNum = req.params.num;
    Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([setData, themeData]) => {
            if (!setData) {
                res.status(404).render('404', { message: `Set with number ${setNum} not found` });
            } else {
                res.render('editSet', { themes: themeData, set: setData });
            }
        })
        .catch((err) => {
            res.status(404).render('404', { message: err.message });
        });
})

app.post('/monsters/edit',ensureLogin, (req, res) => { //route 4
    let monster_id = req.body.monster_id;
    let setData = req.body;

    legoData.editSet(monster_id, setData)
        .then((value) => {
            res.redirect('/monsters/collection')
        })
        .catch((err) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
        })
})

app.get('/monsters/delete/:num',ensureLogin, (req, res) => { //route 5
    let monster_id = req.params.num;
    legoData.DeleteSet(monster_id)
        .then(() => {
            res.redirect('/monsters/collection')
        })
        .catch(() => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
        })

})


// new routes
app.get('/login', (req,res)=>{
    res.render("login");
})

app.get('/register', (req, res) =>{
    res.render("register");
})

app.post('/register', (req, res)=>{
    const userData = req.body;
    authData.registerUser(userData)
    .then(()=>{
        res.render("register", {successMessage: "User created"});
    })
    .catch((err)=>{
        res.render("register", {errorMessage: err, userName: req.body.userName})
    })
})

app.post('/login', (req,res) => {
    req.body.userAgent = req.get('User-Agent');
    userData = req.body;
    authData.checkUser(req.body)
    .then((user) => {
        req.session.user = {
        userName: user.userName,
        email: user.email, // authenticated user's email
        loginHistory: user.loginHistory, // authenticated user's loginHistory
        }
        res.redirect('/monsters/collection');
        })
    .catch((err)=>{
        res.render("login", {errorMessage: err, userName: req.body.userName});
    })
})

app.get('/logout', (req, res)=>{
    req.session.reset();
    res.redirect('/');
})

app.get('/userHistory', ensureLogin, (req, res)=>{
    res.render('userHistory')
})

//monster routes

app.get('/battles', ensureLogin,(req, res) => {
    legoData.getAllBattles()
    .then((value)=>{
        res.render("battles", {battles: value});
    }).catch((error)=>{
        console.log("an error occured: ", error);
    })
  });
  
  let id;
  app.get('/battles/:num', ensureLogin,(req, res) => {
      id = req.params.num;
      legoData.getBattleByID(id)
      .then((battle) => {
            legoData.saveUserName(req.session.user.userName);
            console.log('Battle Data:', battle);
            res.render('battleInfo', { battle: battle[0] }); // Pass the first result
        })
        .catch((err) => {
            console.log('Error fetching battle:', err);
            res.status(500).send('An error occurred while fetching the battle.');
        });
});

app.get('/profile', ensureLogin, (req, res) => {
    const userName = req.session.user.userName;
    legoData.getAllSetsByName(userName)
        .then((userSets) => {
            res.render('profile', { userSets: userSets, userName: userName });
        })
        .catch((err) => {
            console.error('Error fetching user sets:', err);
            res.status(500).render('500', { message: 'An error occurred while fetching your profile.' });
        });
});

app.get('/addChallenge/:num', ensureLogin, (req, res) => {
    let monster_id = req.params.num;
    legoData.getSetByNum(monster_id)
    .then((set) => {
        res.render('addChallenge', { set: set, error: null });
    })
    .catch((err) => {
        res.status(404).render('404', { message: "No Sets found for a specific set num" })
    })
})


app.post('/addChallenge/:num', ensureLogin, (req, res) => {
    const challengerMonsterId = req.body.userMonsterId; // Get the user's monster ID from the form
    const targetMonsterId = req.params.num; // The target monster ID (from the route parameter)
    const userName = req.session.user.userName;

    // Validate if the user's monster exists
    // Set.findOne({ where: { monster_id: challengerMonsterId, username: userName } })
        legoData.checkValidMonsterId(challengerMonsterId, userName)
        .then((userMonster) => {
            if (!userMonster) {
                throw new Error('Your monster does not exist or does not belong to you.');
            }
        })
        legoData.checkValidBattle(challengerMonsterId, targetMonsterId)
        .then((newBattle) => {
            res.render('battleCreated', { battle: newBattle });
        })
        .catch((err) => {
            console.error(err.message);
            res.status(400).render('addChallenge', { error: err.message, set: { monster_id: targetMonsterId } });
        });
});


//socket stuff
// In-memory storage for votes and user-specific limits
const voteCounts = {}; // Tracks total votes per battle
const userVotes = {};  // Tracks user-specific vote counts
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('vote', async (data) => {
        const { battleId, monster } = data;
        //const userName = socket.handshake.headers['user-name']; // Replace with the correct source of the username

        try {
            // Check if the user can vote
            const canVote = await legoData.checkVotes(battleId);

            if (!canVote) {
                socket.emit('voteLimitReached', { message: 'You have reached the maximum number of votes for this battle.' });
                return;
            }

            // Initialize vote counts for the battle if not already present
            if (!voteCounts[battleId]) {
                voteCounts[battleId] = { monsterOneVotes: 0, monsterTwoVotes: 0 };
            }

            // Update vote counts
            if (monster === 'monsterOne') {
                voteCounts[battleId].monsterOneVotes++;
            } else if (monster === 'monsterTwo') {
                voteCounts[battleId].monsterTwoVotes++;
            }

            // Broadcast updated vote counts to all connected clients
            io.emit('voteUpdate', {
                battleId,
                monsterOneVotes: voteCounts[battleId].monsterOneVotes,
                monsterTwoVotes: voteCounts[battleId].monsterTwoVotes,
            });
        } catch (error) {
            console.error('Error in vote handler:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});




app.use((req, res, next) => {
    res.status(404).render('404', { message: "No view matched for a specific route " });
});


