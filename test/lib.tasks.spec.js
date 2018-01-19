const EventEmitter = require('events')

const Task = require('../lib/tasks')

const loggerMock = {
  error: console.log.bind(console),
  info: console.log.bind(console),
  verbose: console.log.bind(console)
}

const nextAuctionMock = {
  _startTime: 0
}

const metronomeMock = {
  auctions: {
    methods: {
      auctionStartTime: () => ({ call: () => Promise.resolve() }),
      auctionSupply: () => ({ call: () => Promise.resolve() }),
      currentPrice: () => ({ call: () => Promise.resolve() }),
      currentAuction: () => ({ call: () => Promise.resolve() }),
      genesisTime: () => ({ call: () => Promise.resolve() }),
      globalMtnSupply: () => ({ call: () => Promise.resolve() }),
      lastPurchasePrice: () => ({ call: () => Promise.resolve() }),
      lastPurchaseTick: () => ({ call: () => Promise.resolve() }),
      mintable: () => ({ call: () => Promise.resolve() }),
      nextAuction: () => ({ call: () => Promise.resolve(nextAuctionMock) })
    }
  },

  mtntoken: {
    methods: {
      totalSupply: () => ({ call: () => Promise.resolve() })
    }
  }
}

const latestBlockMock = {
  timestamp: 0,
  number: 0
}

const web3Mock = {
  eth: {
    getBlock: () => Promise.resolve(latestBlockMock),
    subscribe: () => {}
  },

  utils: {
    fromWei: () => {}
  }
}

const ethApiMock = {
  getMetronome: () => metronomeMock,
  getToken: () => {},
  getWeb3: () => web3Mock
}

const auctionStatusEvent = 'AUCTION_STATUS_TASK'
const latestBlockEvent = 'LATEST_BLOCK'

describe('Task object', function () {
  test('emit status on new block event', function (done) {
    const emitter = new EventEmitter()
    const subscribe = web3Mock.eth.subscribe
    web3Mock.eth.subscribe = emitter.on.bind(emitter)

    const socketMock = {
      events: {
        LATEST_BLOCK: latestBlockEvent,
        AUCTION_STATUS_TASK: auctionStatusEvent
      },
      io: {
        emit: function (event, data) {
          if (event === latestBlockEvent) {
            expect(data).toHaveProperty('number')
            expect(data).toHaveProperty('timestamp')
          }
          else if (event === auctionStatusEvent) {
            expect(data).toHaveProperty('lastPurchasePrice')
            expect(data).toHaveProperty('lastPurchaseTime')
            expect(data).toHaveProperty('nextAuctionStartTime')
          } else {
            throw Error('Wrong emitted event')
          }

          web3Mock.eth.subscribe = subscribe
          done()
        },
        on: () => {}
      }
    }

    // eslint-disable-next-line no-new
    new Task(null, loggerMock, null, ethApiMock, socketMock)
    emitter.emit('newBlockHeaders', latestBlockMock)
  })

  test('emit status on connection', function (done) {
    const ioEmitter = new EventEmitter()

    const socketMock = {
      events: {
        LATEST_BLOCK: latestBlockEvent,
        AUCTION_STATUS_TASK: auctionStatusEvent
      },
      io: ioEmitter
    }

    const socketEmitter = new EventEmitter()
    socketEmitter.on(auctionStatusEvent, function (data) {
      expect(data).toHaveProperty('lastPurchasePrice')
      expect(data).toHaveProperty('lastPurchaseTime')
      expect(data).toHaveProperty('nextAuctionStartTime')

      done()
    })

    socketEmitter.on(latestBlockEvent, function (data) {
      expect(data).toHaveProperty('number')
      expect(data).toHaveProperty('timestamp')

      done()
    })

    // eslint-disable-next-line no-new
    new Task(null, loggerMock, null, ethApiMock, socketMock)
    ioEmitter.emit('connection', socketEmitter)
  })
})
