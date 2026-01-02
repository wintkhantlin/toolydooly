<script lang="ts" setup>
type ButtonProps = {
  type?: 'button' | 'submit' | 'reset'
  onClick?: (event: MouseEvent) => void,
  disabled?: boolean
}

const props = defineProps<ButtonProps>()
</script>

<template>
  <button :type="props.type || 'button'" @click="props.onClick" :disabled="disabled ?? false"
    :class="[
      'bg-black dark:bg-white dark:hover:bg-white/70 dark:text-black text-white min-w-10 min-h-10 rounded-full p-0 flex items-center justify-center transition-all',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-black/80 active:scale-95'
    ]">
    <slot />
  </button>
</template>
