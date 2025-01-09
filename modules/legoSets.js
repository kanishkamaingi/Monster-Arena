require('dotenv').config();
const Sequelize = require('sequelize');
dialectModule: require("pg");
const { Op } = require('sequelize');


const setData = require("../data/setData");
const themeData = require("../data/themeData");

// console.log(themeData)



// set up sequelize to point to our postgres database
let sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectModule: require("pg"),
    dialectOptions: {
    ssl: { rejectUnauthorized: false },
    },
    }
    );


// creating theme table 
const Theme = sequelize.define(
    'Theme',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // use "project_id" as a primary key
        autoIncrement: true, // automatically increment the value
      },
      name: Sequelize.STRING,
    },
    {
      createdAt: false, // disable createdAt
      updatedAt: false, // disable updatedAt
    }
  );

const Set = sequelize.define(
    'Set',
    {
      monster_id: {
        type: Sequelize.STRING,
        primaryKey: true, // use "project_id" as a primary key
      },
      name: Sequelize.STRING,
      year: Sequelize.INTEGER,
      power_level: Sequelize.INTEGER,
      theme_id: Sequelize.INTEGER, 
      img_url:Sequelize.STRING,
      userName: Sequelize.STRING,
    },
    {
      createdAt: false, // disable createdAt
      updatedAt: false, // disable updatedAt
    }
  );

  Set.belongsTo(Theme, {foreignKey: 'theme_id'});

// Code Snippet to insert existing data from Set / Themes

const Battle = sequelize.define(
  'Battle',
  {
    battle_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Automatically increment the battle ID
    },
    monster_one_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: Set,
        key: 'monster_id', // Foreign key references Set table's monster_id
      },
    },
    monster_two_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: Set,
        key: 'monster_id', // Foreign key references Set table's monster_id
      },
    },
    start_time: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW, // Automatically set the start time
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'ongoing', // Status of the battle (e.g., ongoing, completed)
    },
  },
  {
    createdAt: false, // Disable createdAt
    updatedAt: false, // Disable updatedAt
  }
);

// Define the associations
Battle.belongsTo(Set, { as: 'MonsterOne', foreignKey: 'monster_one_id' });
Battle.belongsTo(Set, { as: 'MonsterTwo', foreignKey: 'monster_two_id' });





const UserVotes = sequelize.define(
  'UserVotes',
  {
      id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
      },
      username: {
          type: Sequelize.STRING,
          allowNull: false,
      },
      battleId: {
          type: Sequelize.INTEGER,
          allowNull: false,
      },
      votesDone: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0, // Starts with 0 votes
      },
  },
  {
      createdAt: false,
      updatedAt: false,
  }
);

function initialize(){
    
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => {
                console.log("Database synchronized successfully.");
                resolve();
            })
            .catch((error) => {
                console.error("Error synchronizing the database:", error);
                reject(error);
            });
    });
   
}

function getAllSets(){
    return new Promise((resolve, reject) => {
        Set.findAll({
            include: [Theme] 
        })
        .then((allSets) => {
            
            resolve(allSets); 
        })
        .catch((error) => {
            console.error("Error fetching sets:", error);
            reject(error);
        });
    });
}

//battlefunction
function getAllBattles(){
  return new Promise((resolve,reject)=>{
    Battle.findAll({
      include: [
        { model: Set, as: 'MonsterOne', attributes: ['name'] },
        { model: Set, as: 'MonsterTwo', attributes: ['name'] },
      ],
    })
    .then((allBattles) => {
      resolve(allBattles);
    })
    .catch((err) => {
      console.log('error in getAllBattles', err);
      reject(err);
    })
  })
}

function getBattleByID(battleId){
  return new Promise((resolve,reject)=>{
    Battle.findAll({
      include: [
        { model: Set, as: 'MonsterOne', attributes: ['name', 'img_url'] },
        { model: Set, as: 'MonsterTwo', attributes: ['name', 'img_url'] },
        
      ],
      where: {
        battle_id: battleId,
      }
    })
    .then((allBattles) => {
      resolve(allBattles);
    })
    .catch((err) => {
      console.log('error in getAllBattles', err);
      reject(err);
    })
  })
}



function getSetByNum(setNum){
    return new Promise((resolve, reject)=>{

        Set.findAll({
            include: [Theme], 
            where: {
                monster_id: setNum,
            }
        })
        .then((sets) => {
            if (sets.length > 0) {
                resolve(sets[0]);       
            } else {
                reject(new Error("Unable to find requested set")); 
            }        
        })
        .catch((error) => {
            console.error("Error fetching sets:", error);
            reject(error);
        });
        })  
}

function getSetsByTheme(theme){
    return new Promise((resolve, reject)=>{

        Set.findAll({include: [Theme], where: {
            '$Theme.name$': {
            [Sequelize.Op.iLike]: `%${theme}%`
            }
        }})
        .then((sets) => {
            if (sets.length > 0) {
                resolve(sets);        
            } else {
                reject(new Error("Unable to find requested set"));  
            }        
        })
        .catch((error) => {
            console.error("Error fetching sets:", error);
            reject(error);
        });
    })
}

function addSet(setData){
    return new Promise((resolve, reject)=>{
        Set.create(setData)
        .then(() => {
          resolve(); 
        })
        .catch((err) => {
          reject(err); 
        });
    })
}

function getAllThemes() {
    return new Promise((resolve, reject) => {
      Theme.findAll()  
        .then(themes => {
          resolve(themes);  
        })
        .catch(err => {
          reject(err);  
        });
    });
  }
  
  function editSet(monster_id, setData) {
    return new Promise((resolve, reject)=>{
      Set.update(
        setData,
        {
          where: { monster_id : monster_id }, 
        }
      ).then(() => {
        resolve();
      })
      .catch((err)=>{
        reject(err.errors[0].message)
      })
      
    })
  }


  function DeleteSet(monster_id){
    return new Promise((resolve, reject)=>{
      Set.destroy({
        where: { monster_id: monster_id }, 
      }).then(() => {
        resolve();
      })
      .catch((err)=>{
        reject(err.errors[0].message);
      })
    })
  }

  var username = '';
  function saveUserName(usr){
    username = usr;
  }

  const checkVotes = async (battleId) => {
    try {
        // Check if the user has already voted in this battle
        let userVote = await UserVotes.findOne({
            where: { username, battleId },
        });

        if (!userVote) {
            // If no record exists, create one with votesDone = 1
            await UserVotes.create({ username, battleId, votesDone: 1 });
            return true; // Allow the first vote
        } else if (userVote.votesDone < 5) {
            // If votesDone < 5, increment and allow the vote
            await UserVotes.update(
                { votesDone: userVote.votesDone + 1 },
                { where: { id: userVote.id } }
            );
            return true; // Allow the vote
        } else {
            // If votesDone >= 5, disallow the vote
            return false;
        }
    } catch (error) {
        console.error('Error in checkVotes:', error);
        return false; // Disallow the vote on error
    }
};

function getAllSetsByName(userName) {
    return new Promise((resolve, reject) => {
        Set.findAll({
            where: {
                userName: userName,
            },
        })
        .then((sets) => {
            if (sets.length > 0) {
                resolve(sets);
            } else {
                reject(new Error("No sets found for the specified user"));
            }
        })
        .catch((error) => {
            console.error("Error fetching sets:", error);
            reject(error);
        });
    });
}


function checkValidMonsterId(monsterId, userName) {
    return new Promise((resolve, reject) => {
        Set.findOne({ where: { monster_id: monsterId, userName: userName } })
            .then((userMonster) => {
                if (!userMonster) {
                    reject(new Error('Your monster does not exist or does not belong to you.'));
                } else {
                    resolve(userMonster);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
}


function checkValidBattle(monsterOneId, monsterTwoId) {
    return new Promise((resolve, reject) => {
        Battle.findOne({
            where: {
                [Op.or]: [
                    { monster_one_id: monsterOneId, monster_two_id: monsterTwoId },
                    { monster_one_id: monsterTwoId, monster_two_id: monsterOneId },
                ],
            },
        })
        .then((existingBattle) => {
            if (existingBattle) {
                reject(new Error('A battle between these monsters already exists.'));
            } else {
              Battle.create({
                monster_one_id: monsterOneId,
                monster_two_id: monsterTwoId,
                status: 'ongoing', // Default status
            })
            .then((newBattle) => {
                resolve(newBattle);
            })
            .catch((err) => {
                reject(err);
            });
            }
        })
        .catch((err) => {
            reject(err);
        });
    });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, DeleteSet, getAllBattles, getBattleByID, saveUserName, checkVotes, getAllSetsByName, checkValidMonsterId , checkValidBattle}

