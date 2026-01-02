import { ref } from 'vue';
import api from '@/lib/axios';
import { llmActionPayload } from '@toolydooly/validation-schemas';
import type { z } from 'zod';

type LLMActionType = z.infer<typeof llmActionPayload>['type'];

interface LLMResponse {
  success: boolean;
  data?: string;
  error?: string;
  details?: string;
}

export function useLLM() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const processText = async (
    type: LLMActionType,
    text: string
  ): Promise<string | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data } = await api.post<LLMResponse>('/llm', {
        type,
        text,
      });

      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.error || 'LLM processing failed');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while processing text';
      error.value = errorMessage;
      console.error('LLM error:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    processText,
  };
}

