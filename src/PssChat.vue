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
             <option value="t" v-for="t in topics">
                {{t}}
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
            <div v-bind:class="{'msg-recv': msg.recv }" class="msg">{{msg.text}}</div>
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
      <button class="action" @click="doAddPeer">Add</button>
      <button class="cancel" @click="cancel">Cancel</button>
    </div>
	</div>
</template>

<script>
import PssService from './PssService';
import {decodeFromHex, encodeToHex, string2Bin} from './hexutils';

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
      addingPeer: false,
      newTopic: "",
      topics: ["None"],
      peers: [],
      messages: [],
      newMsg: ""
		};

		return data;
	},

	components: {},

  created: function() {
    var self = this;
    this.$root.$on("pss_subscribe_received", function(result) {
      let newt = result;
      self.topics.unshift(newt);
    });
    this.$root.$on("msg_send_confirmed", function(result) {
      self.setMessageRead(result);
    });
  },

	methods: {

    setMessageRead(result) {
      let id = parseInt(result);
      for (let i=0; i<self.messages.length; i++) {
        if (self.messages[i].id == id) {
          self.messages[id].recv = true;
        }
      }
    },

		addPeer() {
      this.addingPeer = true;  
    },

    shortLabel(channel) {
      return channel.substring(0,8) + "...";
    },

    doAddPeer() {
      if (!this.remoteKey) {
        alert("Please enter a valid peer key!")
        return;
      }
      this.channels.push(this.remoteKey);
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
      this.subscribeTopic(this.newTopic);
    },

    selectChannel(ch) {
      this.selectedChannel = ch;
    },

    subscribeTopic(topic) {
      PssService.send("pss_subscribe","pss_stringToTopic", '["' + topic + '"]');
    },

		sendMessage(newMsg) {
			let msg = {
        id: cnt,
				text: newMsg,
				name: "Me",
        recv : false
			};
			this.messages.push(msg);

			if (this.asym) {
        PssService.send("pss_sendAsym" + cnt++, "pss_sendAsym", '["' + encodeToHex(this.selectedChannel) + '","' + this.topics[0] + '",[' + string2Bin(msg.text) + ']]');
			} else {
        PssService.send("pss_sendSym" + cnt++, "pss_sendSym", '["' + encodeToHex(this.selectedChannel) + '","' + this.topics[0] + '",[' + string2Bin(msg.text) + ']]');
      }
		}
	}
};
</script>
