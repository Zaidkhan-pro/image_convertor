# PixelShift 🎨

**PixelShift** is an instant, client-side image converter with a playful Doodle-themed UI. Convert your images between formats (JPEG, PNG, WebP, AVIF, and more) entirely in your browser. 

Zero uploads, zero server load — 100% private and blazingly fast.

## ✨ Features

- **Client-Side Processing**: Files never leave your device. All conversions happen instantly in the browser.
- **Multiple Formats**: Supports JPEG, PNG, WebP, AVIF, BMP, GIF, ICO, SVG, TIFF, HEIC, and JXL.
- **Batch Conversion**: Drag and drop up to 50 images at once to convert them in bulk.
- **Adjustable Settings**: Tweak output format, quality, and max dimensions (width/height).
- **Doodle Aesthetic**: Features a beautiful, hand-drawn UI with playful fonts (Caveat & Comic Neue) and neo-brutalist shadows.
- **Authentication**: Google OAuth integration via NextAuth.js (free users have conversion limits, authenticated users get unlimited access).

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: Custom CSS (Vanilla, Neo-brutalist / Doodle style)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google Provider)
- **Security**: [Google reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3)
- **File Handling**: `react-dropzone`

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone git@github.com:Zaidkhan-pro/image_convertor.git
cd image_convertor
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory by copying the example file:
```bash
cp .env.local.example .env.local
```

Fill in your actual keys in `.env.local`:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_super_secret_string

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Zaidkhan-pro/image_convertor/issues).

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
