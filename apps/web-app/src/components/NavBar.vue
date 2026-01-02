<script setup lang="ts">
import Menu from '@/components/Menu.vue'
</script>

<template>
    <header
        class="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
            <RouterLink to="/" class="group flex items-center gap-2.5 outline-none">
                <h1
                    class="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent tracking-tight">
                    ToolyDooly
                </h1>
            </RouterLink>

            <div class="flex items-center gap-4">
                <Menu />
            </div>
        </div>
    </header>
</template>
