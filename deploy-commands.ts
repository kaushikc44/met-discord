import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start using MetEngine!'),

  new SlashCommandBuilder()
    .setName('createwallet')
    .setDescription('Create your private Solana Wallet.'),

  new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposit SOL')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Amount of SOL to deposit')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check your wallet address.'),

  new SlashCommandBuilder()
    .setName('airdrop')
    .setDescription('Airdrop SOL into your MetEngine wallet on Devnet')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Amount of SOL to airdrop')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('swap')
    .setDescription('Swap tokens using MetEngine Bot')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Amount of input token to swap')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('from')
        .setDescription('Input token symbol (e.g., SOL)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('to')
        .setDescription('Output token symbol (e.g., USDC)')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a swap quote')
    .addStringOption(option =>
      option
        .setName('from')
        .setDescription('Input token address')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('to')
        .setDescription('Output token address')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to swap')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('decimals')
        .setDescription('Decimals of input token')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Create a position')
    .addStringOption(option =>
      option
        .setName('strategy')
        .setDescription('Choose your trading strategy')
        .setRequired(true)
        .addChoices(
          { name: 'Spot', value: 'spot' },
          { name: 'Curve', value: 'curve' },
          { name: 'Bid-Ask', value: 'bid_ask' }
        )
    )
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Enter the amount of SOL')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('token_address')
        .setDescription('Enter the token mint address')
        .setRequired(true)
    )
]
  // toJSON returns RESTPostAPI...JSONBody
  .map(cmd => cmd.toJSON() as RESTPostAPIApplicationCommandsJSONBody);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  (async () => {
    try {
      console.log('Refreshing commands...');
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID!,
          process.env.GUILD_ID!
        ),
        { body: commands }
      );
      console.log('Commands refreshed!');
    } catch (error) {
      console.error('Failed to refresh commands:', error);
    }
  })();