<script setup lang="ts">
import { computed } from 'vue'
import { useTodoQuery } from '@/composables/useTodoQuery'
import TodoItem from './TodoItem.vue'
import type { Todo } from '@/types/todo.type'

const { todoQuery } = useTodoQuery()

const groupedTodos = computed(() => {
  const todos = [...(todoQuery.data.value ?? [])].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const groups: Record<string, Todo[]> = {}
  for (const todo of todos) {
    const dateKey = new Date(todo.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(todo)
  }

  for (const key in groups) {
    groups[key].sort((a, b) => Number(a.is_done) - Number(b.is_done))
  }

  return groups
})
</script>

<template>
  <div v-if="!todoQuery.data.value" class="space-y-4">
    <div v-for="n in 5" :key="n"
      class="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-gray-200 dark:bg-white/1 h-16"></div>
  </div>

  <p v-else-if="Object.keys(groupedTodos).length === 0" class="flex flex-col items-center justify-center text-center py-16 bg-white dark:bg-[#2f2f2f] rounded-xl border border-black/5 dark:border-white/5 border-dashed">
    <div class="p-4 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-400 dark:text-gray-500">
        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="text-lg font-medium text-gray-900 dark:text-white mb-1">No tasks found</span>
    <span class="text-sm text-gray-500 dark:text-gray-400">Add a new task below to get started!</span>
  </p>

  <div v-else class="space-y-6">
    <div v-for="(todos, date) in groupedTodos" :key="date">
      <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2">{{ date }}</h2>
      <TransitionGroup name="list" tag="div" class="space-y-2">
        <TodoItem v-for="todoItem in todos" :key="todoItem._id" :todo="todoItem" />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
