# ACC Market API
ACC(Autonomous Converter Contract) market API will present, MET data from ACC, 
in standard format.

- [ACC Market API](#ACC-Market-API)
  - [Order Book](#Order-Book)
  - [Ticker](#Ticker)
  - [Trades](#Trades)
  - [Volumes](#Volumes)

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
| ---             | ---                                    |
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
| ---             | ---                                      |
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

| Name  | Description                | Optional | Accepted Values | Default           |
| ---   | ---                        | --       | --              | --                |
| sort  | Sort response by timestamp | Yes      | `ASC`, `DESC`   | `DESC`            |
| from  | Start time of interval     | Yes      | Unix timestamp  | Birth time of MET |
| to    | End time fo interval       | Yes      | Unix timestamp  | now               |
| limit | Numbr of results           | Yes      | 1-1000          | 100               |

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
| ---             | ---                         |
| displayCurrency | Currency for trade data     |
| trades          | Array of trade data         |
| price           | Trade price                 |
| quantity        | Trade quantity              |
| side            | Trade side, `buy` or `sell` |
| timestamp       | Trade timestamp             |


## Volumes
This API will return per day trade volume of MET.

**Request**
```
GET /acc/volumes?limit=2&sort=ASC
```
| Name  | Description             | Optional | Accepted Values | Default |
| ---   | ---                     | --       | --              | --      |
| sort  | Sort response by date   | Yes      | `ASC`, `DESC`   | `DESC`  |
| limit | Numbr of results / days | Yes      |  Number         | 30      |

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
| ---             | ---                  |
| displayCurrency | Currency of volume   |
| volumes         | Array of volume data |
| date            | Date                 |
| volume          | Trade volume of day  |