import React, { useEffect, useState } from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { orange } from '@mui/material/colors';
import { ethers } from 'ethers';
import contract from './utils/WavePortal.json';
import { Button, Alert, TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Confetti from "react-confetti";
import './App.css';
import { format } from "date-fns";

const theme = createTheme({
  palette: {
    primary: {
      main: orange[500]
    },
    secondary: {
      main: '#FFF'
    },
  },
});

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalWaves, setTotalWaves] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState('');
  const [metamaskInstalled, setMetamaskInstalled] = useState(true);
  const [winnerAmount, setWinnerAmount] = useState(null);

  const contractAddress = "0x9a8ff445e6be56a6A936FdeED17C6408D94481eF";
  const contractABI = contract.abi;
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        setMetamaskInstalled(false);
        setAllWaves([]);
        return;
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
        await getAllWaves();
      } else {
        setAllWaves([]);
        setCurrentAccount("");
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }

    const connectWallet = async () => {
      try {
        const { ethereum } = window;
        if (!ethereum) {
          setMetamaskInstalled(false);
          return;
        }
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        setCurrentAccount(accounts[0]);
      } catch (error) {
        console.log(error)
      }
    }

  useEffect(() => {
    checkIfWalletIsConnected();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount])

  useEffect(() => {
    let wavePortalContract;

    const onNewWinner = (from, timestamp, amount) => {
      console.log('New Winner', from, currentAccount, amount);
      if (from === currentAccount) {
        setWinnerAmount(amount);
        setTimeout(() => {
          setWinnerAmount(null);
        }, 8000);
      }
    }
  
    const onNewWave = (from, timestamp, message) => {
      setAllWaves(prevState => [
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
        ...prevState,
      ]);
    };

    const { ethereum } = window;
  
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
      wavePortalContract.on('NewWinner', onNewWinner);
    } else {
      setMetamaskInstalled(false);
      setAllWaves([]);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
        wavePortalContract.off('NewWinner', onNewWinner);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        setLoading(true);
        const waveTxn = await wavePortalContract.wave(message);

        await waveTxn.wait();
        setLoading(false);
        setMessage('');

        const count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
      } else {
        setMetamaskInstalled(false);
        setAllWaves([]);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();
        const totalWaves = await wavePortalContract.getTotalWaves();
        
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
        setTotalWaves(totalWaves.toNumber());
      } else {
        setMetamaskInstalled(false);
        setAllWaves([]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const formatAddress = (address) => {
    const firstPart = address.slice(0,5);
    const secondPart = address.slice(-4);
    return `${firstPart}...${secondPart}`;  
  }

  const formatDate = (timestamp) => {
    return `${format(new Date(timestamp), 'MM/dd/yyyy HH:mm')} hs.`;
  }
  
  return (
    <ThemeProvider theme={theme}>
      {winnerAmount && 
        <>
          <div style={{color: 'white', fontWeight: 'bold', fontSize: 40, zIndex: 20, position: 'absolute', marginLeft: 'auto', marginRight: 'auto', left: 0, right: 0, top:'50%', textAlign: 'center'}}>
            You're rich now. <br/>
            You just won {winnerAmount} ether!
          </div>
          <Confetti />
        </>
      }
      <div className="mainContainer">
        {!metamaskInstalled && <Alert style={{marginBottom: 20, borderRadius: 30}} variant="filled" severity="warning">Please install MetaMask to use this dApp.</Alert>}
        {!currentAccount && metamaskInstalled && (
            <Button style={{width: 200, marginBottom: 20, borderRadius: 30}} variant="contained" color="primary" onClick={connectWallet} disableElevation>Connect Wallet</Button>
        )}

        <div className="dataContainer">
          <div className="header">
          Hey! Welcome to the Wave Portal
          </div>

          <div className="bio">
            I'm <a style={{ textDecoration: "none", color: orange[500]}} href="https://www.linkedin.com/in/juan-olmedo-a0b30678/">Juan Olmedo</a> and this project was made thanks to <a style={{ textDecoration: "none", color: orange[500]}}  href="https://buildspace.so/">_buildspace</a> <span role="img" aria-label="unicorn">🦄</span>. <br/> Send me a message and you may win some ether. You have a 40% chance <span role="img" aria-label="face">😉</span>
          </div>

          <div className="inputContainer">
            <TextField
              id="outlined-multiline-static"
              label="Write down whatever you want 👇"
              placeholder="Your message will be stored in the blockchain forever :)"
              multiline
              fullWidth
              focused
              minRows={4}
              variant="outlined"
              style={{color: 'white', textEmphasisColor: 'white'}}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <div className="buttonContainer">
            <LoadingButton
              disabled={!metamaskInstalled || !currentAccount}
              style={{width: 100, borderRadius: 30}}
              onClick={wave}
              endIcon={<SendIcon />}
              loading={loading}
              loadingPosition="end"
              variant="contained"
              >
                Send
              </LoadingButton>
          </div>

          {allWaves.length && 
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 800, backgroundColor: 'black'}}>
                <colgroup>
                  <col style={{width:'15%'}}/>
                  <col style={{width:'70%'}}/>
                  <col style={{width:'15%'}}/>
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{fontWeight: 'bold', color: orange[500]}} align="left">Sender</TableCell>
                    <TableCell sx={{fontWeight: 'bold', color: orange[500], whiteSpace: 'normal', wordWrap: 'break-word'}} align="left">Message</TableCell>
                    <TableCell sx={{fontWeight: 'bold', color: orange[500]}} align="right">Received At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allWaves.map((wave, index) => (
                    <TableRow
                      key={`${wave.name}-${index}`}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{color: 'white'}} component="th" scope="row" align="left">
                        <a style={{textDecoration: 'none', color: orange[500] }} href={`https://rinkeby.etherscan.io/address/${wave.address}`}>{formatAddress(wave.address)}</a>
                      </TableCell>
                      <TableCell sx={{color: 'white'}} align="left">{wave.message}</TableCell>
                      <TableCell sx={{color: 'white'}} align="right">{formatDate(wave.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          }
        </div>
      </div>
    </ThemeProvider>
  );
}
