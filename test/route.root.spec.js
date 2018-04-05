const config = require('./config')
config.port = 9001

let request = require('request')

const mtnApi = require('../')
request = request.defaults({ baseUrl: 'http://localhost:9001' })

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

  // test('responds to a status request with a 500 status code when database is stopped', (done) => {
  //   mtnApi.database.disconnect()
  //     .then(() => {
  //       request.get('/status', (err, clientRes) => {
  //         if (err) { return done(err) }

  //         expect(clientRes.statusCode).toBe(500)

  //         mtnApi.database.connect()
  //           .then(() => done())
  //       })
  //     })
  //     .catch(err => done(err))
  // })
})
