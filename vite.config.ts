import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import  autoprefixer  from 'autoprefixer'

export default defineConfig({
    // server:{
    //   port:1420
    // },
    
    css: {
    postcss: {
      plugins: [tailwindcss , autoprefixer],
    },
  },
});