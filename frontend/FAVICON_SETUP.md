# Favicon Setup

The site requires favicon files to be placed in the `public` directory. 

## Required Files

The following files should be created and placed in `frontend/public/`:

- `favicon.ico` (16x16 and 32x32)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

## How to Generate Favicons

### Option 1: Use an Online Generator (Recommended)

1. Create a logo/icon image (512x512 PNG recommended)
2. Visit https://realfavicongenerator.net/
3. Upload your image
4. Download the generated package
5. Extract all files to `frontend/public/`

### Option 2: Use Favicon.io

1. Visit https://favicon.io/
2. Choose one of the options:
   - Generate from text
   - Generate from image
   - Generate from emoji
3. Download the package
4. Extract all files to `frontend/public/`

### Option 3: Manual Creation with ImageMagick

If you have ImageMagick installed, you can run:

```bash
cd frontend/public

# Create a simple red/black gradient icon
convert -size 512x512 xc:none \
  -fill "rgb(220,38,38)" -draw "circle 256,256 256,50" \
  -fill "rgb(10,10,10)" -draw "circle 256,256 256,150" \
  icon-512.png

# Generate all sizes
convert icon-512.png -resize 192x192 android-chrome-192x192.png
convert icon-512.png -resize 180x180 apple-touch-icon.png
convert icon-512.png -resize 32x32 favicon-32x32.png
convert icon-512.png -resize 16x16 favicon-16x16.png
convert icon-512.png -resize 32x32 -resize 16x16 favicon.ico
```

## Quick Temporary Solution

For development/testing, you can use a simple colored square:

1. Go to https://png-pixel.com/
2. Generate a 512x512 red (#dc2626) PNG
3. Use an online favicon generator to create all sizes

## Current Status

⚠️ **Action Required**: Favicon files are not yet generated. Please create them using one of the methods above before deploying to production.

The site is configured to use favicons once they are placed in the `public` folder.
