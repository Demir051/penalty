// Simple setup script to create .env file if it doesn't exist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, 'backend', '.env');
const envExamplePath = path.join(__dirname, 'backend', '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
  } else {
    const defaultEnv = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/penalty
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
`;
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Created .env file with default values');
  }
  console.log('⚠️  Please update backend/.env with your configuration before running the app');
} else {
  console.log('✅ .env file already exists');
}



