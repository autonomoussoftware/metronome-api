const EventEmitter = require('events')

const Task = require('../lib/tasks')

describe('Task object', function () {
  test('can be created', function (done) {
    const emitter = new EventEmitter()

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
        getBlock: () => latestBlockMock,
        subscribe: emitter.on.bind(emitter)
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
    const eventName = 'AUCTION_STATUS_TASK'
    const socketMock = {
      events: {
        AUCTION_STATUS_TASK: eventName
      },
      io: {
        emit: function (event, data) {
          expect(event).toEqual(eventName)
          expect(data).toMatchObject({})
          done()
        }
      }
    }

    // eslint-disable-next-line no-new
    new Task(null, loggerMock, null, ethApiMock, socketMock)
    emitter.emit('newBlockHeaders', {})
  })
})
