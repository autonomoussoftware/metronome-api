const config = require('./config')
config.port = 9000

let request = require('request')

const metApi = require('../')
const connection = metApi.database.mongoose.connection

const newAccount1 = require('./fixture/new-account-1')
const newAccount2 = require('./fixture/new-account-2')
const newAccount3 = require('./fixture/new-account-3')

request = request.defaults({ baseUrl: 'http://localhost:9000' })

const TOTAL_ACCOUNTS = 3

describe('Account Routes', () => {
  beforeAll(done => {
    metApi.start()
      .then(connection.collection('accounts').remove({}))
      .then(connection.collection('accounts').insertMany([newAccount1, newAccount2, newAccount3]))
      .then(done)
  })

  afterAll(() => {
    connection.collection('accounts').remove({})
      .then(() => metApi.stop())
  })

  describe('Query Accounts Route - GET /account', () => {
    test('responds with all accounts', done => {
      request.get('/account', { json: true }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(TOTAL_ACCOUNTS)
        expect(clientRes.body.accounts.length).toBe(3)
        done()
      })
    })

    test('responds all accounts matching the given query', done => {
      const qs = { balance: '1' }

      request.get('/account', { json: true, qs }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(2)
        expect(clientRes.body.accounts.length).toBe(2)
        done()
      })
    })

    test('responds all accounts matching the given page', done => {
      const qs = { $skip: 1, $limit: 1 }

      request.get('/account', { json: true, qs }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(TOTAL_ACCOUNTS)
        expect(clientRes.body.accounts.length).toBe(1)
        done()
      })
    })

    test('responds with empty array when accounts do not match the given query', done => {
      const qs = { balance: '90' }

      request.get('/account', { json: true, qs }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)

        expect(clientRes.body.count).toBe(0)
        expect(clientRes.body.accounts.length).toBe(0)
        done()
      })
    })
  })

  describe('Get Account by Id Route - GET /account/:id', () => {
    it('responds with a single account matching the given id', done => {
      request.get(`/account/${newAccount1._id}`, { json: true }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(200)
        expect(clientRes.body._id).toBe(newAccount1._id)

        done()
      })
    })

    it('responds with a 404 error if an account does not exist with the given id', (done) => {
      request.get(`/account/12`, { json: true }, (err, clientRes) => {
        if (err) { return done(err) }

        expect(clientRes.statusCode).toBe(404)
        done()
      })
    })
  })
})
