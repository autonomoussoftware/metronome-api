# Dashboard API
Dashboard API will provide Metronome data that can be presented in dashboard.

- [Dashboard API](#dashboard-api)
  - [Dashboard](#dashboard)
  - [Auction](#auction)
    - [Auction Average](#auction-average)
  - [Autonomous Converter](#autonomous-converter)
    - [ACC Average](#acc-average)

## Dashboard

Dashboard will provide basic metronome market data.

**Request**

``` 
GET /dashboard
```

**Response**

``` json
{
  "symbol": "MET",
  "price": {
    "eth": "0.003105521600953670",
    "usd": "0.45"
  },
  "marketCapUsd": "4434038.67",
  "totalSupply": "11544555.406479039898874532",
  "circulatingSupply": "9782431.406479040000000000",
  "proceeds": "11183.334956699028302366",
  "metHolders": 3556
}
```

| Name              | Description                           | Unit     |
| ----------------- | ------------------------------------- | -------- |
| symbol            | Metronome symbol                      | -        |
| price             | Current price of Metronome            | ETH, USD |
| marketCapUsd      | Market cap of Metronome               | USD      |
| totalSupply       | Total supply of Metronome             | MET      |
| circulatingSupply | Circulating Supply of Metronome       | MET      |
| proceeds          | Proceeds balance in Proceeds contract | ETH      |
| metHolders        | Unique Met holders count              | Number   |

## Auction

This API will provide basic auction stats.

**Requst**

``` 
GET /dashboard/auction
```

| Name | Description            | Optional | Accepted Values | Default           |
| ---- | ---------------------- | -------- | --------------- | ----------------- |
| from | Start time of interval | Yes      | Unix timestamp  | Birth time of MET |
| to   | End time fo interval   | Yes      | Unix timestamp  | now               |

**Response**

``` json
{
  "price": {
    "currentPrice": {
      "eth": "0.003156259012588688",
      "usd": "0.46"
    },
    "lastOpeningPrice": {
      "eth": "0.006314576199416843",
      "usd": "0.92"
    },
    "lastClosingPrice": {
      "eth": "0.003156259012588688",
      "usd": "0.46"
    }
  },
  "availability": "0.000000000000000000",
  "totalAuctions": "537",
  "timeRemaining": 5215,
  "uniqueBuyerCount": {
    "isa": 1445,
    "daily": 304,
    "total": 1700
  }
}
```

| Name             | Description                                                | Unit     |
| ---------------- | ---------------------------------------------------------- | -------- |
| price            | Price object                                               | -        |
| currentPrice     | Current price in auction                                   | ETH, USD |
| lastOpeningPrice | Opening price of last auction                              | ETH, USD |
| lastClosingPrice | Closing price of last auction                              | ETH, USD |
| availability     | Current available MET                                      | MET      |
| timeRemaining    | Time remaing until next auction starts                     | Second   |
| uniqueBuyerCount | Unique auction buyer count object                          | -        |
| isa              | Unique ISA buyers during selected time interval            | Number   |
| daily            | Unique daily auctions buyers during selected time interval | Number   |
| total            | Total unique auctions buyers during selected time interval | Number   |


  > Here ISA is `Initial Supply Auction`. If selected time interval i.e. `from and to` doesn't
  span over ISA then you will not get `total` and `isa` in reponse.
  For example `GET /dashboard/auction?from=1529280000&to=1546300800` will result in, 

``` json
{
  ...
  "uniqueBuyerCount": {
    "daily": 48
  }
}
```

### Auction Average

This API will provide average auction stats over selected time interval.

**Request**
```
GET /dashboard/auction/average?from=1529280000&to=1546300800
```

| Name | Description            | Optional | Accepted Values | Default           |
| ---- | ---------------------- | -------- | --------------- | ----------------- |
| from | Start time of interval | Yes      | Unix timestamp  | Birth time of MET |
| to   | End time fo interval   | Yes      | Unix timestamp  | now               |

**Response**

``` json
{
  "average": {
    "auctionDuration": 4430,
    "closingPrice": {
      "eth": "0.006417278241966032",
      "usd": "0.94"
    },
    "transactionCount": 19
  }
}
```

| Name             | Description                          | Unit     |
| ---------------- | ------------------------------------ | -------- |
| average          | Average stats object                 | -        |
| auctionDuration  | Average auction duration             | Second   |
| closingPrice     | Average closing price                | ETH, USD |
| transactionCount | Average transaction count in auction | Number   |


## Autonomous Converter

This API will provide autonomous converter stats.

**Request**

```
GET /dashboard/acc?from=1529280000&to=1546300800
```
 
| Name | Description            | Optional | Accepted Values | Default           |
| ---- | ---------------------- | -------- | --------------- | ----------------- |
| from | Start time of interval | Yes      | Unix timestamp  | Birth time of MET |
| to   | End time fo interval   | Yes      | Unix timestamp  | now               |

**Response**

``` json
{
  "current": {
    "price": {
      "eth": "0.003176890751633630",
      "usd": "0.46"
    },
    "available": {
      "eth": "9101.714199061234854234",
      "met": "2864973.509267149727174468"
    }
  },
  "conversions": {
    "count": {
      "buy": 9824,
      "sell": 10180,
      "total": 20004
    },
    "eth": {
      "in": "64579.107668748600000000",
      "out": "70348.251584833670000000",
      "total": "134927.359253582270000000"
    },
    "usd": {
      "in": "9424374.65",
      "out": "10266296.68",
      "total": "19690671.33"
    }
  }
}
```

| Name          | Description                                   | Unit   |
| ------------- | --------------------------------------------- | ------ |
| current       | Current object, it holds current stats of ACC | -      |
| price.eth     | Current price in ACC                          | ETH    |
| price.usd     | Current price in ACC                          | USD    |
| available.eth | Current available ETH in ACC                  | ETH    |
| available.met | Current available MET in ACC                  | MET    |
| conversions   | Conversions data over selected time interval  | -      |
| count.buy     | MET buy count                                 | Number |
| count.sell    | MET sell count                                | Number |
| count.total   | Sum of buy and sell count                     | Number |
| eth.in        | ETH came into ACC (MET purchase from ACC)     | ETH    |
| eth.out       | ETH went out from ACC (MET sell into ACC)     | ETH    |
| eth.total     | Total of ETH in and out                       | ETH    |
| usd.in        | USD representation of eth.in                  | USD    |
| usd.out       | USD representation of eth.out                 | USD    |
| usd.total     | Total of USD in and out                       | USD    |


### ACC Average

This API will provide average autonomous converter stats over selected time interval.

**Request**

```
GET /dashboard/acc/average?from=1529280000&to=1546300800
```

| Name | Description            | Optional | Accepted Values | Default           |
| ---- | ---------------------- | -------- | --------------- | ----------------- |
| from | Start time of interval | Yes      | Unix timestamp  | Birth time of MET |
| to   | End time fo interval   | Yes      | Unix timestamp  | now               |

**Response**

``` json
  {
    "average": {
      "count": {
        "buy": 50,
        "sell": 52,
        "total": 102
      },
      "eth": {
        "price": {
          "buy": "0.007252026301298182",
          "sell": "0.007183382540284297"
        },
        "in": "327.812729282987817259",
        "out": "357.097723780881573604",
        "total": "684.910453063869390863"
      },
      "usd": {
        "price": {
          "buy": "1.06",
          "sell": "1.05"
        },
        "in": "47846.70",
        "out": "52121.06",
        "total": "99967.75"
      }
    }
  }
  ```

| Name           | Description                                         | Unit   |
| -------------- | --------------------------------------------------- | ------ |
| average        | Average conversion data over selected time interval | -      |
| count.buy      | MET buy count                                       | Number |
| count.sell     | MET sell count                                      | Number |
| count.total    | Sum of buy and sell count                           | Number |
| eth.price.buy  | Average buy price in ACC                            | ETH    |
| eth.price.sell | Average sell price in ACC                           | ETH    |
| eth.in         | ETH came into ACC as a result of MET purchase       | ETH    |
| eth.out        | ETH went out from ACC as a result of MET sell       | ETH    |
| eth.total      | Total of ETH in and out                             | ETH    |
| usd.price.buy  | USD representation of eth.price.buy                 | USD    |
| usd.price.sell | USD representation of eth.price.sell                | USD    |
| usd.in         | USD representation of eth.in                        | USD    |
| usd.out        | USD representation of eth.out                       | USD    |
| usd.total      | Total of USD in and out                             | USD    |
