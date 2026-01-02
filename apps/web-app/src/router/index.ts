import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuth } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { requiresAuth: true, title: "ToolyDooly - App" },
        },
        {
            path: "/auth/sign-in",
            name: 'sign-in',
            component: async () => await import("@/views/SignInView.vue"),
            meta: {
                title: "Sign In - ToolyDooly"
            }
        },
        {
            path: "/auth/request-password-reset",
            name: 'request-password-reset',
            component: async () => await import("@/views/RequestPasswordReset.vue"),
            meta: {
                title: "Request Password Reset - ToolyDooly"
            }
        },
        {
            path: "/auth/reset",
            name: 'reset-password',
            beforeEnter: async ({ query }) => {
                const { verifyResetSession } = useAuth();
                const { id } = query;

                if (!id) return { path: '/auth/reset/404' };

                try {
                    await verifyResetSession(String(id));
                } catch {
                    return { path: '/auth/reset/404' };
                }
            },
            component: async () => await import("@/views/ResetView.vue"),
            meta: {
                title: "Reset Password - ToolyDooly"
            }
        },
        {
            path: "/auth/create-user",
            name: 'create-user',
            component: async () => await import("@/views/CreateUserView.vue"),
            meta: {
                title: "Create User - ToolyDooly"
            }
        },
        {
            path: '/:catchAll(.*)',
            name: "not-found",
            component: async () => await import("@/views/PageNotFoundView.vue"),
            meta: {
                title: "Error 404 - Toolydooly"
            }
        }
    ],
})

router.beforeResolve(async (to) => {
    const auth = useAuth();
    document.title = to.meta.title as string ?? "Not Found"

    if (auth.status === "unauthenticated") {
        await auth.checkAuth();
    }

    if (to.meta.requiresAuth && auth.status !== "authenticated") {
        return { path: "/auth/sign-in" };
    }

    if (to.path === "/auth/sign-in" && auth.status === "authenticated") {
        return { path: "/" }
    }
})

export default router;
