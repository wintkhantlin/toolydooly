<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { TrashIcon, Pencil1Icon, CheckIcon, CalendarIcon } from '@radix-icons/vue'
import { useTodoQuery } from '@/composables/useTodoQuery'
import type { Todo } from '@/types/todo.type'
import { CheckboxIndicator, CheckboxRoot } from 'radix-vue'

const props = defineProps<{ todo: Todo }>()
const { toggleMutation, removeMutation, editMutation } = useTodoQuery()
const editingId = ref<string | null>(null)
const editingText = ref('')
const editInput = ref<HTMLInputElement | null>(null)

const isEditing = computed(() => editingId.value === props.todo._id)

const startEditing = () => {
  editingId.value = props.todo._id
  editingText.value = props.todo.text
}

const saveEdit = () => {
  if (editingText.value.trim() !== props.todo.text && editingText.value.trim() !== '') {
    editMutation.mutate({ id: props.todo._id, text: editingText.value })
  }
  editingId.value = null
}

const cancelEdit = () => {
  editingId.value = null
}

watch(isEditing, async (val) => {
  if (val) {
    await nextTick()
    editInput.value?.focus()
  }
})

const priorityConfig = computed(() => {
  switch (props.todo.priority) {
    case 1: return { color: 'bg-red-500', border: 'border-red-500', text: 'text-red-600 dark:text-red-400', bgSoft: 'bg-red-50 dark:bg-red-900/20', label: 'High' }
    case 2: return { color: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', bgSoft: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Medium' }
    case 3: return { color: 'bg-green-500', border: 'border-green-500', text: 'text-green-600 dark:text-green-400', bgSoft: 'bg-green-50 dark:bg-green-900/20', label: 'Low' }
    default: return { color: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-600 dark:text-gray-400', bgSoft: 'bg-gray-50 dark:bg-gray-900/20', label: 'Normal' }
  }
})

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' 
  }).format(new Date(props.todo.created_at))
})
</script>

<template>
  <div
    class="group relative flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-[#2f2f2f] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200"
    :class="{ 'opacity-60 bg-gray-50 dark:bg-[#2a2a2a]': todo.is_done }"
  >
    <!-- Priority Indicator Strip -->
    <div 
      class="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
      :class="priorityConfig.color"
    ></div>

    <!-- Checkbox -->
    <CheckboxRoot
      :checked="props.todo.is_done"
      @update:checked="() => toggleMutation.mutate(props.todo._id)"
      class="flex-shrink-0 mt-1 w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 flex items-center justify-center hover:border-teal-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
    >
      <CheckboxIndicator class="text-white">
        <CheckIcon class="w-3.5 h-3.5" />
      </CheckboxIndicator>
    </CheckboxRoot>

    <div class="flex-1 min-w-0 ml-2">
      <div v-if="isEditing" class="flex items-center gap-2">
        <input
          type="text"
          v-model="editingText"
          class="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
          @keyup.enter="saveEdit"
          @keyup.esc="cancelEdit"
          @blur="saveEdit"
          ref="editInput"
        />
      </div>
      <div v-else class="flex flex-col gap-1.5">
        <span 
          class="text-[15px] font-medium text-gray-900 dark:text-gray-100 leading-relaxed break-words"
          :class="{ 'line-through text-gray-500 dark:text-gray-500': todo.is_done }"
          @dblclick="startEditing"
        >
          {{ todo.text }}
        </span>
        
        <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span class="flex items-center gap-1">
            <CalendarIcon class="w-3.5 h-3.5" />
            {{ formattedDate }}
          </span>
          <span 
            class="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border border-transparent"
            :class="priorityConfig.bgSoft + ' ' + priorityConfig.text"
          >
            {{ priorityConfig.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        @click="startEditing"
        class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        title="Edit"
      >
        <Pencil1Icon class="w-4 h-4" />
      </button>
      <button 
        @click="removeMutation.mutate(props.todo._id)"
        class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        title="Delete"
      >
        <TrashIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
