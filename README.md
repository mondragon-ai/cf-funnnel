# Bigly Custom Funnnel Template :bear:

### Welcome to the Bigly Custom Funnel documentation!

# System Requirements
- Node.js 12.22.0 or later
- MacOS, Windows (including WSL), and Linux are supported

# Automatic Setup :robot:

```
npm install
# or
yarn install
```

### DEV SERVER :desktop_computer:
Run `npm run dev` or `yarn dev` to start the development server on http://localhost:8080

### FRONT END SERVER :iphone:
Visit http://localhost:5500 to view your application

> Edit public/index.html and see the updated result in your browser

# Manual Setup 	:mechanic:
Install `npm init -y`, cors express dotenv-dom firebase firebase-admin and stripe in your project:

Go into your desired work folder and create a new folder or use mkdir [file]

```
npm install
# or
yarn install
```

Open package.json and add the following scripts:

```
 "scripts": {
    "build": "tsc",
    "start": "node lib/index.js",
    "dev": "NODE_ENV=development concurrently \"tsc -w\" \"nodemon lib/index.js\""
  }
```

These scripts refer to the different stages of developing an application:

- **dev** - Runs next dev to start node in lib/index.js in development mode
- **build** - Runs next build to build the application for production usage
- **start** - Runs next start to start a Next.js production server
