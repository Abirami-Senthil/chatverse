# Setting Up the Development Environment

## Running using Docker (Recommended)

The project is designed to run using Docker, which simplifies the setup process and ensures consistent dependencies across different environments.
From the repository root, run the following commands:

```bash
docker build -t chatbot .
docker run -p 8000:8000 -p 3000:3000 chatbot
```


Alternatively, you can run the project without Docker by setting up the Python environment and installing Node.js

## Setting up the Python Environment for the API

First, create a virtual environment to isolate the project dependencies. From the repository root, run the following command in your terminal:

```bash
python -m venv venv-chatbot
source venv-chatbot/bin/activate  # On Windows use `venv-chatbot\Scripts\activate`
pip install -r requirements.txt

# Setup the required environment variable
echo "JWT_SECRET_KEY=your_secret_key" >> .env

# Start the app with hot-reload
uvicorn main:app --reload
```

## Installing Node.js and setting up the Frontend

Next, install Node.js and npm (Node Package Manager) to manage the frontend.

#### For macOS and Linux:


```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

#### For Windows:

Download the Node.js installer from the official Node.js website: https://nodejs.org/
Run the installer and follow the setup steps. Make sure to install the recommended version.

After installation, verify that Node.js and npm are installed correctly by running the following commands in your terminal:

```bash
node -v
npm -v
```

Navigate to the `chatbot-app` directory and run the following command to install the Node.js dependencies:

```bash
cd chatbot-app
npm install
```

### Step 4: Run the Frontend App

After installing the dependencies, you can start the frontend app. Run the following command in the `chatbot-app` directory:

```bash
npm start
```

This will start the frontend app on `http://localhost:3000`
