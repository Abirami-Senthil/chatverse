FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Install Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && \
    apt-get install -y nodejs

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# API Port
EXPOSE 8000
# Frontend Port
EXPOSE 3000

# Install Node.js dependencies
WORKDIR /app/chatbot-app
RUN npm install
RUN npm install -g serve

# Build the Node.js application
RUN npm run build

# Set the working directory back to /app
WORKDIR /app

# Run the API and the frontend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 & npx serve -s chatbot-app/build -l 3000"]
