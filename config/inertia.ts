import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'
import { User } from '#models/index'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    auth: (ctx: HttpContext) => ctx.inertia.always(async () => {
      try {
        await ctx.auth.check()
        const user = ctx.auth.user as User | undefined

        return {
          user: user
            ? {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
              }
            : null,
        }
      } catch {
        return { user: null }
      }
    }),
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: false,
    entrypoint: 'inertia/app/ssr.tsx'
  }
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
