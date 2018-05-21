'use strict'

const EventEmitter = require('events')

const AuctionStatus = require('../lib/metronome/auction-status')

const loggerMock = {
  error: () => {},
  info: () => {},
  verbose: () => {}
}

const heartbeatMock = {
  chain: '0x4554480000000000',
  auctionAddr: '0x9Aeb1035b327f4F81198090F4183F21ca6fcb040',
  convertAddr: '0x25d99454D94D9459f0aBB06009840A48bD04ca44',
  tokenAddr: '0x825A2cE3547e77397b7EAc4eb464E2eDCFaAE514',
  minting: '67603000000000000000001',
  totalMET: '10059116999999999999999999',
  proceedsBal: '59293982224237877319',
  currTick: '74355',
  currAuction: '44',
  nextAuctionGMT: '1524528000',
  genesisGMT: '1520035200',
  currentAuctionPrice: '3300000000000',
  dailyMintable: '2880000000000000000000',
  _lastPurchasePrice: '3300000000000'
}

const metronomeMock = {
  auctions: {
    methods: {
      auctionStartTime: () => ({ call: () => Promise.resolve() }),
      auctionSupply: () => ({ call: () => Promise.resolve() }),
      currentPrice: () => ({ call: () => Promise.resolve() }),
      currentAuction: () => ({ call: () => Promise.resolve() }),
      genesisTime: () => ({ call: () => Promise.resolve() }),
      globalMetSupply: () => ({ call: () => Promise.resolve() }),
      lastPurchasePrice: () => ({ call: () => Promise.resolve() }),
      lastPurchaseTick: () => ({ call: () => Promise.resolve() }),
      mintable: () => ({ call: () => Promise.resolve() }),
      heartbeat: () => ({ call: () => Promise.resolve(heartbeatMock) })
    }
  },

  metToken: {
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
  metronome: metronomeMock,
  web3: web3Mock
}

const auctionStatusEvent = 'AUCTION_STATUS_AuctionStatus'
const latestBlockEvent = 'LATEST_BLOCK'

describe('AuctionStatus Object', function () {
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
        emit (event, data) {
          if (event === latestBlockEvent) {
            expect(data).toHaveProperty('number')
            expect(data).toHaveProperty('timestamp')
          } else if (event === auctionStatusEvent) {
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
    new AuctionStatus({ logger: loggerMock, ethApi: ethApiMock, socket: socketMock })
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
    new AuctionStatus({ logger: loggerMock, ethApi: ethApiMock, socket: socketMock })
    ioEmitter.emit('connection', socketEmitter)
  })
})
