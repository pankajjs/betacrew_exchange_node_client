# BetaCrew Exchange Node.js Client

This project is a Node.js client for connecting to the BetaCrew Exchange server using TCP sockets and to generate a JSON file as output. The JSON file should contain an array of objects, where each object represents a packet of data with increasing sequences. It is essential to ensure that none of the sequences are missing in the final JSON output.

## Installation

To set up this project on your local machine, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/pankajjs/betacrew_exchange_node_client.git
   ```

2. Navigate to the project directory:
   ```
   cd betacrew_exchange_node_client
   ```

3. Install the project dependencies:
   ```
   npm install
   ```

## Usage

Before running the client, you need to start the server:

1. Start the server:
   ```
   node main.js
   ```

2. In a new terminal window, start the client in development mode:
   ```
   cd client && npm run dev
   ```

This will execute the `index.js` file using Node.js.

## Main Files

- Server: `main.js`
- Client: `client/index.js` (main entry point for the client application)

## Dependencies

This project relies on the following npm package:

- `net` (version ^1.0.2): Node.js TCP networking module

## Scripts

The following npm scripts are available:

- `npm run dev`: Starts the client application in development mode
