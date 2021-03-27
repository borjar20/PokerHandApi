'use strict'

var varapiv1handController = require('./apiv1handControllerService');

module.exports.addHand = function addHand(req, res, next) {
  varapiv1handController.addHand(req.swagger.params, res, next);
};