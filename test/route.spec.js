/* eslint-disable max-len */
/* global describe expect beforeAll afterAll test */
require('./config')

let request = require('request')
const sinon = require('sinon')

const mtnApi = require('../')
request = request.defaults({ baseUrl: 'http://localhost:9000' })

describe('Root Routes', () => {
  beforeAll(() => mtnApi.start())
  afterAll(() => mtnApi.stop())

  test('responds to a root request with a 200 status code', (done) => {
    request.get('/', (err, clientRes) => {
      if (err) { return done(err) }

      expect(clientRes.statusCode).toBe(200)
      done()
    })
  })

  test('responds to a status request with a 204 status code', (done) => {
    request.get('/status', (err, clientRes) => {
      if (err) { return done(err) }

      expect(clientRes.statusCode).toBe(204)
      done()
    })
  })

  // test('responds to a status request with a 503 status code when service is unavailable', (done) => {
  //   const stub = sinon.stub(mtnApi.database, 'ping').callsArgWith(0, null)

  //   request.get('/status', (err, clientRes) => {
  //     if (err) { return done(err) }

  //     expect(clientRes.statusCode).toBe(503)
  //     stub.restore()

  //     done()
  //   })
  // })

  test('responds to a status request with a 500 status code when database is stopped', (done) => {
    mtnApi.database.disconnect()
      .then(() => {
        console.log('ACAAAA')
        request.get('/status', (err, clientRes) => {
          if (err) {
            console.log('ACAAAA ERROR')
            return done(err)
          }

          console.log('ACAAAA 2')
          mtnApi.database.connect()
            .then(() => {
              console.log('ACAAAA 3')
              expect(clientRes.statusCode).toBe(500)
              done()
            })
        })
      })
      .catch(err => done(err))
  })

  // it('responds to a public-routes request with a 200 status code', (cb) => {
  //   request.get('/public-routes', { json: true }, (err, clientRes) => {
  //     if (err) { return cb(err) }

  //     assert.equal(clientRes.statusCode, 200)
  //     cb(null)
  //   })
  // })
})
