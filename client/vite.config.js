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
      input: {
        index: './index.html', // Your existing entry
        map: './map.html' // Path to your map.html
      },
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
      name: 'handle-html-files',
      writeBundle() {
        const files = ['index.html', 'map.html'];
        const templatesDestinationDir = path.resolve(__dirname, '../functions/app/templates');
        const staticDestinationDir = path.resolve(__dirname, '../functions/app/static');

        for (let file of files) {
          const source = path.join(staticDestinationDir, file);
          const destination = path.join(templatesDestinationDir, file);

          // First, read the source file
          fs.readFile(source, 'utf8', function (err, data) {
            if (err) {
              console.error('Error reading source file:', err);
              return;
            }

            // Replace "/main" with "/static/main"
            let modifiedData = data.replace(/"\/main/g, '"/static/main');
            modifiedData = modifiedData.replace(/"\/style/g, '"/static/style');

            // Write the modified content to the destination
            fs.writeFile(destination, modifiedData, function (err) {
              if (err) {
                console.error('Error writing modified file:', err);
                // If the directory does not exist, create it and try again
                fs.mkdirSync(templatesDestinationDir, { recursive: true });
                fs.writeFile(destination, modifiedData, function (err) {
                  if (err) {
                    return console.log(err);
                  }
                });
              } else {
                console.log(`Modified ${file} copied to ${destination}`);
              }

              // After successfully writing, delete the source file
              if (fs.existsSync(source)) {
                fs.unlink(source, function (err) {
                  if (err) {
                    console.error('Error deleting static file:', err);
                  } else {
                    console.log(`Deleted ${source}`);
                  }
                });
              }
            });
          });
        }
      }
    }

  ]
});
