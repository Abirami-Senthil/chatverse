# Stage 1: Build the frontend
FROM node:20 AS frontend-builder
WORKDIR /app/chatbot-app
COPY chatbot-app/package*.json ./
RUN npm install
COPY chatbot-app/ ./
ENV REACT_APP_API_BASE_URL=http://localhost:${PORT:-3000}
RUN npm run build

# Stage 2: Build the final image with Python and Node.js
FROM python:3.12-slim

# Install Python and dependencies
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

ENV FRONTEND_BUILD_OUTPUT_DIR=/app/chatbot-app/build
# Copy the frontend build into the FastAPI app
COPY --from=frontend-builder /app/chatbot-app/build $FRONTEND_BUILD_OUTPUT_DIR
# Copy the rest of the FastAPI app
COPY . .

EXPOSE ${PORT:-3000}

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-3000}
