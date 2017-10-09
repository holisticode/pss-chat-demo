const PORT_LOCAL = 8546; 

var ws = new WebSocket("ws://localhost:" + PORT_LOCAL);

ws.onopen = function() {
  console.log("local ws open");
  ws.send('{"jsonrpc":"2.0","id":"pss_baseAddr","method":"pss_baseAddr","params":null}');
};

ws.onerror =  function(e) {
  console.log("error in WebSocket connection!");
  console.log(e);
};

export default {
  ws: ws,

  send(id, method, params) {
    if (!params) {
      ws.send('{"jsonrpc":"2.0","id":"' + id + '","method":"' + method + '","params":null}');
    } else {
      let jsonrpc = '{"jsonrpc":"2.0","id":"' + id + '","method":"' + method + '","params":' + params + '}';
      ws.send(jsonrpc);
    }
  }
  
}
