# ACC Market API
ACC(Autonomous Converter Contract) market API will present, MET data from ACC, 
in standard format.

- [ACC Market API](#acc-market-api)
  - [Quote](#quote)
  - [Order Book](#order-book)
  - [Ticker](#ticker)
  - [Trades](#trades)
  - [Transaction](#transaction)
  - [Volumes](#volumes)


## Quote
This API will return estimated amount of ETH needed to buy/received when selling MET.
Quote amount is calculated based on amount of MET and side of trade.

**Request**
```
GET /acc/quote?amount=10.65&side=buy
```
| Name   | Description   | Required | Type          | Accepted Values |
| ------ | ------------- | -------- | ------------- | --------------- |
| amount | MET quantity  | Yes      | string, float |                 |
| side   | Type of trade | Yes      | string        | BUY, SELL       |

**Response**
```json
{
  "quote":"0.013331499371862938"
}
```
| Name  | Description            |
| ----- | ---------------------- |
| quote | Amount of ETH `in WEI` |


## Order Book
As Metronome in ACC doesn't support ask and bid, we have prepared virtual
order book based on current contents of ACC. This API will return virtual
order book of ACC.

**Request**
```
GET /acc/orderbook
```

**Response**
```json
{
  "timestamp": "2019-12-13T18:41:15.369Z",
  "displayCurrency": "ETH",
  "ask": [
    {
      "price": "0.003171262229005270",
      "size": "19.145000000000000000"
    },
    {
      "price": "0.003171259799586535",
      "size": "20.241700000000000000"
    },
    ...
  ],
  "bid": [
    {
      "price": "0.003171383574277864",
      "size": "35.631136175550921718"
    },
    {
      "price": "0.003171396147917730",
      "size": "41.306728610997319194"
    }
    ...
  ]
}
```

| Name            | Description                            |
| --------------- | -------------------------------------- |
| timestamp       | Request timestamp                      |
| displayCurrency | Currency for ask and bid price         |
| ask             | Array of virtual asks                  |
| bid             | Array of virtual bids                  |
| price           | Trade price level                      |
| size            | Trade volume, `in MET`, at given price |


## Ticker
This API will return ticker information of MET.

**Request**
```
GET /acc/ticker
```

**Response**
```json
{
  "name": "Metronome",
  "symbol": "MET",
  "decimals": 18,
  "open": "0.003176194388491891",
  "high": "0.003324521127636560",
  "low": "0.003174590215794194",
  "last": "0.003176892969383660",
  "volume": "432.756931717481652216",
  "displayCurrency": "ETH"
}
```

| Name            | Description                              |
| --------------- | ---------------------------------------- |
| name            | Token name                               |
| symbol          | Token symbol                             |
| decimals        | Number of decimals supported by token    |
| oepn            | First trade price within last 24 hours   |
| high            | Highest trade price within last 24 hours |
| low             | Lowest trade price within last 24 hours  |
| last            | Last trade price                         |
| volume          | Total trade amount within last 24 hours  |
| displayCurrency | Currency for ticker data                 |


## Trades
This API will return MET trades.

**Request**
```
GET /acc/trades?limit=2&sort=ASC
```

| Name  | Description                | Required | Type           | Accepted Values | Default           |
| ----- | -------------------------- | -------- | -------------- | --------------- | ----------------- |
| sort  | Sort response by timestamp | No       | string         | `ASC`, `DESC`   | `DESC`            |
| from  | Start time of interval     | No       | unix timestamp |                 | Birth time of MET |
| to    | End time fo interval       | No       | unix timestamp |                 | now               |
| limit | Numbr of results           | No       | number         | 1-1000          | 100               |

**Response**
```json
{
  "displayCurrency": "ETH",
  "trades": [
    {
      "price": "0.003175497102641855",
      "quantity": "409.250706483485655552",
      "side": "buy",
      "timestamp": "2019-12-13T01:19:32.000Z"
    },
    {
      "price": "0.003176892969383660",
      "quantity": "629.545917748690970884",
      "side": "buy",
      "timestamp": "2019-12-13T04:49:44.000Z"
    }
  ]
}
```

| Name            | Description                 |
| --------------- | --------------------------- |
| displayCurrency | Currency for trade data     |
| trades          | Array of trade data         |
| price           | Trade price                 |
| quantity        | Trade quantity              |
| side            | Trade side, `buy` or `sell` |
| timestamp       | Trade timestamp             |


## Transaction
This API will return transaction data. It can be signed and submitted to blockchain for execution.

**Request**
```
GET /acc/transaction?amount=0.212059178929925514&minReturn=165.3654278&priority=low&side=buy&userAddress=0xbb3D5B5a32038b89F37581b108486F2432b8D64c
```
| Name         | Description                        | Required | Type          | Accepted Values   |
| ------------ | ---------------------------------- | -------- | ------------- | ----------------- |
| amount       | Source token quantity              | Yes      | string, float |                   |
| min_return   | Minimum destination token accepted | Yes      | string        |                   |
| priority     | Transaction priority               | Yes      | string        | Low, Medium, High |
| nonce        | Nonce of account                   | No       | string        |                   |
| side         | Type of trade                      | Yes      | string        | BUY, SELL         |
| user_address | User wallet address                | Yes      | string        |                   |

> To buy 50 MET, `min_return` will be 50 and you can calculate ETH `amount` using `/quote?amount=50&side=buy` API.
> To sell 10 MET, `amount` wil be 10 and you can calcualte ETH `min_return` using `/quote?amount=10&side=sell` API.

**Response**
```json
{
  "from":"0xbb3D5B5a32038b89F37581b108486F2432b8D64c",
  "to":"0x638E84db864AA345266e1AEE13873b860aFe82e7",
  "data":"0xc171747b000000000000000000000000000000000000000000000008f6e80470c5817000",
  "value":"0x2f162b31f7aad8a",
  "gas":"0x2bc2e",
  "gasPrice":"0x766b5e35",
  "nonce":"0x0"
}
```
| Name     | Description                                                 |
| -------- | ----------------------------------------------------------- |
| from     | User wallet address                                         |
| to       | ACC address                                                 |
| data     | Encoded abi data of contract call                           |
| value    | ETH being transfer, if buying MET                           |
| gas      | Gas requried for this transaction. Do not change this value |
| gasPrice | Calculated gas price based on provided priority.            |
| nonce    | Nonce of the account                                        |
> If `nonce` is not provided in request and multiple requests are submitted at same time then API will return same nonce.

## Volumes
This API will return per day trade volume of MET.

**Request**
```
GET /acc/volumes?limit=2&sort=ASC
```
| Name  | Description               | Required | Type   | Accepted Values | Default |
| ----- | ------------------------- | -------- | ------ | --------------- | ------- |
| sort  | Sort response by date     | No       | string | `ASC`, `DESC`   | `DESC`  |
| limit | Number of results or days | No       | number | any number      | 30      |

**Response**
```json
{
  "displayCurrency": "ETH",
  "volumes": [
    {
      "date": "2019-12-11",
      "volume": "431.581403541655591364"
    },
    {
      "date": "2019-12-12",
      "volume": "431.545652004860015191"
    }
  ]
}
```

| Name            | Description          |
| --------------- | -------------------- |
| displayCurrency | Currency of volume   |
| volumes         | Array of volume data |
| date            | Date                 |
| volume          | Trade volume of day  |