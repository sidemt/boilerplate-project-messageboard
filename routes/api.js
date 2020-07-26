/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

const ThreadHandler = require('../controllers/handlers/ThreadHandler.js');
const ReplyHandler = require('../controllers/handlers/ReplyHandler.js');
// const {ObjectID} = require('mongodb');

// MongoDB setup
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = function(app) {
  app.route('/api/threads/:board')
      .post(function(req, res) {
        console.log('REQUEST:', req.body);
        const now = (new Date()).toISOString();
        const thread = {
          board: req.body.board,
          text: req.body.text,
          created_on: now,
          bumped_on: now,
          reported: false,
          delete_password: req.body.delete_password,
          replies: [],
        };
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.insertOne(thread, function(err, doc) {
            console.log('Saved:', doc);
            res.redirect(`/b/${doc.ops[0].board}`);
          });
        });
      });

  app.route('/api/replies/:board')
      .post(function(req, res) {
        console.log('REQUEST:', req.body);
        const now = (new Date()).toISOString();
        const reply = {
          _id: new ObjectId(),
          text: req.body.text,
          created_on: now,
          reported: false,
          delete_password: req.body.delete_password,
        };
        // post a new reply
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.findOneAndUpdate({'_id': ObjectId(req.body.thread_id)},
              {
                $push: {replies: reply},
                $set: {bumped_on: now},
              },
              function(err, doc) {
                console.log('Saved:', doc);
                // res.redirect to thread page /b/{board}/{thread_id}
                res.redirect(`/b/${doc.value.board}/${ObjectId(doc.value._id)}`);
              });
        });
      });
};
