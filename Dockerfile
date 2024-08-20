# Use an official Node runtime as the parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the .env file
COPY .env .

# Copy the rest of the application code
COPY . .

# Create directories for input and output
RUN mkdir -p input_resumes parsed_resumes

# Make port 3000 available to the world outside this container
# (if you decide to add an API server in the future)
EXPOSE 3000

# Run the app when the container launches
CMD ["npm", "run", "parse:all"]
