import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG = {
  categories: [
    {
      id: "category_1",
      name: "পজিশন",
      enabled: true,
      items: []
    },
    {
      id: "category_2",
      name: "সময়",
      enabled: true,
      items: [
        { id: 101, name: "রাত ৮:৩০ টা", description: "ডিনার ডেটের সঠিক সময়" },
        { id: 102, name: "বিকাল ৫:০০ টা", description: "ঘুরতে যাওয়ার সঠিক সময়" },
        { id: 103, name: "সকাল ১০:০০ টা", description: "ব্রেকফাস্ট করার সময়" }
      ]
    },
    {
      id: "category_3",
      name: "দিন",
      enabled: true,
      items: [
        { id: 201, name: "শুক্রবার", description: "ছুটির দিন" },
        { id: 202, name: "শনিবার", description: "ছুটির দিন" },
        { id: 203, name: "রবিবার", description: "কাজের দিন শুরু" }
      ]
    },
    {
      id: "category_4",
      name: "জায়গা",
      enabled: true,
      items: [
        { id: 301, name: "রেস্টুরেন্ট", description: "সুন্দর রেস্টুরেন্টে ডিনার" },
        { id: 302, name: "পার্ক", description: "বিকালে খোলা বাতাসে হাঁটা" },
        { id: 303, name: "কফি শপ", description: "বসে আড্ডা দেওয়া" }
      ]
    }
  ]
};

function localUploadPlugin() {
  return {
    name: 'local-upload-plugin',
    configureServer(server) {
      const uploadsDir = path.resolve(__dirname, 'public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const configPath = path.join(uploadsDir, 'config.json');
      const imagesJsonPath = path.join(uploadsDir, 'images.json');
      
      // 1. Load config.json or create default
      let configData = DEFAULT_CONFIG;
      if (fs.existsSync(configPath)) {
        try {
          configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (e) {
          configData = DEFAULT_CONFIG;
        }
      } else {
        fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
      }

      // 2. DATA MIGRATION: Migrate images.json items into config.json pictures category
      if (fs.existsSync(imagesJsonPath)) {
        try {
          const legacyImages = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf-8'));
          if (Array.isArray(legacyImages) && legacyImages.length > 0) {
            // Find pictures category
            const picturesCat = configData.categories.find(c => c.id === 'pictures');
            if (picturesCat && (!picturesCat.items || picturesCat.items.length === 0)) {
              picturesCat.items = legacyImages;
              fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
              console.log(`[Migration] Migrated ${legacyImages.length} images from images.json into config.json`);
              // Clear images.json to prevent migrating again
              fs.writeFileSync(imagesJsonPath, JSON.stringify([], null, 2));
            }
          }
        } catch (e) {
          console.error('[Migration] Failed to migrate legacy images:', e);
        }
      }

      server.middlewares.use(async (req, res, next) => {
        // Serve uploads static assets directly to bypass caching issues
        if (req.url.startsWith('/uploads/') && req.method === 'GET') {
          try {
            const filename = req.url.substring(9).split('?')[0];
            const filepath = path.resolve(__dirname, 'public/uploads', filename);
            if (fs.existsSync(filepath)) {
              let ext = path.extname(filename).toLowerCase();
              let contentType = 'image/jpeg';
              if (ext === '.png') contentType = 'image/png';
              else if (ext === '.gif') contentType = 'image/gif';
              else if (ext === '.webp') contentType = 'image/webp';
              else if (ext === '.svg') contentType = 'image/svg+xml';
              else if (ext === '.json') contentType = 'application/json';

              const fileBuffer = fs.readFileSync(filepath);
              res.writeHead(200, { 'Content-Type': contentType });
              res.end(fileBuffer);
              return;
            }
          } catch (e) {
            console.error('Error serving uploads folder:', e);
          }
        }

        // Upload Image to specific category endpoint
        if (req.url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const { categoryId, name, dataUrl, description, duration } = data;
              
              const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (!matches || matches.length !== 3) {
                throw new Error('Invalid image format');
              }
              const buffer = Buffer.from(matches[2], 'base64');
              
              let extension = 'png';
              if (matches[1].includes('jpeg') || matches[1].includes('jpg')) extension = 'jpg';
              else if (matches[1].includes('gif')) extension = 'gif';
              else if (matches[1].includes('webp')) extension = 'webp';
              else if (matches[1].includes('svg')) extension = 'svg';

              const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              const filename = `${Date.now()}-${cleanName}.${extension}`;
              const filepath = path.join(uploadsDir, filename);
              
              fs.writeFileSync(filepath, buffer);
              
              const newImage = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                name: name,
                description: description || '',
                duration: duration ? parseInt(duration) : 0,
                filename: filename,
                url: `/uploads/${filename}`
              };
              
              // Load current config and push to specific category
              const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
              currentConfig.categories = currentConfig.categories.map(cat => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    items: [...(cat.items || []), newImage]
                  };
                }
                return cat;
              });
              
              fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, image: newImage }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } 
        
        // Delete Image from specific category endpoint
        else if (req.url === '/api/delete' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const { categoryId, id } = data;
              
              const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
              currentConfig.categories = currentConfig.categories.map(cat => {
                if (cat.id === categoryId) {
                  const itemToDelete = cat.items.find(item => 
                    typeof item === 'object' && item !== null ? item.id === id : item === id
                  );
                  if (itemToDelete) {
                    if (typeof itemToDelete === 'object' && itemToDelete.filename) {
                      const filepath = path.join(uploadsDir, itemToDelete.filename);
                      if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                      }
                    }
                    return {
                      ...cat,
                      items: cat.items.filter(item => 
                        typeof item === 'object' && item !== null ? item.id !== id : item !== id
                      )
                    };
                  }
                }
                return cat;
              });
              
              fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } 
        
        // Update Item Details and Image in specific category endpoint
        else if (req.url === '/api/update' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const { categoryId, id, name, description, duration, dataUrl } = data;
              
              const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
              let updatedItem = null;

              currentConfig.categories = currentConfig.categories.map(cat => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    items: (cat.items || []).map(item => {
                      // Safe check: handle if item is a string or null
                      const itemId = (typeof item === 'object' && item !== null) ? item.id : item;
                      if (itemId === id) {
                        let filename = item.filename;
                        let url = item.url;

                        if (dataUrl) {
                          // Delete old file if exists
                          if (filename) {
                            const oldFilepath = path.join(uploadsDir, filename);
                            if (fs.existsSync(oldFilepath)) {
                              fs.unlinkSync(oldFilepath);
                            }
                          }

                          // Save new file
                          const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                          if (matches && matches.length === 3) {
                            let extension = 'png';
                            if (matches[1].includes('jpeg') || matches[1].includes('jpg')) extension = 'jpg';
                            else if (matches[1].includes('gif')) extension = 'gif';
                            else if (matches[1].includes('webp')) extension = 'webp';
                            else if (matches[1].includes('svg')) extension = 'svg';

                            const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                            filename = `${Date.now()}-${cleanName}.${extension}`;
                            const filepath = path.join(uploadsDir, filename);
                            
                            fs.writeFileSync(filepath, Buffer.from(matches[2], 'base64'));
                            url = `/uploads/${filename}`;
                          }
                        }

                        updatedItem = {
                          ...(typeof item === 'object' && item !== null ? item : {}),
                          id,
                          name,
                          description: description || '',
                          duration: duration ? parseInt(duration) : 0,
                          filename,
                          url
                        };
                        return updatedItem;
                      }
                      return item;
                    })
                  };
                }
                return cat;
              });
              
              fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, item: updatedItem }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } 
        
        // Save Multi-wheel Config Endpoint
        else if (req.url === '/api/save-config' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        }
        
        // Clear All Endpoint (Resets database to default empty settings)
        else if (req.url === '/api/clear' && req.method === 'POST') {
          try {
            if (fs.existsSync(uploadsDir)) {
              const files = fs.readdirSync(uploadsDir);
              for (const file of files) {
                const filepath = path.join(uploadsDir, file);
                if (fs.statSync(filepath).isFile()) {
                  fs.unlinkSync(filepath);
                }
              }
            }
            // Restore default configuration files
            fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
            if (fs.existsSync(imagesJsonPath)) {
              fs.writeFileSync(imagesJsonPath, JSON.stringify([], null, 2));
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } 
        
        else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localUploadPlugin()],
  server: {
    host: true, // Exposes the server to the local network (WiFi) so mobile devices can access it
    watch: {
      ignored: ['**/public/uploads/**']
    }
  }
});
