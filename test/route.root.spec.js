'use strict'

const config = require('config')
const request = require('request')
  .defaults({ baseUrl: 'http://localhost:9000' })

const MetApi = require('../lib')
const logger = require('../logger')

const metApi = new MetApi(config, logger)

describe('Root Routes', () => {
  beforeAll(() => metApi.start())
  afterAll(() => metApi.stop())

  test('responds to a root request with a 200 status code', done => {
    request.get('/', (err, clientRes) => {
      if (err) { return done(err) }

      expect(clientRes.statusCode).toBe(200)
      done()
    })
  })

  test('responds to a status request with a 204 status code', done => {
    request.get('/status', (err, clientRes) => {
      if (err) { return done(err) }

      expect(clientRes.statusCode).toBe(204)
      done()
    })
  })
})
