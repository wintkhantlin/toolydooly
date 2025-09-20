<script lang="ts" setup>
import { ref } from 'vue'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-icons/vue'
import { useForm } from '@tanstack/vue-form'
import { createUserSchema } from '@toolydooly/validation-schemas/auth'
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'
import 'vue-sonner/style.css'
import { toast, Toaster } from 'vue-sonner'

const showPassword = ref(false)

const auth = useAuth();
const { push } = useRouter();

const form = useForm({
    defaultValues: {
        username: '',
        email: '',
        password: '',
    },
    validators: {
        onSubmit: createUserSchema,
    },
    onSubmit: async ({ value }) => {
        try {
            await auth.createUser(value);
            await push("/")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Create User failed")
        }
    }
})
</script>

<template>
    <div class="flex h-screen justify-center items-center bg-gray-100 px-4">
        <div class="w-full flex items-center justify-center">
            <div class="bg-white py-6 px-10 border border-gray-500/20 rounded-xl max-w-[500px] w-full">
                <div class="space-y-3 mt-2 mb-6">
                    <h1 class="text-4xl font-bold">Create User</h1>
                    <p class="text-sm text-gray-800">
                        Already Have Account?
                        <RouterLink to="/auth/sign-in" class="underline text-teal-600">Login Here</RouterLink>
                    </p>
                </div>

                <form @submit.prevent="form.handleSubmit" class="space-y-5 mb-4">
                    <div>
                        <form.Field name="email">
                            <template v-slot="{ field }">
                                <label :for="field.name" class="text-sm block mb-1">Email</label>
                                <input :id="field.name" :name="field.name" type="text"
                                    @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                                    placeholder="johndoe@example.com" autocomplete="email"
                                    class="block px-4 py-3 border border-gray-200 w-full outline-teal-400 rounded mt-1" />
                                <em role="alert" class="text-red-500" v-if="!field.state.meta.isValid">{{field.state.meta.errors.map((err) =>
                                    err?.message).join(", ")}}</em>
                            </template>
                        </form.Field>
                    </div>

                    <div>
                        <form.Field name="username">
                            <template v-slot="{ field }">
                                <label :for="field.name" class="text-sm block mb-1">Username</label>
                                <input :id="field.name" :name="field.name" type="text"
                                    @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                                    placeholder="johndoe" autocomplete="username"
                                    class="block px-4 py-3 border border-gray-200 w-full outline-teal-400 rounded mt-1" />
                                <em role="alert" class="text-red-500" v-if="!field.state.meta.isValid">{{field.state.meta.errors.map((err) =>
                                    err?.message).join(", ")}}</em>
                            </template>
                        </form.Field>
                    </div>

                    <div>
                        <form.Field name="password">
                            <template v-slot="{ field }">
                                <div class="flex justify-between items-center mb-1">
                                    <label :for="field.name" class="text-sm block">Password</label>
                                    <button type="button" class="text-sm flex items-center gap-1"
                                        @click="showPassword = !showPassword">
                                        <component :is="showPassword ? EyeOpenIcon : EyeClosedIcon" />
                                        {{ showPassword ? 'Hide' : 'Show' }}
                                    </button>
                                </div>
                                <input :id="field.name" :name="field.name" :type="showPassword ? 'text' : 'password'"
                                    @input="(e) => field.handleChange((e.target as HTMLInputElement).value)"
                                    placeholder="********" autocomplete="current-password"
                                    class="block px-4 py-3 border border-gray-200 w-full outline-teal-400 rounded mt-1" />
                                <em role="alert" class="text-red-500" v-if="!field.state.meta.isValid">{{field.state.meta.errors.map((err) =>
                                    err?.message).join(", ")}}</em>
                            </template>
                        </form.Field>
                    </div>

                    <form.Subscribe>
                        <template v-slot="{ canSubmit, isSubmitting }">
                            <button type="submit" :disabled="isSubmitting || !canSubmit"
                                class="w-full bg-teal-600 text-white py-3 rounded-full cursor-pointer hover:bg-teal-700 active:bg-teal-800 transition duration-100 mt-4">
                                Create User
                            </button>
                        </template>
                    </form.Subscribe>
                </form>
            </div>
        </div>
    </div>
    <Toaster />
</template>
