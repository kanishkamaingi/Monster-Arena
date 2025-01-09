require('dotenv').config();
const Sequelize = require('sequelize');
dialectModule: require("pg");
const fs = require('fs')
const path = require('path')
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


  const insertData = async () => {
    try {
      await sequelize.authenticate();
      console.log('Database connected successfully.');
  
      // Sync the models
      await sequelize.sync({ force: true }); // Use force: true to recreate tables
  
      // Read and parse the JSON files
      const themeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/themeData.json'), 'utf8'));
      const setData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/setData.json'), 'utf8'));
  
      // Insert data into the Theme table
      await Theme.bulkCreate(themeData);
      console.log('Themes inserted successfully.');
  
      // Insert data into the Set table
      await Set.bulkCreate(setData);
      console.log('Sets inserted successfully.');
  
      await sequelize.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error inserting data:', error);
    }
  };

  // insertData();




  // battle table

  // Define the Battle table
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


// Insert battle data function
const insertBattleData = async (battleData) => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Sync the Battle table
    await Battle.sync({ force: false }); // Do not recreate the table if it exists

    // Insert battle data
    await Battle.create(battleData);
    console.log('Battle inserted successfully.');
  } catch (error) {
    console.error('Error inserting battle data:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

// Example usage: Insert a new battle
const newBattle = {
  monster_one_id: 'M001', // Example monster ID for participant one
  monster_two_id: 'M002', // Example monster ID for participant two
};
// insertBattleData(newBattle);


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



sequelize.sync({ alter: true }) // Adjust the table schema if it exists
    .then(() => {
        console.log('UserVotes table synced successfully.');
    })
    .catch((err) => {
        console.error('Error syncing UserVotes table:', err);
    });

