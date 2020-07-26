/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  suite('API ROUTING FOR /api/threads/:board', function() {
    suite('POST', function() {
      test('Test POST /api/threads/{board}', function(done) {
        chai.request(server)
            .post('/api/threads/test')
            .send({
              text: 'test post',
              delete_password: 'deletethis',
            })
            .end(function(err, res) {
              // console.log('res', res.redirects);
              assert.match(res.redirects[0], /\/b\/test$/, 'should redirect to /b/{board}');
              done();
            });
      });
    });

    suite('GET', function() {
      test('Test GET /api/threads/{board}', function(done) {
        chai.request(server)
            .get('/api/threads/test')
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.isArray(res.body, 'response should be an array');
              assert.equal(res.body.length, 10, 'response should contain 10 threads');
              assert.property(res.body[0], 'text', 'should contain text');
              assert.property(res.body[0], 'created_on', 'should contain created_on');
              assert.property(res.body[0], 'bumped_on', 'should contain bumped_on');
              assert.property(res.body[0], 'replies', 'should contain replies');
              assert.notProperty(res.body[0], 'reported', 'should not contain reported');
              assert.notProperty(res.body[0], 'delete_password', 'should not contain delete_password');
              assert.isArray(res.body[0].replies, 'replies should be an array');
              assert.isAtMost(res.body[0].replies.length, 3, 'number of replies should be at most 3');
              done();
            });
      });
    });

    suite('DELETE', function() {
      test('Test DELETE /api/threads/{board}', function(done) {
        chai.request(server)
            .delete('/api/threads/test')
            .send({
              thread_id: '5f1dbe554000445ea85cdcd9', // valid id
              delete_password: 'incorrect', // incorrect password
            })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'incorrect password');
              done();
            });
      });
    });

    suite('PUT', function() {
      test('Test PUT /api/threads/{board}', function(done) {
        chai.request(server)
            .put('/api/threads/test')
            .send({
              thread_id: '5f1dbe554000445ea85cdcd9', // valid id
            })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'success');
              done();
            });
      });
    });
  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    suite('POST', function() {
      test('Test POST /api/replies/{board}', function(done) {
        chai.request(server)
            .post('/api/replies/test')
            .send({
              text: 'test reply',
              delete_password: 'deletethis',
              thread_id: '5f1dbe784da1222d64e99b4c',
            })
            .end(function(err, res) {
              // console.log('res', res.redirects);
              assert.match(res.redirects[0], /\/b\/test\/5f1dbe784da1222d64e99b4c$/, 'should redirect to /b/{board}');
              done();
            });
      });
    });

    suite('GET', function() {
      test('Test GET /api/replies/{board}', function(done) {
        chai.request(server)
            .get('/api/replies/test?thread_id=5f1dbe784da1222d64e99b4c')
            .end(function(err, res) {
              assert.equal(res.status, 200);

              assert.property(res.body, 'text', 'should contain text');
              assert.property(res.body, 'created_on', 'should contain created_on');
              assert.property(res.body, 'bumped_on', 'should contain bumped_on');
              assert.property(res.body, 'replies', 'should contain replies');
              assert.notProperty(res.body, 'reported', 'should not contain reported');
              assert.notProperty(res.body, 'delete_password', 'should not contain delete_password');
              assert.isArray(res.body.replies, 'replies should be an array');
              assert.isAbove(res.body.replies.length, 3, 'number of replies should be at most 3');

              assert.property(res.body.replies[0], 'text', 'should contain text');
              assert.property(res.body.replies[0], 'created_on', 'should contain created_on');
              assert.notProperty(res.body.replies[0], 'reported', 'should not contain reported');
              assert.notProperty(res.body.replies[0], 'delete_password', 'should not contain delete_password');
              done();
            });
      });
    });

    suite('PUT', function() {
      test('Test PUT /api/replies/{board}', function(done) {
        chai.request(server)
            .put('/api/replies/test')
            .send({
              thread_id: '5f1dbe784da1222d64e99b4c', // valid id
              reply_id: '5f1dc8b87c38381d2c740160', // valid id
            })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'success');
              done();
            });
      });
    });

    suite('DELETE', function() {
      test('Test DELETE /api/replies/{board}', function(done) {
        chai.request(server)
            .delete('/api/replies/test')
            .send({
              thread_id: '5f1dbe784da1222d64e99b4c', // valid id
              reply_id: '5f1dc9f508028a2ad46cffad', // valid id
              delete_password: 'incorrect', // incorrect password
            })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'incorrect password');
              done();
            });
      });
    });
  });
});
