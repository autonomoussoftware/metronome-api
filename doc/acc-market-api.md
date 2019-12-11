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
  ],
  "timestamp": "2019-12-12T22:31:50.757Z"
}
```

| Name      | Description                 |
| ---       | ---                         |
| ask       | Array of virtual asks       |
| bid       | Array of virtual bids       |
| price     | Trade price level           |
| size      | Trade volume at given price |
| timestamp | Request timestamp           |


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
  "open": "0.003166524542614852",
  "high": "0.003319880433994753",
  "low": "0.003166524542614852",
  "last": "0.003171304639762416",
  "volume": "431.693087552694042137"
}
```

| Name     | Description                              |
| ---      | ---                                      |
| name     | Name of token                            |
| symbol   | Token symbol                             |
| decimals | Number of decimals supported by token    |
| oepn     | First trade price within last 24 hours   |
| high     | Highest trade price within last 24 hours |
| low      | Lowest trade price within last 24 hours  |
| last     | Last trade price                         |
| volume   | Total trade amount within last 24 hours  |


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
  "data": [
    {
      "price": "0.003169907876358474",
      "quantity": "2879.500004387422306622",
      "side": "sell",
      "timestamp": "2019-12-12T01:10:08.000Z"
    },
    {
      "price": "0.003171304639762416",
      "quantity": "630.655275095184132424",
      "side": "buy",
      "timestamp": "2019-12-12T11:33:49.000Z"
    }
  ]
}
```

| Name      | Description                 |
| ---       | ---                         |
| price     | Trade price                 |
| quantity  | Trade quantity              |
| side      | Trade side, `buy` or `sell` |
| timestamp | Trade timestamp             |


## Volumes
This API will return per day trade volume of MET.

**Request**
```
GET /acc/volumes?limit=2
```
| Name  | Description                | Optional | Accepted Values | Default |
| ---   | ---                        | --       | --              | --      |
| sort  | Sort response by timestamp | Yes      | `ASC`, `DESC`   | `DESC`  |
| limit | Numbr of results / days    | Yes      |  Number         | 30      |

**Response**
```json
{
  "data": [
    {
      "date": "2019-12-11",
      "volume": "431.581403541655591364"
    },
    {
      "date": "2019-12-10",
      "volume": "434.542514525748803174"
    }
  ]
}
```

| Name   | Description  |
| ---    | ---          |
| date   | Date         |
| volume | Trade volume |