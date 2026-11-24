FROM node:20-alpine
WORKDIR /app
COPY server.js ./
COPY docs ./docs
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
