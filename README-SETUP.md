# Firebase Setup Instructions

## Local Development Setup

1. **Copy the config template**:
   ```bash
   cp firebase-config.template.js firebase-config.js
   ```

2. **Update firebase-config.js** with your actual Firebase credentials:
   - Replace `your-api-key-here` with your actual API key
   - Replace `your-project.firebaseapp.com` with your actual domain
   - Replace `your-project-id` with your actual project ID
   - etc.

3. **Never commit firebase-config.js** - it's in .gitignore for security

## Production Deployment

For GitHub Pages deployment, you have a few options:

### Option 1: Use GitHub Secrets (Recommended)
- Store Firebase config in GitHub repository secrets
- Use GitHub Actions to inject them during build

### Option 2: Public API Keys (Firebase allows this)
- Firebase API keys are safe to expose publicly
- They're designed to be used in client-side apps
- Firestore security rules protect your data

### Option 3: Environment Variables
- Use a build system that supports environment variables
- Inject config at build time

## Security Notes

- ✅ firebase-config.js is in .gitignore
- ✅ Template file is safe to commit
- ✅ Firestore rules control data access, not API keys
- ✅ Firebase API keys are meant for client-side use
