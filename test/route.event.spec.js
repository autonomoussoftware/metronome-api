'use strict'

const config = require('config')
const request = require('request')
  .defaults({ baseUrl: 'http://localhost:9000' })

const MetApi = require('../lib')
const logger = require('../logger')

const metApi = new MetApi(config, logger)
const connection = metApi.database.mongoose.connection

const newEvent1 = require('./fixture/new-event-1')
const newEvent2 = require('./fixture/new-event-2')
const newEvent3 = require('./fixture/new-event-3')

const TOTAL_EVENTS = 3

describe('Event Routes', () => {
  beforeAll(() => metApi.start()
      .then(() => connection.collection('events').remove({}))
      .then(() => connection.collection('events').insertMany([newEvent1, newEvent2, newEvent3])))

  afterAll(() => connection.collection('events').remove({})
      .then(() => metApi.stop()))

  describe('Query Events Route - GET /event', () => {
    test('responds with all events', done => {
      request.get('/event', { json: true }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(TOTAL_EVENTS)
        expect(clientRes.body.events.length).toBe(3)
        done()
      })
    })

    test('responds all events matching the given query', done => {
      const qs = { 'metaData.returnValues._value': '1' }

      request.get('/event', { json: true, qs }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(1)
        expect(clientRes.body.events.length).toBe(1)
        done()
      })
    })

    test('responds all events matching the given page', done => {
      const qs = { $skip: 1, $limit: 1 }

      request.get('/event', { json: true, qs }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(TOTAL_EVENTS)
        expect(clientRes.body.events.length).toBe(1)
        done()
      })
    })

    test('responds with empty array when events do not match the given query', done => {
      const qs = { 'metaData.returnValues._value': '10' }

      request.get('/event', { json: true, qs }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(0)
        expect(clientRes.body.events.length).toBe(0)
        done()
      })
    })
  })

  describe('Get Event by Id Route - GET /event/:id', () => {
    it('responds with a single event matching the given id', done => {
      request.get(`/event/${newEvent1._id}`, { json: true }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)
        expect(clientRes.body._id).toBe(newEvent1._id)

        done()
      })
    })

    it('responds with a 404 error if an event does not exist with the given id', done => {
      request.get('/event/12', { json: true }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(404)
        done()
      })
    })
  })
})
