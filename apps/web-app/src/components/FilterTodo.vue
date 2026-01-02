<script setup lang="ts">
import { useTodoQuery } from '@/composables/useTodoQuery';
import { useFilter } from '@/stores/filter';
import { CaretSortIcon } from '@radix-icons/vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue';
import { SwitchRoot, SwitchThumb } from 'radix-vue'
import { computed, ref, watch } from 'vue';

const filter = useFilter()
const { todoQuery } = useTodoQuery();

// Hide completed toggle
const hideCompleted = computed({
    get: () => filter.hideCompleted,
    set: (value: boolean) => {
        filter.setHideCompleted(value)
        todoQuery.refetch();
    },
});

</script>

<template>
    <PopoverRoot>
        <PopoverTrigger
            class="bg-white dark:bg-[#2f2f2f] border border-black/5 dark:border-white/10 text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors">
            <CaretSortIcon />
            <span class="ml-2">Filter</span>
        </PopoverTrigger>
        <PopoverPortal>
            <PopoverContent
                class="border border-black/5 shadow-sm px-4 bg-white dark:bg-[#2f2f2f] dark:text-white rounded-lg min-w-[250px] pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 space-y-3 z-40 dark:border-white/5"
                align="start" :side-offset="10">
                
                <div class="flex gap-2 items-center justify-between py-2">
                    <label class="text-[15px] leading-none pr-[15px] select-none" for="hide-completed">
                        Hide Completed
                    </label>
                    <SwitchRoot id="hide-completed" v-model:checked="hideCompleted"
                        class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default">
                        <SwitchThumb
                            class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
                    </SwitchRoot>
                </div>
            </PopoverContent>
        </PopoverPortal>
    </PopoverRoot>
</template>
