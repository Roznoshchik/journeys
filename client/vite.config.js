import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  build: {
    sourcemap: true, // keep the sourcemaps
    minify: false, // disable minification
    outDir: '../functions/app/static', // set the output directory for static assets
    emptyOutDir: true, // clear the directory before building
    rollupOptions: {
      output: {
        // Set constant file names without hash suffixes
        entryFileNames: 'main.js',
        chunkFileNames: 'main.js',
        assetFileNames: ({name}) => {
          if (name && name.endsWith('.css')) {
            return 'style.css';
          }
          // Default asset file naming
          return '[name][extname]';
        }
      }
    }
  },
  plugins: [
    {
      name: 'handle-index-html',
      writeBundle() {
        // Define the source of the actual index.html you are working on
        const source = path.resolve(__dirname, './index.html');
        const templatesDestinationDir = path.resolve(__dirname, '../functions/app/templates');
        const templatesDestination = path.join(templatesDestinationDir, 'index.html');
        const staticIndexHtml = path.resolve(__dirname, '../functions/app/static/index.html');

        // Copy the original index.html file to the new location
        fs.copyFile(source, templatesDestination, function(err) {
          if (err) {
            console.error('Error copying original index.html:', err);
          } else {
            console.log(`Original index.html copied to ${templatesDestination}`);
          }
        });

        // Read the copied index.html and update static urls.
        fs.readFile(templatesDestination, 'utf8', function(err, data) {
          if (err) {
            return console.log(err);
          }
          // Regular expression to match 'static/**.**'
          const regex = /static\/(.*?)\.(js|css|jpg|png|gif|svg)/g;
          // Replace found instances with the Flask url_for syntax
          const result = data.replace(regex, "{{ url_for('static', filename='$1.$2') }}");

          // Write the result to the same file
          fs.writeFile(templatesDestination, result, 'utf8', function(err) {
            if (err) return console.log(err);
          });
        });


        // Delete the index.html in static directory if it exists
        if (fs.existsSync(staticIndexHtml)) {
          fs.unlink(staticIndexHtml, function(err) {
            if (err) {
              console.error('Error deleting static index.html:', err);
            } else {
              console.log(`Deleted ${staticIndexHtml}`);
            }
          });
        }
      }
    }
  ]
});
