<template>
	<div class="demo-setup">
		<h1>PSS Demo Chat Setup</h1>
    <label class="config-label">Your configuration parameters: </label>
		<div class="demo-config" v-if="!configured">
      <div class="enc-config">
        <!--
        <label class="enc-config-label title" for="asym">Encryption:</label>
          <label class="inline hide-checkbox">
			      <input type="checkbox" v-model="asym" />Asymmetric
            <span></span>
          </label>
        -->
			    <asymmetric-key-config :pub-key="asymPubKey" :key-id="asymKeyId"></asymmetric-key-config>
        <!--
			    <asymmetric-key-config v-if="asym" :pub-key="asymPubKey" :key-id="asymKeyId"></asymmetric-key-config>
			    <symmetric-key-config v-else @update-sym-key="updateSymKey" :sym-key-id="symKeyId"></symmetric-key-config>
        -->
      </div>

      <div id="username" class="enc-config-option inline">
        <label class="enc-config-label" for="name">Username:</label>
			  <input v-model="name" /><br>
      </div>
      
			<button class="action" @click="configWithKey" v-if="(asymKeyId || symKeyId) && name">Start</button>
		</div>
		<div v-else>
			<div v-if="asym">
				My publick key: {{asymPubKey}}
				Recipient's public key: <input  v-model="recipientPubKey" />
			</div>
			<div v-else>
				Key: {{symKeyId}}
			</div>
			<p v-for="m of msgs">
				<b>{{m.name}}</b>: {{m.text}}
			</p>
			Please type a message: <input v-model="text" @keyup.enter="sendMessage" />
		</div>
	</div>
</template>

<script>
//import Web3 from 'web3';
import PssService from './PssService';

import SymmetricKeyConfig from './SymmetricKeyConfig.vue';
import AsymmetricKeyConfig from './AsymmetricKeyConfig.vue';
import {decodeFromHex, encodeToHex} from './hexutils';

var base64local = null;
var symkey = false;

var self = this;

export default {
	data() {

		let data = {
			msgs: [],
			text: "",
			symKeyId: null,
			name: "",
			asymKeyId: base64local,
			sympw: "",
			asym: true,
			configured: false,
			asymPubKey: ""
		};

		return data;
	},


	components: {AsymmetricKeyConfig, SymmetricKeyConfig},

  created: function() {
    var self = this;
    this.$root.$on("pss_getPublicKey_received", function(result){
      var pk = new Buffer(result, "base64").toString("hex");
      self.asymPubKey = pk;
    });
    this.$root.$on("pss_baseAddr_received", function(result){
      var localaddr = result;
      base64local = new Buffer(result, "base64").toString("hex");
      console.log("local addr is: " + base64local);
      self.asymKeyId = base64local;
      PssService.send("pss_getPublicKey","pss_getPublicKey", null);
      //ws.send('{"jsonrpc":"2.0","id":"pss_getPublicKey","method":"pss_getPublicKey","params":null}');
    });
  },

	methods: {
		sendMessage() {
			let msg = {
				text: this.text,
				name: this.name
			};

			this.msgs.push(msg);

			let postData = {
				ttl: 7,
				topic: '0x07678231',
				powTarget: 2.01,
				powTime: 100,
				payload: encodeToHex(JSON.stringify(msg)),
			};

			if (this.asym) {
				postData.pubKey = this.recipientPubKey;
				postData.sig = this.asymKeyId;
			} else {
				postData.symKeyID = this.symKeyId;
      }
			this.text = "";
		},

		configWithKey() {
			// TODO use a form
			if (!this.name || this.name.length == 0) {
				alert("Please pick a username");
				return;
			}

			let filter = {
			};

			if (this.asym) {
				if(!this.asymKeyId) {
					  alert("No valid asymmetric key");
				  return;
			  }

			} else {
				if (!this.symKeyId || this.symKeyId.length == 0) {
					alert("please enter a pasword to generate a key!");
				  return;
			  }

			}

			this.configured = true;
      this.$router.push("/pss-chat");
		}
	}
};

</script>
