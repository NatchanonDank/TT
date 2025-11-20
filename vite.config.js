import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // ⭐ ต้องมี ไม่งั้น external host เข้าไม่ได้เลย
    allowedHosts: [
      "https://070d79d79ff2.ngrok-free.app"  // ⭐ ต้องใส่โดเมนจริงตรงๆ
    ]
  }
});
