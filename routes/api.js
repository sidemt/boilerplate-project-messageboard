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
      .get(function(req, res) {
        // GET an array of the most recent 10 bumped threads on the board
        // with only the most recent 3 replies
        console.log(':board', req.params.board);
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.find({'board': req.params.board})
              .sort({bumped_on: -1}) // descending
              .limit(10)
              .toArray(function(err, docs) {
                console.log('Docs:', docs);
                docs.map(function(thread) {
                  // most recent 3 replies
                  thread.replies = thread.replies.sort(function(a, b) {
                    return Date.parse(b.created_on) - Date.parse(a.created_on);
                  }).slice(0, 3);
                  thread.replies.map(function(reply) {
                    // Don't send reported and delete_passwords fields
                    delete reply.delete_password;
                    delete reply.reported;
                  });
                  // Don't send reported and delete_passwords fields
                  delete thread.delete_password;
                  delete thread.reported;
                });
                res.json(docs);
                db.close();
              });
        });
      })

      .post(function(req, res) {
        // POST a thread to a specific message board
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
      .get(function(req, res) {
        // GET an entire thread with all it's replies
        console.log(':board', req.params.board);
        console.log('thread_id=', req.query.thread_id);
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.findOne({'_id': ObjectId(req.query.thread_id)}, function(err, doc) {
            console.log('Doc:', doc);

            // sort replies by created_on descending
            doc.replies = doc.replies.sort(function(a, b) {
              return Date.parse(b.created_on) - Date.parse(a.created_on);
            });
            doc.replies.map(function(reply) {
              // Don't send reported and delete_passwords fields
              delete reply.delete_password;
              delete reply.reported;
            });
            // Don't send reported and delete_passwords fields
            delete doc.delete_password;
            delete doc.reported;

            res.json(doc);
            db.close();
          });
        });
      })

      .post(function(req, res) {
        // POST a reply to a thread
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
                res.redirect(`/b/${doc.value.board}/${ObjectId(doc.value._id)}`);
              });
        });
      });
};
