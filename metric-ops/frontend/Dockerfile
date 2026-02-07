FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json vite.config.ts postcss.config.js tailwind.config.js index.html ./
RUN npm install
COPY src ./src
CMD ["npm","run","dev"]
