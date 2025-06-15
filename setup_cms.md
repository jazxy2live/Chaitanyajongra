# 🚀 Decap CMS Setup Guide

Your blog CMS is now ready! Here's how to get it running:

## Step 1: Deploy to Netlify (Free)

1. **Push your site to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Added Decap CMS"
   git push origin main
   ```

2. **Go to [Netlify](https://netlify.com)** and sign up (free)

3. **Click "New site from Git"**
   - Connect your GitHub account
   - Select your repository
   - Deploy settings: Leave as default
   - Click "Deploy site"

## Step 2: Enable Netlify Identity (Authentication)

1. **In your Netlify dashboard**, go to:
   - Site settings → Identity
   - Click "Enable Identity"

2. **Configure registration:**
   - Registration: "Invite only" (recommended)
   - External providers: Enable GitHub (optional)

3. **Enable Git Gateway:**
   - Scroll down to "Git Gateway"
   - Click "Enable Git Gateway"

## Step 3: Invite Yourself

1. **Go to Identity tab** in Netlify dashboard
2. **Click "Invite users"**
3. **Enter your email address**
4. **Check your email** and set password

## Step 4: Start Writing! ✍️

1. **Visit your site**: `https://yoursite.netlify.app/admin`
2. **Login with your credentials**
3. **Click "New Essays"**
4. **Write your first article!**

## 🎯 How It Works:

- **Write in beautiful editor** (no code needed!)
- **Hit "Publish"** → Article appears on your site instantly
- **All articles stored** in your GitHub repo
- **100% free forever**

## 🔧 Optional: Custom Domain

1. **In Netlify dashboard**: Domain settings
2. **Add custom domain**: chaitanyajongra.com
3. **Update DNS** as instructed
4. **SSL automatically enabled**

## 📝 Writing Tips:

- **Title**: Shows in browser tab and on page
- **Description**: For SEO and social sharing
- **Body**: Full markdown support (headers, links, bold, etc.)
- **Tags**: Organize your content
- **Featured**: Highlight important articles

---

**That's it!** You now have a professional blog system without touching code. Write away! 🚀 