FROM node:20

WORKDIR /app

COPY package*.json ./

# Clean install (important)
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
