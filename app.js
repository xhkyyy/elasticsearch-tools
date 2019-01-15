const express = require('express');
const app = express();
const request = require('request');
const bodyParser = require('body-parser');
const CAT_SHARD_URI = '/_cat/shards?pretty';
const CAT_NODE_STATS_URI = '/_nodes/stats';

function splitTextLine(line) {
  var arr = line.replace(/\s\s+/g, ' ').split(" ");
  for (let index = 0; index < arr.length; index++) {
    arr[index] = arr[index].trim();
  }
  return arr;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function buildESReqOptions(esurl, uname, pwd, uri) {
  var suffix = esurl.substr(-1);
  if (suffix == '\\' || suffix == '/') {
    esurl = esurl.substr(0, esurl.length - 1);
  }
  return {
    'url': esurl + uri,
    'auth': {
      'user': uname,
      'pass': pwd
    }
  }
}

function node_list_fn(req, res) {
  request(buildESReqOptions(req.body.esurl, req.body.uname, req.body.pwd, CAT_SHARD_URI), function (error, response, body) {
    var arr = body.split("\n");
    var m = new Map();
    arr.forEach(element => {
      var arr = splitTextLine(element);
      if (arr.length >= 8) {
        if (!m.has(arr[7])) {
          var node_shards = {
            p_list: [],
            r_list: []
          };
          m.set(arr[7], node_shards);
        }

        var shard = {
          id: arr[1],
          role: arr[2],
          name: arr[0]
        }

        if (arr[2] == 'p') {
          m.get(arr[7]).p_list.push(shard);
        } else {
          m.get(arr[7]).r_list.push(shard);
        }
      }
    });

    var rs = {
      nodes: []
    };

    m.forEach((value, key) => {
      var node_shards = {
        node: key,
        shards: {
          p_list: value.p_list,
          r_list: value.r_list
        }
      };
      rs.nodes.push(node_shards);
    });

    res.send(rs);
  });
}

function cat_shards_fn(req, res) {
  request(buildESReqOptions(req.body.esurl, req.body.uname, req.body.pwd, CAT_SHARD_URI), function (error, response, body) {
    var arr = body.split("\n");
    var m = new Map();
    arr.forEach(element => {
      var arr = splitTextLine(element);
      if (arr.length >= 8) {
        if (arr[2] == req.query.s) {
          if (m.has(arr[7])) {
            m.set(arr[7], m.get(arr[7]) + 1);
          } else {
            m.set(arr[7], 1);
          }
        } else if (!m.has(arr[7])) {
          m.set(arr[7], 0);
        }
      }
    });

    var dataArray = [],
      labelsArray = [],
      backgroundColorArray = [];
    var rs = {
      datasets: [{
        data: dataArray,
        backgroundColor: backgroundColorArray
      }],

      labels: labelsArray
    };

    m.forEach((value, key) => {
      dataArray.push(value);
      labelsArray.push(key);
      backgroundColorArray.push(getRandomColor());
    });

    res.send(rs);
  });
}

function buildTransportResult() {
  var rs = {
    labels: [],
    datasets: [{
      label: '流出流量',
      backgroundColor: getRandomColor(),
      data: []
    }, {
      label: '流入流量',
      backgroundColor: getRandomColor(),
      data: []
    }]
  };
  return rs;
}

function cat_node_stats_fn(req, res) {
  request(buildESReqOptions(req.body.esurl, req.body.uname, req.body.pwd, CAT_NODE_STATS_URI), function (error, response, body) {
    var rs = buildTransportResult();
    var jsonObj = JSON.parse(body);
    for (const key in jsonObj.nodes) {
      rs.labels.push(jsonObj.nodes[key]['name']);
      rs.datasets[0].data.push(jsonObj.nodes[key]['transport']['tx_size_in_bytes']);
      rs.datasets[1].data.push(jsonObj.nodes[key]['transport']['rx_size_in_bytes']);
    }

    res.send(rs);
  });
}

app.use('/static', express.static('static'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.post('/node_list', function (req, res) {
  node_list_fn(req, res);
});

app.post('/cat_shards', function (req, res) {
  cat_shards_fn(req, res);
});

app.post('/cat_node_stats', function (req, res) {
  cat_node_stats_fn(req, res);
});

var port = 13000;
app.listen(port, '127.0.0.1', () => console.log(`App listening on port ${port}!`))