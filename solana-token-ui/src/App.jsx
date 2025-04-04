import React, { useMemo, useState } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';
import {
  clusterApiUrl,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  Connection
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  burn
} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';

import '@solana/wallet-adapter-react-ui/styles.css';
// import './app.css';

const network = 'devnet';
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

const App = () => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MainComponent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const MainComponent = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenMint, setTokenMint] = useState(null);
  const [balance, setBalance] = useState(0);

  const createAndMintToken = async () => {
    if (!publicKey) return alert('Connect wallet first!');
    const connection = new Connection(endpoint, 'confirmed');
    const mint = await createMint(connection, publicKey, publicKey, null, 9);
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, mint, publicKey, publicKey
    );
    await mintTo(connection, publicKey, mint, associatedTokenAccount.address, publicKey, 1000000000);
    setTokenMint(mint.toBase58());
    alert('Token created and minted successfully!');
  };

  const checkBalance = async () => {
    if (!tokenMint || !publicKey) return;
    const connection = new Connection(endpoint, 'confirmed');
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, new PublicKey(tokenMint), publicKey, publicKey
    );
    setBalance(Number(associatedTokenAccount.amount));
  };

  const transferTokens = async () => {
    if (!publicKey || !recipient || !amount || !tokenMint) return;
    try {
      const connection = new Connection(endpoint, 'confirmed');
      const recipientPubKey = new PublicKey(recipient);
      const senderTokenAccount = await getAssociatedTokenAddress(new PublicKey(tokenMint), publicKey);
      const recipientTokenAccount = await getAssociatedTokenAddress(new PublicKey(tokenMint), recipientPubKey);
      const transaction = new Transaction().add(
        createTransferInstruction(senderTokenAccount, recipientTokenAccount, publicKey, Number(amount))
      );
      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction Signature:', signature);
      alert('Transfer Successful!');
    } catch (error) {
      console.error('Transfer Failed:', error);
      alert('Transfer Failed!');
    }
  };

  const burnTokens = async () => {
    if (!tokenMint || !publicKey) return;
    const connection = new Connection(endpoint, 'confirmed');
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, new PublicKey(tokenMint), publicKey, publicKey
    );
    await burn(connection, publicKey, associatedTokenAccount.address, new PublicKey(tokenMint), publicKey, 50000000);
    alert('Tokens burned successfully!');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d0d', color: 'white', flexDirection: 'column' }}>
      <h1>Solana Token App</h1>
      <WalletMultiButton />
      <button onClick={createAndMintToken} style={{ marginTop: '20px' }}>Create & Mint Token</button>
      <button onClick={checkBalance} style={{ marginTop: '10px' }}>Check Balance</button>
      <input type="text" placeholder="Recipient Address" value={recipient} onChange={(e) => setRecipient(e.target.value)} style={{ marginTop: '20px', padding: '10px', width: '300px' }} />
      <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ marginTop: '10px', padding: '10px', width: '300px' }} />
      <button onClick={transferTokens} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'purple', color: 'white', border: 'none', cursor: 'pointer' }}>Transfer Tokens</button>
      <button onClick={burnTokens} style={{ marginTop: '10px' }}>Burn Tokens</button>
      {tokenMint && <p>Token Mint Address: {tokenMint}</p>}
      <p>Balance: {balance}</p>
    </div>
  );
};

export default App;
