<script setup lang="ts">
import { 
    SliderIcon, 
    MagicWandIcon,
    FileTextIcon,
    PaperPlaneIcon
} from '@radix-icons/vue'
import { 
    PopoverContent, 
    PopoverPortal, 
    PopoverRoot, 
    PopoverTrigger
} from 'radix-vue'
import { ref, nextTick, watch, computed } from 'vue'
import { useLLM } from '@/composables/useLLM'
import { toast } from 'vue-sonner'

type Priority = 'low' | 'medium' | 'high'

const prompt = ref('')
const priority = ref<Priority>('medium')
const textareaRef = ref<HTMLTextAreaElement>()
const isProcessingAI = ref(false)
const isFocused = ref(false)

const { processText, isLoading: isLLMLoading, error: llmError } = useLLM()

const emit = defineEmits<{
    (e: 'submit', payload: { text: string; priority: Priority }): void
}>()

const props = defineProps<{
    isLoading: boolean
}>()

const priorities: Priority[] = ['low', 'medium', 'high']

const templates = [
    { name: 'Meeting', template: '📅 Meeting with [person] about [topic] at [time]' },
    { name: 'Call', template: '📞 Call [person] regarding [topic]' },
    { name: 'Review', template: '📝 Review [document/project] and provide feedback' },
    { name: 'Email', template: '✉️ Send email to [recipient] about [subject]' }
]

const aiFeatures = [
    { name: 'Fix Grammar', action: 'fix_grammar', icon: '✨', description: 'Correct grammar and spelling' },
    { name: 'Improve Text', action: 'improve_text', icon: '🚀', description: 'Enhance clarity and readability' },
    { name: 'Rewrite', action: 'rewrite', icon: '🔄', description: 'Rephrase in a different way' },
    { name: 'Expand Details', action: 'expand_details', icon: '📝', description: 'Add more details and context' }
]

// Auto-resize textarea
const adjustTextareaHeight = () => {
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 120)}px`
    }
}

watch(prompt, () => {
    nextTick(adjustTextareaHeight)
})

const onSubmit = (e?: Event) => {
    if (e) e.preventDefault()
    if (!prompt.value.trim() || isProcessingAI.value) return

    emit('submit', { text: prompt.value, priority: priority.value })

    prompt.value = ''
    priority.value = 'medium'
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
    }
}

const insertTemplate = (template: string) => {
    prompt.value = template
    nextTick(() => {
        textareaRef.value?.focus()
        adjustTextareaHeight()
    })
}

const handleAIAction = async (action: string) => {
    if (!prompt.value.trim() || isProcessingAI.value) return
    
    isProcessingAI.value = true
    
    try {
        const result = await processText(action as 'fix_grammar' | 'expand_details' | 'improve_text' | 'rewrite', prompt.value)
        
        if (result) {
            prompt.value = result
            nextTick(() => {
                textareaRef.value?.focus()
                adjustTextareaHeight()
            })
            toast.success('Text processed successfully!')
        } else {
            toast.error('Failed to process text. Please try again.')
        }
    } catch (err) {
        console.error('AI processing error:', err)
        toast.error(llmError.value || 'Failed to process text')
    } finally {
        isProcessingAI.value = false
    }
}

watch(isLLMLoading, (loading) => {
    isProcessingAI.value = loading
})

const activePriorityColor = computed(() => {
    if (priority.value === 'high') return 'text-red-500'
    if (priority.value === 'medium') return 'text-yellow-500'
    return 'text-green-500'
})
</script>

<template>
    <div class="w-full max-w-2xl mx-auto px-4">
        <div 
            class="relative w-full rounded-[24px] bg-white dark:bg-[#2f2f2f] shadow-xl border border-black/5 dark:border-white/5 transition-all duration-300"
            :class="{ 'ring-2 ring-teal-500/20 dark:ring-teal-400/20': isFocused }"
        >
            <form @submit.prevent="onSubmit" class="flex flex-col gap-2 p-2">
                
                <div class="flex items-end gap-2">
                    <!-- Left Tools -->
                    <div class="flex items-center gap-1 pb-1.5 pl-1">
                        <!-- Priority Picker -->
                        <PopoverRoot>
                            <PopoverTrigger
                                class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none"
                                :class="activePriorityColor"
                                title="Set Priority"
                            >
                                <SliderIcon class="w-4 h-4" />
                            </PopoverTrigger>
                            <PopoverPortal>
                                <PopoverContent 
                                    side="top" 
                                    align="start" 
                                    :side-offset="10" 
                                    class="rounded-xl w-[200px] bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-zinc-700 shadow-xl z-50 p-3"
                                >
                                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Priority</p>
                                    <div class="space-y-1">
                                        <button v-for="p in priorities" :key="p" type="button"
                                            @click="priority = p"
                                            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm capitalize hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            :class="{ 'bg-gray-100 dark:bg-white/10': priority === p }"
                                        >
                                            <div class="w-2 h-2 rounded-full" 
                                                :class="{ 
                                                    'bg-red-500': p === 'high',
                                                    'bg-yellow-500': p === 'medium',
                                                    'bg-green-500': p === 'low'
                                                }"
                                            ></div>
                                            <span class="dark:text-white">{{ p }}</span>
                                        </button>
                                    </div>
                                </PopoverContent>
                            </PopoverPortal>
                        </PopoverRoot>

                        <!-- AI Tools -->
                        <PopoverRoot>
                            <PopoverTrigger
                                :disabled="!prompt.trim() || isProcessingAI"
                                class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                                title="AI Tools"
                            >
                                <MagicWandIcon class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </PopoverTrigger>
                            <PopoverPortal>
                                <PopoverContent 
                                    side="top" 
                                    align="start" 
                                    :side-offset="10" 
                                    class="rounded-xl w-[240px] bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-zinc-700 shadow-xl z-50 p-2"
                                >
                                    <div class="space-y-1">
                                        <button v-for="feature in aiFeatures" :key="feature.action" type="button"
                                            @click="handleAIAction(feature.action)"
                                            class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors group"
                                        >
                                            <span class="text-base group-hover:scale-110 transition-transform">{{ feature.icon }}</span>
                                            <div class="flex-1">
                                                <div class="text-sm font-medium dark:text-white">{{ feature.name }}</div>
                                            </div>
                                        </button>
                                    </div>
                                </PopoverContent>
                            </PopoverPortal>
                        </PopoverRoot>

                        <!-- Templates -->
                        <PopoverRoot>
                            <PopoverTrigger
                                class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none"
                                title="Templates"
                            >
                                <FileTextIcon class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </PopoverTrigger>
                            <PopoverPortal>
                                <PopoverContent 
                                    side="top" 
                                    align="start" 
                                    :side-offset="10" 
                                    class="rounded-xl w-[280px] bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-zinc-700 shadow-xl z-50 p-2"
                                >
                                    <div class="space-y-1">
                                        <button v-for="t in templates" :key="t.name" type="button"
                                            @click="insertTemplate(t.template)"
                                            class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <div class="font-medium text-sm dark:text-white mb-0.5">{{ t.name }}</div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ t.template }}</div>
                                        </button>
                                    </div>
                                </PopoverContent>
                            </PopoverPortal>
                        </PopoverRoot>
                    </div>

                    <!-- Input Area -->
                    <textarea 
                        ref="textareaRef"
                        v-model="prompt" 
                        placeholder="Type a new task..."
                        @input="adjustTextareaHeight"
                        @keydown.enter.exact.prevent="onSubmit"
                        @keydown.enter.shift.exact="prompt += '\n'"
                        @focus="isFocused = true"
                        @blur="isFocused = false"
                        rows="1"
                        class="flex-1 py-2.5 px-2 bg-transparent outline-none dark:text-white placeholder:text-gray-400 text-[15px] resize-none overflow-hidden min-h-[44px] max-h-[160px]"
                    ></textarea>

                    <!-- Send Button -->
                    <div class="pb-1 pr-1">
                        <button 
                            type="submit"
                            :disabled="props.isLoading || !prompt.trim() || isProcessingAI"
                            class="w-9 h-9 rounded-full flex items-center justify-center bg-black dark:bg-white text-white dark:text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-md"
                        >
                            <div v-if="props.isLoading || isProcessingAI" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <PaperPlaneIcon v-else class="w-4 h-4 -ml-0.5 mt-0.5" />
                        </button>
                    </div>
                </div>

                <!-- AI Processing Status -->
                <div v-if="isProcessingAI" class="px-4 pb-2">
                    <div class="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        AI is enhancing your text...
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>
