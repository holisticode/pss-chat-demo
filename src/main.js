import Vue from 'vue';
import VueRouter from 'vue-router';
import PssChat from './PssChat.vue';
import PssSetup from './PssSetup.vue';

import PssService from './PssService';


Vue.use(VueRouter);

/*
new Vue({
  el: '#app',
  components: { PssChat }
});
*/

// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// `Vue.extend()`, or just a component options object.
// We'll talk about nested routes later.
const routes = [
  { path: '/pss-setup', component: PssSetup},
  { path: '/pss-chat', component: PssChat},
  { path: '/', redirect: 'pss-setup'}
]

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
  routes // short for `routes: routes`
})

// 4. Create and mount the root instance.
// Make sure to inject the router with the router option to make the
// whole app router-aware.
const app = new Vue({
  router
}).$mount('#app')

PssService.ws.onmessage =  function(m) {
  var msg = JSON.parse(m.data);

  if (msg.method == "pss_subscription") {
    let msgtext = msg.params.result.Msg;
    app.$emit("pss_message_received", msgtext);
    return;
  }

  if (msg.id.indexOf("pss_sendAsym") == 0) {
    let id = msg.id.substr("pss_sendAsym".length);
    app.$emit("msg_send_confirmed", id);
    return;
  }

  if (msg.id.indexOf("pss_sendSym") == 0) {
    let id = msg.id.substr("pss_sendSym".length);
    app.$emit("msg_send_confirmed", id);
    return;
  }


  switch(msg.id) {
      // result for address request
      case "pss_stringToTopic":	
        console.log("emit pss_stringToTopic_received");
        app.$emit("pss_stringToTopic_received", msg.result);
        break;
      case "pss_baseAddr":	
        console.log("emit pss_baseAddr_received");
        app.$emit("pss_baseAddr_received", msg.result);
        break;
      // result for send attempt
      case "pss_getPublicKey":
        console.log("emit pss_getPublicKey_received");
        app.$emit("pss_getPublicKey_received", msg.result);
        break;
      case "pss_setPeerPublicKey":
        console.log("emit pss_setPeerPublicKey_received");
        app.$emit("pss_setPeerPublicKey_received", msg.result);
        break;
      case "pss_setSymmetricKey":
        console.log("emit pss_setSymmetricKey_received");
        app.$emit("pss_setSymmetricKey_received", msg.result);
        break;
      case "pss_subscribe":
        console.log("emit pss_subscribe_received");
        app.$emit("pss_subscribe_received", msg.result);
        break;
      default:
        /*
        if (msg.method == "pss_subscription") {
          var keytype = msg.params.result.Asymmetric ? "pubkey" : "symkey";
          var key; 
          if (keytype == "pubkey") {
            key = msg.params.result.Key.substring(0, 18);
          } else {
            for (i = 0; i < symkey.length; i++) {
              if (symkey[i][senderid] == msg.params.result.Key) {
                key = toHexString(symkey[i]["key"].slice(0,8));
              }
            }
          }
          addLog(senderid, keytype + ":" + key + " <<< " + bin2String(base64js.toByteArray(msg.params.result.Msg)));
			  }*/

        console.log(msg);
        break;
    }
}
