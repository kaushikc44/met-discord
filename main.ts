import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import crypto from "crypto";
import fs from 'fs';
import { Keypair,PublicKey } from '@solana/web3.js';

import { AddLiquidityDLMM } from '.';

//type 
type UserWallet = {
    publicKey: string;
    encryptedSecretKey: string;
  };
  
type Database = Record<string, UserWallet>;
  


// --- Setup Client ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel]
  });


const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
const DATABASE_FILE = 'database.json';
// --- Crypto Helper Functions ---
function encrypt(text:string) {

    if (!ENCRYPTION_SECRET) {
        throw new Error('ENCRYPTION_SECRET is not defined in the environment');
      }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_SECRET), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
  
function decrypt(text:string) {
    if (!ENCRYPTION_SECRET) {
        throw new Error('ENCRYPTION_SECRET is not defined in the environment');
      }
    const [ivHex, encryptedHex] = text.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_SECRET), Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    return decrypted.toString();
  }
  
  // --- Database Functions ---
  function loadDatabase() {
    if (!fs.existsSync(DATABASE_FILE)) fs.writeFileSync(DATABASE_FILE, '{}');
    return JSON.parse(fs.readFileSync(DATABASE_FILE).toString());
  }
  
  function saveDatabase(db:Database) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(db, null, 2));
  }
  
  // --- Bot Ready ---
  client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });
  

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
  
    const { commandName, user, options } = interaction;
    let db = loadDatabase();

    //Start Command discord 
    if (commandName === 'start') {
        await interaction.reply({ content: 'Welcome to MetEngine! Use `/createwallet` to generate your wallet.', ephemeral: true });
      }

    

      //Create wallet command
    if (commandName === 'createwallet') {
        if (db[user.id]) {
          return await interaction.reply({ content: 'You already have a wallet created.', ephemeral: true });
        }
        
        const keypair = Keypair.generate();
        const publicKey = keypair.publicKey.toBase58();
        const secretKeyHex = Buffer.from(keypair.secretKey).toString('hex');
        const encryptedSecretKey = encrypt(secretKeyHex);
    
        db[user.id] = { publicKey, encryptedSecretKey };
        saveDatabase(db);
    
        await interaction.reply({ content: `✅ Wallet Created!\n\n**Address:** \`${publicKey}\`\n\nKeep it safe.`, ephemeral: true });
        try {
            await user.send(`✅ Your MetEngine Wallet:\n\n**Public Address:** \`${publicKey}\`\n**Private Key (SAVE THIS!):** \`${secretKeyHex}\``);
          } catch (err) {
            console.error('Failed to DM user their private key:', err);
            await interaction.followUp({ content: '❌ Could not send you a DM. Please enable DMs from server members!', ephemeral: true });
          }
      }

      if (interaction.commandName === 'trade') {
        await interaction.reply({ content: '⏳ Processing your trade...', ephemeral: true });
      
        const db = loadDatabase();
        const userData = db[user.id];
      
        if (!userData) {
          return await interaction.editReply({
            content: '❌ You need to create a wallet first with `/createwallet`.',
            
          });
        }
      
        const tokenAddress = options.getString('token_address')?.trim();
        if (!tokenAddress) {
          return await interaction.editReply({
            content: '❌ Please provide a valid token address.',
            
          });
        }
      
        const amount = options.getNumber('amount');
        if (!amount || amount <= 0) {
          return await interaction.editReply({
            content: '❌ Please provide a valid amount greater than 0.',
            
          });
        }
      
       
        try {
          const value = await AddLiquidityDLMM(user.id, tokenAddress, amount);
          if(value.status == 200){
            await interaction.editReply({
                content: '✅ Trade executed and liquidity added successfully.'+
                '🔗 View on Solscan: https://solscan.io/tx/' + value.message 
                
                
              });

          }else{
            await interaction.editReply({
                content: '✅ Trade failed to execute due to low balance'+
               value.message 
                
                
              });
          }
          
        } catch (error) {
          console.error('Trade command error:', error);
          await interaction.editReply({
            content: '❌ An error occurred while processing your trade.',
           
          });
        }
      }
      
    });

    

client.login(process.env.DISCORD_TOKEN);


//the dms where off and the private key wasnt sent
//enable balance 