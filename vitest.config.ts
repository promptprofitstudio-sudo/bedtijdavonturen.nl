import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    resolve: {
        alias: {
            'server-only': 'vitest-mock-server-only', // or just ignore it
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [],
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
})
