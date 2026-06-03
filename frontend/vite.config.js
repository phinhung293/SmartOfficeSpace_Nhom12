import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Nếu cổng 5173 bị chiếm, nó sẽ báo lỗi chứ không tự nhảy sang 5174, 5175
  },
})
