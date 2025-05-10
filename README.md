

Practice Bot for Discord

A simple Discord bot that allows users to create crypto wallets, receive keys via DM, fund wallets, and simulate trades.

Features
	•	/start or /createwallet: Generates a public and private key pair
	•	Private keys sent via DM (enable private DMs on Discord)
	•	Public and encrypted private keys stored in database.json
	•	Users can fund wallets manually
	•	/trade: Simulates a basic trade function

Setup

Prerequisites
	•	Node.js (v16+ recommended)
	•	Discord Developer Bot Token
	•	TypeScript

Installation
	1.	Clone this repo:

git clone https://github.com/yourusername/practice_bot.git
cd practice_bot


	2.	Install dependencies:

npm install


	3.	Configure your bot token and settings:
	•	Rename .env.example to .env
	•	Add your bot token and any other environment variables
	4.	Run the bot:

npx ts-node src/main.ts



File Structure
	•	main.ts: The main entry file to run the bot.
	•	index.ts: File where you can customize or add features.
	•	database.json: Stores public addresses and encrypted private keys (auto-generated).

Usage
	1.	Join the Discord server.
	2.	Run /start or /createwallet.
	3.	Enable DMs to receive your private key.
	4.	Fund your wallet manually.
	5.	Use /trade to simulate a trade.

Notes
	•	A private server is used to run and test the bot.
	•	Ensure proper key encryption and secure handling of private keys.

⸻

Let me know if you’d like to include contributor info, license, or screenshots.