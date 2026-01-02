<script setup lang="ts">
import BottomChatContainer from '@/components/BottomChatContainer.vue'
import FilterTodo from '@/components/FilterTodo.vue'
import TodoList from '@/components/TodoList.vue'
import NavBar from '@/components/NavBar.vue'
import { useTodoQuery } from '@/composables/useTodoQuery'
import { MagnifyingGlassIcon, ReloadIcon } from '@radix-icons/vue'
import { useDebounce } from '@/lib/debounce'
import { useFilter } from '@/stores/filter'
import { ref, watch } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

const { todoQuery, createTodoMutation } = useTodoQuery()
const filter = useFilter()

const search = ref('')
const debouncedSearch = useDebounce(search, 150)

watch(debouncedSearch, (val) => {
    filter.setSearchQuery(val)
    todoQuery.refetch()
})
</script>

<template>
    <NavBar />

    <div class="container mx-auto min-h-screen flex flex-col text-gray-900 pb-24 px-4">
        <main class="flex-1 pt-8">
            <div class="flex flex-col sm:flex-row gap-4 mb-6">
                <div class="relative flex-1">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-black/50 dark:text-white/50">
                        <MagnifyingGlassIcon />
                    </span>
                    <input type="text" v-model="search"
                        class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#2f2f2f] dark:placeholder:text-gray-400 border border-black/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 dark:text-white shadow-sm transition-all"
                        placeholder="Search tasks...">
                </div>
                <div class="flex gap-2">
                    <FilterTodo />
                    <button @click="todoQuery.refetch()"
                        class="bg-white dark:bg-[#2f2f2f] border border-black/5 dark:border-white/10 text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors">
                        <ReloadIcon :class="todoQuery.isFetching.value ? 'animate-spin' : ''" />
                    </button>
                </div>
            </div>

            <TodoList />
        </main>

        <footer class="fixed bottom-0 left-0 w-full flex justify-center p-4 z-40 pointer-events-none">
            <div class="pointer-events-auto w-full max-w-3xl">
                <BottomChatContainer @submit="(event) => createTodoMutation.mutateAsync(event)"
                    :is-loading="createTodoMutation.isPending.value" />
            </div>
        </footer>
    </div>
    <Toaster position="top-right" richColors />
</template>
