# metronome-api

🖲Metronome Token REST API

[![Build Status](https://travis-ci.com/MetronomeToken/metronome-api.svg?token=zFtwnjoHbEAEPUQyswR1&branch=master)](https://travis-ci.com/MetronomeToken/metronome-desktop-wallet)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Requirements

- Node.js v8
- MongoDB v3
- Ethereum node (i.e. Geth or Parity)

## Configuration

The following environment variables are needed for the API to work:

- `MTN__ETH__AUCTION_ADDRESS` is the Auctions Contract Address. I.e. `0xfd9d84C87E80aAEDBE7afA50ad0D80B0b59Fe2b9`.
- `MTN__ETH__TOKEN_ADDRESS` is the MTNToken Contract Address I.e. `0xfd9d84C87E80aAEDBE7afA50ad0D80B0b59Fe2b9`.
- `MTN__ETH__WEB_SOCKET_URL` is the websocket URL of the Ethereum node. I.e. `ws://node.metronome.io:8546`.
- `MTN__MONGO__URL` is the mongodb URL. I.e. `mongodb://localhost/mtn`.

> You can use `$ npm run config` to check the values that the API will use when you start it.


## Dev Setup

```bash
# Install dependencies
$ npm i

# Run dev mode
$ npm run dev

# Run test cases
$ npm test

# Check config values
$ npm run config
```

## Prod Setup

```bash
# Install dependencies
$ npm i

# Run dev mode
$ npm start
```

## REST API

### `GET /`
Will return a JSON object with basic information like project name and versions

```json
{
  "name": "metronome-api",
  "version": "1.0.0"
}
```

### `GET /config`
Will return a JSON object with Metronome Contract Addresses.

```json
{
  "tokenAddress": "0x825a2ce3547e77397b7eac4eb464e2edcfaae514",
  "auctionAddress": "0x9aeb1035b327f4f81198090f4183f21ca6fcb040"
}



---
[![js-standard-style](https://cdn.rawgit.com/standard/standard/master/badge.svg)](http://standardjs.com)
