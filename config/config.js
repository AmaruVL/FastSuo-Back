require("dotenv").config(); // this is important!
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: true,
    //"sslfactory" : "org.postgresql.ssl.NonValidatingFactory"
    dialectOptions: { ssl: process.env.DB_SSL }
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: "xademrjobxrebf",
    password: "ccf462203ef9cfa969930c47ab4ec7d724f3e7eb64848e57daebc06a3f355eba",
    database: "dflda6ilgmg0cn",
    host: "ec2-54-163-226-238.compute-1.amazonaws.com",
    dialect: "postgres",
    logging: true
  },
  productionmoney: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
    //"sslfactory" : "org.postgresql.ssl.NonValidatingFactory"
    dialectOptions: { ssl: process.env.DB_SSL }
  },
  quertium: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MTMwNg.JaX1IDv-abFIDe-NpRrBiNhNyxJ7GvuFM0auaYEwle0"
};
