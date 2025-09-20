<script lang="ts" setup>
import { ref } from 'vue'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-icons/vue'
import { useForm } from '@tanstack/vue-form'
import { changePasswordSchema } from '@toolydooly/validation-schemas/auth' // create a schema for password + confirmPassword
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Toaster, toast } from 'vue-sonner'

import 'vue-sonner/style.css'
import { useUrlSearchParams } from '@vueuse/core'

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const auth = useAuth()
const { push } = useRouter()

const form = useForm({
    defaultValues: {
        password: '',
        confirmPassword: '',
    },
    validators: {
        onSubmit: changePasswordSchema,
    },
    onSubmit: async ({ value }) => {
        try {
            const params = useUrlSearchParams();

            await auth.changePassword({
                newPassword: value.password,
                sessionId: params.id as string
            })
            toast.success("Password changed successfully")
            
            setTimeout(() => {
                push("/")
            })
        } catch {
            toast.error("Invalid or expired session")
        }
    }
})
</script>

<template>
    <div class="flex h-screen justify-center items-center bg-gray-100 px-4">
        <div class="w-full flex items-center justify-center">
            <div class="bg-white py-6 px-10 border border-gray-500/20 rounded-xl max-w-[500px] w-full">
                <div class="space-y-3 mt-2 mb-6">
                    <h1 class="text-4xl font-bold">Change Password</h1>
                </div>

                <form @submit.prevent="form.handleSubmit" class="space-y-5 mb-4">
                    <div>
                        <form.Field name="password">
                            <template v-slot="{ field }">
                                <div class="flex justify-between items-center mb-1">
                                    <label :for="field.name" class="text-sm block">New Password</label>
                                    <button type="button" class="text-sm flex items-center gap-1"
                                        @click="showPassword = !showPassword">
                                        <component :is="showPassword ? EyeOpenIcon : EyeClosedIcon" />
                                        {{ showPassword ? 'Hide' : 'Show' }}
                                    </button>
                                </div>
                                <input :id="field.name" :name="field.name" :type="showPassword ? 'text' : 'password'"
                                    @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                                    placeholder="********" autocomplete="new-password"
                                    class="block px-4 py-3 border border-gray-200 w-full outline-teal-400 rounded mt-1" />
                                <em role="alert" class="text-red-500"
                                    v-if="!field.state.meta.isValid">{{field.state.meta.errors.map(err =>
                                        err?.message).join(", ")}}</em>
                            </template>
                        </form.Field>
                    </div>

                    <div>
                        <form.Field name="confirmPassword">
                            <template v-slot="{ field }">
                                <div class="flex justify-between items-center mb-1">
                                    <label :for="field.name" class="text-sm block">Confirm Password</label>
                                    <button type="button" class="text-sm flex items-center gap-1"
                                        @click="showConfirmPassword = !showConfirmPassword">
                                        <component :is="showConfirmPassword ? EyeOpenIcon : EyeClosedIcon" />
                                        {{ showConfirmPassword ? 'Hide' : 'Show' }}
                                    </button>
                                </div>
                                <input :id="field.name" :name="field.name"
                                    :type="showConfirmPassword ? 'text' : 'password'"
                                    @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                                    placeholder="********" autocomplete="new-password"
                                    class="block px-4 py-3 border border-gray-200 w-full outline-teal-400 rounded mt-1" />
                                <em role="alert" class="text-red-500"
                                    v-if="!field.state.meta.isValid">{{field.state.meta.errors.map(err =>
                                        err?.message).join(", ")}}</em>
                            </template>
                        </form.Field>
                    </div>

                    <form.Subscribe>
                        <template v-slot="{ canSubmit, isSubmitting }">
                            <button type="submit" :disabled="isSubmitting || !canSubmit"
                                class="w-full bg-teal-600 text-white py-3 rounded-full cursor-pointer hover:bg-teal-700 active:bg-teal-800 transition duration-100 mt-4">
                                Change Password
                            </button>
                        </template>
                    </form.Subscribe>
                </form>
            </div>
        </div>
    </div>
    <Toaster />
</template>
