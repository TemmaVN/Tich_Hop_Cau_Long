import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
        port: 3000,
        proxy: {
            // Trỏ tới API Gateway (Backend_System/Nginx) ở cổng 8080.
            // Gateway sẽ định tuyến tiếp tới flask_service / php_service / java_service.
            // (Nếu chạy trực tiếp Flask_backend không qua gateway, đổi port thành 5000.)
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('Proxy error:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Backend not available. Make sure API Gateway is running on port 8000' }));
                    });
                }
            },
            // Proxy ảnh/video upload — forward về gateway -> Flask phục vụ /uploads
            '/uploads': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})