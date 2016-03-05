'use strict';

var app = require('../..');
import request from 'supertest';

var newTimesheet;

describe('Timesheet API:', function() {

  describe('GET /api/timesheets', function() {
    var timesheets;

    beforeEach(function(done) {
      request(app)
        .get('/api/timesheets')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          timesheets = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      timesheets.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/timesheets', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/timesheets')
        .send({
          name: 'New Timesheet',
          info: 'This is the brand new timesheet!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newTimesheet = res.body;
          done();
        });
    });

    it('should respond with the newly created timesheet', function() {
      newTimesheet.name.should.equal('New Timesheet');
      newTimesheet.info.should.equal('This is the brand new timesheet!!!');
    });

  });

  describe('GET /api/timesheets/:id', function() {
    var timesheet;

    beforeEach(function(done) {
      request(app)
        .get('/api/timesheets/' + newTimesheet._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          timesheet = res.body;
          done();
        });
    });

    afterEach(function() {
      timesheet = {};
    });

    it('should respond with the requested timesheet', function() {
      timesheet.name.should.equal('New Timesheet');
      timesheet.info.should.equal('This is the brand new timesheet!!!');
    });

  });

  describe('PUT /api/timesheets/:id', function() {
    var updatedTimesheet;

    beforeEach(function(done) {
      request(app)
        .put('/api/timesheets/' + newTimesheet._id)
        .send({
          name: 'Updated Timesheet',
          info: 'This is the updated timesheet!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedTimesheet = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedTimesheet = {};
    });

    it('should respond with the updated timesheet', function() {
      updatedTimesheet.name.should.equal('Updated Timesheet');
      updatedTimesheet.info.should.equal('This is the updated timesheet!!!');
    });

  });

  describe('DELETE /api/timesheets/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/timesheets/' + newTimesheet._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when timesheet does not exist', function(done) {
      request(app)
        .delete('/api/timesheets/' + newTimesheet._id)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
