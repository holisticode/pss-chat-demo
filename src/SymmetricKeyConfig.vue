<template>
	<div class="enc-config-option">
    <div class="enc-config-label">
		  Generate Symmetric Key: 
    </div>
    <div class="enc-config-value">
			<button class="action" @click="updateKey">Generate</button>
    </div>
    <br/>
    <br/>
    <div class="enc-config-label">
		  Symmetric key ID:
    </div>
    <div class="enc-config-value">
      {{symKeyId || "Click button above to generate the key"}}
    </div>
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
