<template>
	<div class="site-wrapper">
    <header>
		  <h1 class="page-title">PSS Demo Chat Application</h1>
    </header>

	  <div class="chat-wrapper">

      <div class="chat-channels">
        <div class="channel-title">
          Your conversations
        </div>  
        <ul class="channel-list">
          <li @click="selectChannel(ch)" class="channel-item" v-for="ch in channels">
            <img class="conn-icon" src="/img/asym.png" v-if="ch.asym" />
            <img class="conn-icon" src="/img/sym.png" v-else />
             {{ shortLabel(ch.remote) }}
          </li>
        </ul>
        <div class="add-peer-section">
          <button id="add-peer-btn" class="action" @click="addPeer">Add Peer</button>
        </div>
      </div>

      <div class="chat-window">

        <div class="topic-section">
		      <div class="topic-selection">
			      <label> Selected Topic:</label>
            <select class="topic-selector" id="pss_topic_send">
             <option :value="t.value" v-for="t in topics">
                {{t.label}}
             </option>
            </select>
		      </div>
		      <div class="set-topic">
            <input type="text" v-model="newTopic"/> 
            <button id="pss_topic_add" @click="addTopic">Subscribe topic</button> 
          </div>
	      </div>
        <div class="chat-messages">
          <div class="pss-message" v-for="msg in messages">
            <div v-bind:class="{'msg-recv': msg.recv, 'msg-remote': msg.remote }" class="msg">{{msg.text}}</div>
          </div> 
        </div>

        <div class="my-message" v-if="(selectedChannel && topics.length > 1)">
          <input type="text" class="type-message" v-model="newMsg" v-on:keyup.enter="sendMsg"/>
        </div>

      </div>

    </div>
    <div class="add-peer-dialog" v-if="addingPeer">
      <label class="peer-config-label title" for="asym">Encryption:</label>
        <label class="inline hide-checkbox">
          <input type="checkbox" v-model="asym" />Asymmetric
          <span></span>
      </label>
      <div class="asym-config" v-if="asym">
        <label class="full dialog-elem">Enter the peer's public key</label>
        <input class="full dialog-elem" type="text" v-model="remoteKey" />
      </div>
      <div class="sym-config" v-else>
        <div class="std-label">Generate Symmetric Key: </div>
        <div class="enc-config-value">
          <button class="small-action" @click="updateSymKey">Generate</button>
        </div>
        <div class="full dialog-elem">
          Symmetric key ID:
        </div>
        <input type="text" class="full dialog-elem" v-model="remoteKey"/>
  <!--
			  <symmetric-key-config @update-sym-key="updateSymKey" :sym-key-id="remoteKey"></symmetric-key-config>
-->
      </div>
      <label class="full dialog-elem">Enter the peer's overlay address</label>
      <input class="full dialog-elem" type="text" v-model="remoteAddr" />
      <button class="action" v-if="remoteKey && remoteAddr" @click="registerPeer">Add</button>
      <button class="cancel" @click="cancel">Cancel</button>
    </div>
	</div>
</template>

<script>
import PssService from './PssService';
import SymmetricKeyConfig from './SymmetricKeyConfig.vue';
import {decodeFromHex, encodeToHex, string2Bin} from './hexutils';
import Base64 from './base64js.min';

var cnt = 0;

export default {
	data() {

		let data = {
			msgs: [],
			text: "",
			symKeyId: null,
			name: "",
			asymKeyId: null,
			sympw: "",
			asym: true,
			configured: false,
			asymPubKey: "",
      channels: [],
      selectedChannel: false,
      remoteKey: "",
      remoteAddr: "",
      addingPeer: false,
      newTopic: "",
      topics: [{label:"None", value:""}],
      peers: [],
      messages: [],
      newMsg: ""
		};

		return data;
	},

	components: {SymmetricKeyConfig},

  created: function() {
    var self = this;
    this.$root.$on("pss_stringToTopic_received", function(result) {
      let topic = result;
      console.log(topic);
      self.topics.unshift({label: decodeFromHex(topic), value: topic});
      self.subscribeTopic(topic);
    });
    this.$root.$on("pss_subscribe_received", function(result) {
      let newt = result;
      console.log(newt);
    });
    this.$root.$on("msg_send_confirmed", function(result) {
      self.setMessageRead(result);
    });
    this.$root.$on("pss_setPeerPublicKey_received", function(result) {
      self.doAddPeer(result, true);
    });
    this.$root.$on("pss_setSymmetricKey_received", function(result) {
      self.doAddPeer(result, false);
    });
    this.$root.$on("pss_message_received", function(result) {
      self.messageReceived(result);
    });
  },

	methods: {

		updateSymKey(sympw) {
      this.symKeyId = toHexString(generateSymKey()); 
      this.remoteKey = this.symKeyId;
		},

    setMessageRead(result) {
      let id = parseInt(result);
      for (let i=0; i<this.messages.length; i++) {
        if (this.messages[i].id == id) {
          this.messages[id].recv = true;
        }
      }
    },

    messageReceived(msg) {
      let decoded = new Buffer(msg, "base64").toString();
      
			let displaymsg = {
        id: cnt,
				text: decoded,
				name: "Other",
        recv : true,
        remote: true
			};

			this.messages.push(displaymsg);
    },

		addPeer() {
      this.addingPeer = true;  
    },

    shortLabel(channel) {
      return channel.substring(0,8) + "...";
    },

    registerPeer() {
      if (!this.remoteKey) {
        alert("Please enter a valid peer key!")
        return;
      }
      if (!this.remoteAddr) {
        alert("Please enter a valid peer address!")
        return;
      }
      if (this.asym) {
        PssService.send("pss_setPeerPublicKey","pss_setPeerPublicKey",'[[' + Base64.toByteArray(new Buffer(this.remoteKey, "hex").toString('base64')) + '],"' + this.topics[0].value + '",[' + Base64.toByteArray(new Buffer(this.remoteAddr, "hex").toString('base64')) + ']]');
      } else {
        PssService.send("pss_setSymmetricKey","pss_setSymmetricKey",'[[' + Base64.toByteArray(new Buffer(this.remoteKey, "hex").toString('base64')) + '],"' + this.topics[0].value + '",[' + Base64.toByteArray(new Buffer(this.remoteAddr, "hex").toString('base64')) + '], true]');
      }
    },

    doAddPeer(result, asym) {
      let newch = {};
      if (asym) {
        newch.remote = this.remoteAddr;
        newch.remoteKey = this.remoteKey;
        newch.asym = true;
      } else {
        newch.remote = this.remoteAddr;
        newch.remoteKey = result;
        newch.asym = false;
      }
      this.channels.push(newch);
      if (this.channels.length == 1) {
        this.selectChannel(this.channels[0]);
      }       
      this.addingPeer = false;  
    },

    cancel() {
      this.addingPeer = false;  
    },

    sendMsg() {
      console.log("sendMsg");
      if (!this.newMsg) {
        return;
      }
      console.log(this.newMsg);

      this.sendMessage(this.newMsg);
      this.newMsg = "";
    },

    addTopic() {
      if (!this.newTopic) {
        alert("Please enter a valid topic!");
        return
      }
      this.stringToTopic(this.newTopic);
    },

    selectChannel(ch) {
      this.selectedChannel = ch;
    },

    stringToTopic(topic) {
      PssService.send("pss_stringToTopic","pss_stringToTopic", '["' + topic + '"]');
    },

    subscribeTopic(topic) {
      PssService.send("pss_subscribe","pss_subscribe", '["receive","' + topic + '"]');
    },

		sendMessage(newMsg) {
			let msg = {
        id: cnt,
				text: newMsg,
				name: "Me",
        recv : false,
        remote: false
			};
			this.messages.push(msg);

			if (this.asym) {
        PssService.send("pss_sendAsym" + cnt++, "pss_sendAsym", '["0x' + this.selectedChannel.remoteKey + '","' + this.topics[0].value + '",[' + string2Bin(msg.text) + ']]');
			} else {
        PssService.send("pss_sendSym" + cnt++, "pss_sendSym", '["' + this.selectedChannel.remoteKey + '","' + this.topics[0].value + '",[' + string2Bin(msg.text) + ']]');
      }
		}
	}
};

function generateSymKey() {
	var a = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		a[i] = Math.floor(Math.random() * 255);
	}
  return a;
};

// cheekily borrowed from https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

</script>
