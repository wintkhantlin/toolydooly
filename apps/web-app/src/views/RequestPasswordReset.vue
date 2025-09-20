<script lang="ts" setup>
import { useForm } from '@tanstack/vue-form'
import { forgetPasswordSchema } from '@toolydooly/validation-schemas/auth'
import { useAuth } from '@/stores/auth'
import 'vue-sonner/style.css'
import { toast, Toaster } from 'vue-sonner'
import { RouterLink, useRouter } from 'vue-router'

const { requestResetPassword } = useAuth()
const { push } = useRouter();

const form = useForm({
    defaultValues: {
        identifier: '',
    },
    validators: {
        onSubmit: forgetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
        try {
            await requestResetPassword(value)
            push("/")
        } catch {
            toast.error("Oops! No account found with those details.")
        }
    },
})
</script>

<template>
    <div class="flex h-screen justify-center items-center bg-gray-100 px-4">
        <div class="w-full flex items-center justify-center">
            <div class="bg-white py-6 px-10 border border-gray-500/20 rounded-xl max-w-[500px] w-full">
                <div class="space-y-3 mt-2 mb-6">
                    <h1 class="text-3xl font-bold">Request Password Reset</h1>
                    <p class="text-sm text-gray-700">Check your inbox! We’ll send you a link—just click it to change
                        your password.</p>
                    </div>
                    
                    <form @submit.prevent="form.handleSubmit" class="space-y-3 mb-4">
                        <div>
                            <form.Field name="identifier">
                                <template v-slot="{ field }">
                                    <label :for="field.name" class="text-sm block mb-1">Email or Username</label>
                                    <input :id="field.name" :name="field.name" type="text"
                                    @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                                    placeholder="johndoe / johndoe@example.com" autocomplete="email"
                                    class="block px-4 py-3 border border-gray-200 w-full outline-teal-400 rounded mt-1" />
                                <em role="alert" class="text-red-500"
                                    v-if="!field.state.meta.isValid">{{field.state.meta.errors.map((err) =>
                                        err?.message).join(", ")}}</em>
                            </template>
                        </form.Field>
                    </div>

                    <form.Subscribe>
                        <template v-slot="{ canSubmit, isSubmitting }">
                            <RouterLink to="/auth/sign-in" class="underline text-teal-500">Return to Sign In</RouterLink>
                            <button type="submit" :disabled="isSubmitting || !canSubmit"
                                class="w-full bg-teal-600 text-white py-3 rounded-full cursor-pointer hover:bg-teal-700 active:bg-teal-800 transition duration-100 mt-4">
                                Request Reset Mail
                            </button>
                        </template>
                    </form.Subscribe>
                </form>
            </div>
        </div>
    </div>
    <Toaster />
</template>
