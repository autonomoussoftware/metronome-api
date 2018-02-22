# metronome-api

🖲Metronome Token REST API

[![Build Status](https://travis-ci.com/MetronomeToken/metronome-explorer.svg?token=zFtwnjoHbEAEPUQyswR1&branch=master)](https://travis-ci.com/MetronomeToken/metronome-desktop-wallet)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Configuration

The following environment variables are needed for the API to work:

- `MTN__ETH__AUCTION_ADDRESS` is the Auctions Contract Address. I.e. `0xfd9d84C87E80aAEDBE7afA50ad0D80B0b59Fe2b9`.
- `MTN__ETH__TOKEN_ADDRESS` is the MTNToken Contract Address I.e. `0xfd9d84C87E80aAEDBE7afA50ad0D80B0b59Fe2b9`.
- `MTN__ETH__WEB_SOCKET_URL` is the websocket URL of the Ethereum node. I.e. `ws://node.metronome.io:8546`.
- `MTN__MONGO__URL` is the mongodb URL. I.e. `mongodb://localhost/mtn`.


## Build Setup

```bash

# Install dependencies
$ npm i

# Run dev mode
$ npm run dev

# Run prod mode
$ npm start

# Check config values
$ npm run config

# Lint code
$ npm run lint
```


---
[![js-standard-style](https://cdn.rawgit.com/standard/standard/master/badge.svg)](http://standardjs.com)
