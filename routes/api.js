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
                // console.log('Docs:', docs);
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
              });
        });
      })

      .post(function(req, res) {
        // POST a thread to a specific message board
        // console.log('REQUEST:', req.body);
        console.log(':board', req.params.board);
        const now = (new Date()).toISOString();
        const thread = {
          board: req.params.board, // retrieve the board name from the URL
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
            // console.log('Saved:', doc);
            res.redirect(`/b/${doc.ops[0].board}`);
          });
        });
      })

      .delete(function(req, res) {
        // delete a thread
        // console.log('thread_id:', req.body.thread_id);
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.findOneAndDelete({
            '_id': ObjectId(req.body.thread_id),
            'delete_password': req.body.delete_password,
          }, function(err, doc) {
            if (err) {
              console.error(err);
              res.send('An error has occurred.');
            } else if (doc.value === null) {
              // console.log(doc);
              res.send('incorrect password');
            } else {
              // console.log(doc);
              res.send('success');
            }
          });
        });
      })

      .put(function(req, res) {
        // report a thread
        // console.log('thread_id:', req.body.thread_id);
        // console.log('thread_id:', req.body.delete_password);
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.findOneAndUpdate({
            '_id': ObjectId(req.body.thread_id),
          },
          {$set: {'reported': true}}, // report
          function(err, doc) {
            if (err) {
              console.error(err);
            } else if (doc.value === null) {
              // console.log(doc);
              res.send('incorrect thread id');
            } else {
              // console.log(doc);
              res.send('success');
            }
          });
        });
      });

  app.route('/api/replies/:board')
      .get(function(req, res) {
        // GET an entire thread with all it's replies
        // console.log(':board', req.params.board);
        // console.log('thread_id=', req.query.thread_id);
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.findOne({'_id': ObjectId(req.query.thread_id)}, function(err, doc) {
            // console.log('Doc:', doc);

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
          });
        });
      })

      .post(function(req, res) {
        // POST a reply to a thread
        // console.log('REQUEST:', req.body);
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
                // console.log('Saved:', doc);
                res.redirect(`/b/${doc.value.board}/${ObjectId(doc.value._id)}`);
              });
        });
      })

      .delete(function(req, res) {
        // delete a reply (just changing the text to '[deleted]')
        // console.log('thread_id:', req.body.thread_id);
        // console.log('reply_id:', req.body.reply_id);
        // console.log('delete_password:', req.body.delete_password);
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.findOneAndUpdate(
              {'_id': ObjectId(req.body.thread_id)},
              {$set: {'replies.$[reply].text': '[deleted]'}}, // change the text to '[deleted]'
              {arrayFilters: [{
                $and: [
                  {'reply._id': ObjectId(req.body.reply_id)},
                  {'reply.delete_password': req.body.delete_password},
                ],
              }],
              returnOriginal: false}, // make mongodb return updated value
              function(err, doc) {
                if (err) {
                  console.error(err);
                  res.send('An error has occurred.');
                } else {
                  // console.log('Doc:', doc);

                  const deleted = doc.value.replies.find(function(r) {
                    return (r._id.toString() === req.body.reply_id) && (r.text === '[deleted]');
                  });
                  // console.log(deleted);
                  if (typeof deleted === 'undefined') {
                    // The reply with specified _id is not [deleted]
                    res.send('incorrect password');
                  } else {
                    res.send('success');
                  }
                }
              });
        });
      })

      .put(function(req, res) {
        // report a reply
        // console.log('thread_id:', req.body.thread_id);
        // console.log('reply_id:', req.body.reply_id);
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          const db = client.db('message-board');
          const collection = db.collection('threads');
          collection.findOneAndUpdate(
              {'_id': ObjectId(req.body.thread_id)},
              {$set: {'replies.$[reply].reported': true}}, // report
              {arrayFilters: [{
                $and: [
                  {'reply._id': ObjectId(req.body.reply_id)},
                ],
              }],
              returnOriginal: false}, // make mongodb return updated value
              function(err, doc) {
                if (err) {
                  console.error(err);
                  res.send('An error has occurred.');
                } else {
                  // console.log('Doc:', doc);

                  const deleted = doc.value.replies.find(function(r) {
                    return (r._id.toString() === req.body.reply_id) && (r.reported === true);
                  });
                  // console.log(deleted);
                  if (typeof deleted === 'undefined') {
                    // The reply with specified _id is not [deleted]
                    res.send('incorrect _id');
                  } else {
                    res.send('success');
                  }
                }
              });
        });
      });
};
