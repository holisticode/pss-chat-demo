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
            > {{ shortLabel(ch) }}
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
      <label class="full dialog-elem" v-if="asym">Enter the peer's public key</label>
      <label class="full dialog-elem" v-else>Enter the symmetric key for your peer's connection</label>
      <input class="full dialog-elem" type="text" v-model="remoteKey" />
      <label class="full dialog-elem">Enter the peer's overlay address</label>
      <input class="full dialog-elem" type="text" v-model="remoteAddr" />
      <button class="action" v-if="remoteKey && remoteAddr" @click="registerPeer">Add</button>
      <button class="cancel" @click="cancel">Cancel</button>
    </div>
	</div>
</template>

<script>
import PssService from './PssService';
import {decodeFromHex, encodeToHex, string2Bin} from './hexutils';
import Base64 from './base64js.min';

const defaultRecipientPubKey = "0x04ffb2647c10767095de83d45c7c0f780e483fb2221a1431cb97a5c61becd3c22938abfe83dd6706fc1154485b80bc8fcd94aea61bf19dd3206f37d55191b9a9c4";
const defaultTopic = "0x5a4ea131";

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
			topic: defaultTopic,
			recipientPubKey: defaultRecipientPubKey,
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

	components: {},

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
      self.doAddPeer(result);
    });
    this.$root.$on("pss_message_received", function(result) {
      self.messageReceived(result);
    });
  },

	methods: {

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
      PssService.send("pss_setPeerPublicKey","pss_setPeerPublicKey",'[[' + Base64.toByteArray(new Buffer(this.remoteKey, "hex").toString('base64')) + '],"' + this.topics[0].value + '",[' + Base64.toByteArray(new Buffer(this.remoteAddr, "hex").toString('base64')) + ']]');
    },

    doAddPeer() {
      this.channels.push(this.remoteAddr);
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
        PssService.send("pss_sendAsym" + cnt++, "pss_sendAsym", '["0x' + this.remoteKey + '","' + this.topics[0].value + '",[' + string2Bin(msg.text) + ']]');
			} else {
        PssService.send("pss_sendSym" + cnt++, "pss_sendSym", '["0x' + this.selectedChannel + '","' + this.topics[0].value + '",[' + string2Bin(msg.text) + ']]');
      }
		}
	}
};
</script>
