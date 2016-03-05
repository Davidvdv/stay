'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var timesheetCtrlStub = {
  index: 'timesheetCtrl.index',
  show: 'timesheetCtrl.show',
  create: 'timesheetCtrl.create',
  update: 'timesheetCtrl.update',
  destroy: 'timesheetCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var timesheetIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './timesheet.controller': timesheetCtrlStub
});

describe('Timesheet API Router:', function() {

  it('should return an express router instance', function() {
    timesheetIndex.should.equal(routerStub);
  });

  describe('GET /api/timesheets', function() {

    it('should route to timesheet.controller.index', function() {
      routerStub.get
        .withArgs('/', 'timesheetCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/timesheets/:id', function() {

    it('should route to timesheet.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'timesheetCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/timesheets', function() {

    it('should route to timesheet.controller.create', function() {
      routerStub.post
        .withArgs('/', 'timesheetCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/timesheets/:id', function() {

    it('should route to timesheet.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'timesheetCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/timesheets/:id', function() {

    it('should route to timesheet.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'timesheetCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/timesheets/:id', function() {

    it('should route to timesheet.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'timesheetCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
