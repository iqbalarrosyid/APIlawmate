"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const { Connector } = require("@google-cloud/cloud-sql-connector");
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config, {
    define: { timestamps: false },
  });
} else {
  (sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  )),
    { define: { timestamps: false } };
}
if (process.env.NODE_ENV === "test") {
  sequelize.beforeConnect(async (config) => {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.CLOUDSQL_INSTANCE_CONNECTION_NAME,
      ipType: "PUBLIC",
    });
    if (process.env.NODE_ENV === "test") {
      config = { ...config, ...clientOpts };
    }
  });
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
try {
  sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (err) {
  console.error("Unable to connect to the database:", err);
}
module.exports = db;
