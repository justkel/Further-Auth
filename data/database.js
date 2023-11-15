// const mongodb = require('mongodb');

// const MongoClient = mongodb.MongoClient;

// let database;

// async function connectToDatabase() {
//   const client = await MongoClient.connect(
//     'mongodb://localhost:27017'
//   );
//   database = client.db('auth-demo');
// }

// function getDb() {
//   if (!database) {
//     throw { message: 'You must connect first!' };
//   }
//   return database;
// }

// module.exports = {
//   connectToDatabase: connectToDatabase,
//   getDb: getDb,
// };

const mongodb = require("mongodb");

// Initialize a variable to store the database connection
let database;

// Function to connect to the database
async function connectToDatabase() {
  const url = 'mongodb://0.0.0.0:27017/auth-demo'; // Update with your MongoDB connection URL
  const dbName = 'auth-demo';

  try {
    const client = await mongodb.MongoClient.connect(url);
    database = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    throw err;
  }
}

// Function to get the connected database instance
function getDb() {
  if (!database) {
    throw new Error("You must connect first");
  }
  return database;
}

module.exports = {
  connectToDatabase,
  getDb
};
