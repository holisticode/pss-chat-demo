<template>
	<div class="enc-config-option">
    <div class="std-label">
		  Generate Symmetric Key: 
    </div>
    <div class="enc-config-value">
			<button class="small-action" @click="updateKey">Generate</button>
    </div>
    <br/>
    <br/>
    <div class="full dialog-elem">
		  Symmetric key ID:
    </div>
    <input type="text" class="full dialog-elem" v-model="symKeyId"/>
	</div>
</template>

<script>
export default {
	props: ['symKeyId'],

	data() {
		return {
			sympw: ""
		}
	},

	methods: {
		updateKey() {
			this.$emit('update-sym-key', this.sympw);
		}
	}
}
</script>
