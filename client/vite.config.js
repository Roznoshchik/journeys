import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  build: {
    sourcemap: true, // sourcemaps allow us to still see the actual code in the console debugger
    minify: false, // eventually we can set this, but for now the codebase is still small
    outDir: '../functions/app/static/', // set the output directory for static assets
    emptyOutDir: true, // clear the directory before building
    rollupOptions: {
      output: {
        // Set constant file names without hash suffixes - I think eventually we want to remove this to allow
        // for proper caching.
        entryFileNames: 'main.js',
        chunkFileNames: 'main.js',
        assetFileNames: ({ name }) => {
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
    // Images being imported were not adding the /static prefix despite all the documentation
    // and the proper config. So for now, we will ignore that and just manually add the src to
    // our images and then copy over the whole file using this function.
    {
      name: 'handle-static-media',
      writeBundle() {
        const mediaSrc = path.resolve(__dirname, './static/media');
        const mediaDst = path.resolve(__dirname, '../functions/app/static/media');

        fs.cp(mediaSrc, mediaDst, { recursive: true }, (err) => {
          if (err) {
            fs.mkdirSync(mediaDst);
            fs.cpSync(mediaSrc, mediaDst, { recursive: true }, (err) => console.log(err))
          }
        });
      }
    },
    // Since for now we are using Flask, we need to follow it's folder structure.
    // This allows us to write the code here and ensure that all the proper files are
    // copied over to the proper location so that Flask can recognize them.
    {
      name: 'handle-index-html',
      writeBundle() {
        // Define the source of the actual index.html you are working on
        const source = path.resolve(__dirname, './index.html');
        const templatesDestinationDir = path.resolve(__dirname, '../functions/app/templates');
        const templatesDestination = path.join(templatesDestinationDir, 'index.html');
        const staticIndexHtml = path.resolve(__dirname, '../functions/app/static/index.html');

        // Copy the original index.html file to the new location
        fs.copyFile(source, templatesDestination, function (err) {
          if (err) {
            fs.mkdirSync(templatesDestinationDir)
            fs.copyFile(source, templatesDestination, function (err) {
              if (err) {
                return console.log(err);
              }
            })
            console.error('Error copying original index.html:', err);
          } else {
            console.log(`Original index.html copied to ${templatesDestination}`);
          }
        });

        // Delete the index.html in static directory if it exists
        if (fs.existsSync(staticIndexHtml)) {
          fs.unlink(staticIndexHtml, function (err) {
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
