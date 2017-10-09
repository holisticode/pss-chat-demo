<template>
	<div class="enc-config-option">
    <div class="enc-config-label">
		  Your Swarm overlay address: 
    </div>
    <div class="enc-config-value">
			<p v-if="keyId">
        {{keyId}}
      </p>
			<p v-else>
        Invalid. Are you connected to a PSS node?
      </p>
    </div>
    <br/>
    <div class="enc-config-label">
      Public key: 
    </div>
    <div class="enc-config-value small">
		  {{pubKey}}
    </div>
	</div>
</template>

<script>
export default {
	props: ["pubKey", "keyId"],
	data() {
		return {
			/*keyId: this.prop.keyId,
			pubKey: this.prop.pubKey*/
		};
	},

	methods: {
		generateKey() {
			this.emit('new-keypair');
		}
	}
}
</script>
