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
  timestamp: 0
}
const web3Mock = {
  eth: {
    getBlock: () => new Promise(() => latestBlockMock),
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

describe('Task object', function () {
  test('emit status on new block event', function (done) {
    const emitter = new EventEmitter()
    const subscribe = web3Mock.eth.subscribe
    web3Mock.eth.subscribe = emitter.on.bind(emitter)

    const socketMock = {
      events: {
        AUCTION_STATUS_TASK: auctionStatusEvent
      },
      io: {
        emit: function (event, data) {
          expect(event).toEqual(auctionStatusEvent)
          expect(data).toHaveProperty('lastPurchasePrice')
          expect(data).toHaveProperty('lastPurchaseTime')
          expect(data).toHaveProperty('nextAuctionStartTime')

          web3Mock.eth.subscribe = subscribe
          done()
        },
        on: () => {}
      }
    }

    // eslint-disable-next-line no-new
    new Task(null, loggerMock, null, ethApiMock, socketMock)
    emitter.emit('newBlockHeaders', {})
  })

  test('emit status on connection', function (done) {
    const ioEmitter = new EventEmitter()

    const socketMock = {
      events: {
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

    // eslint-disable-next-line no-new
    new Task(null, loggerMock, null, ethApiMock, socketMock)
    ioEmitter.emit('connection', socketEmitter)
  })
})
