const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);
