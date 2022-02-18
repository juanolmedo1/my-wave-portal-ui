import React, { useEffect, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { orange } from "@mui/material/colors";
import { ethers } from "ethers";
import { Button, Alert, TextField } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import SendIcon from "@mui/icons-material/Send";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Confetti from "react-confetti";
import { formatAddress, formatDate } from "./utils/strings/formatting";
import { getContract } from "./services/contractProvider";
import constants from "./utils/strings/constants";
import compareDesc from 'date-fns/compareDesc';
import "./App.css";

const {
  title,
  installMetamask,
  connectWalletTitle,
  inputTitle,
  inputPlaceholder,
  rinkebyEtherscanURL,
  firstColumnTitle,
  secondColumnTitle,
  thirdColumnTitle,
  buttonTitle,
  buildspaceURL,
  linkedingURL
} = constants;

const theme = createTheme({
  palette: {
    primary: {
      main: orange[500],
    },
    secondary: {
      main: "#FFF",
    },
  },
});

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");
  const [metamaskInstalled, setMetamaskInstalled] = useState(true);
  const [winnerAmount, setWinnerAmount] = useState(null);

  const checkEthereumObject = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      setMetamaskInstalled(false);
      setAllWaves([]);
      return null;
    } else {
      setMetamaskInstalled(true);
      return ethereum;
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const ethereum = await checkEthereumObject();
      if (!ethereum) return;

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts?.length) {
        setCurrentAccount(accounts[0]);
        await getAllWaves();
      } else {
        setAllWaves([]);
        setCurrentAccount("");
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const ethereum = await checkEthereumObject();
      if (!ethereum) return;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      await getAllWaves();
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const ethereum = await checkEthereumObject();
      if (!ethereum) return;

      const contractInstance = getContract();

      setLoading(true);
      const waveTxn = await contractInstance.wave(message, {
        gasLimit: 300000,
      });
      await waveTxn.wait();
      setLoading(false);

      setMessage("");
    } catch (error) {
      console.log(error);
      console.log(error.message);
      setLoading(false);
      setMessage("");
    }
  };

  const getAllWaves = async () => {
    try {
      const ethereum = await checkEthereumObject();
      if (!ethereum) return;

      const contractInstance = getContract();

      const waves = await contractInstance.getAllWaves();
      
      const wavesCleaned = waves.map((wave) => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        };
      });
      const sortedWaves = wavesCleaned.sort((waveA, waveB) => { return compareDesc(waveA.timestamp, waveB.timestamp) });

      setAllWaves(sortedWaves);
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let contractInstance = null;

    const onNewWinner = (from, timestamp, amount) => {
      console.log("New Winner", from, ethers.utils.formatEther(amount));
      if (from === currentAccount) {
        setWinnerAmount(ethers.utils.formatEther(amount));
        setTimeout(() => {
          setWinnerAmount(null);
        }, 8000);
      }
    };

    const onNewWave = (from, timestamp, message) => {
      setAllWaves((prevState) => [
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
        ...prevState,
      ]);
    };

    const getContractInstance = async () => {
      const ethereum = await checkEthereumObject();
      if (!ethereum) return;
      contractInstance = getContract();
      contractInstance.on("NewWave", onNewWave);
      contractInstance.on("NewWinner", onNewWinner);
    };

    getContractInstance();

    return () => {
      if (contractInstance) {
        contractInstance.off("NewWave", onNewWave);
        contractInstance.off("NewWinner", onNewWinner);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {winnerAmount && (
        <>
          <div className="winnerModal">
            <p className="modalText">
              You won {winnerAmount} ether!
            </p>
          </div>
          <Confetti />
        </>
      )}
      <div className="mainContainer" style={winnerAmount && { opacity: 0.1 }}>
        {!metamaskInstalled && (
          <Alert
            style={{ marginBottom: 20, borderRadius: 30 }}
            variant="filled"
            severity="warning"
          >
            {installMetamask}
          </Alert>
        )}
        {!currentAccount && metamaskInstalled && (
          <Button
            style={{ width: 200, marginBottom: 20, borderRadius: 30 }}
            variant="contained"
            color="primary"
            onClick={connectWallet}
            disableElevation
          >
            {connectWalletTitle}
          </Button>
        )}

        <div className="dataContainer">
          <div className="header">{title}</div>

          <div className="bio">
            I'm{" "}
            <a
              style={{ textDecoration: "none", color: orange[500] }}
              href={linkedingURL}
            >
              Juan Olmedo
            </a>{" "}
            and this project was made thanks to{" "}
            <a
              style={{ textDecoration: "none", color: orange[500] }}
              href={buildspaceURL}
            >
              _buildspace
            </a>{" "}
            <span role="img" aria-label="unicorn">
              🦄
            </span>
            . <br /> Send me a message and you may win some ether. You have a
            40% win chance{" "}
            <span role="img" aria-label="face">
              😉
            </span>
          </div>

          <div className="inputContainer">
            <TextField
              id="outlined-multiline-static"
              label={inputTitle}
              placeholder={inputPlaceholder}
              multiline
              fullWidth
              focused
              minRows={4}
              variant="outlined"
              style={{ color: "white", textEmphasisColor: "white" }}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <div className="buttonContainer">
            <LoadingButton
              disabled={!metamaskInstalled || !currentAccount}
              style={{ width: 100, borderRadius: 30, backgroundColor: loading && orange[500] }}
              onClick={wave}
              endIcon={<SendIcon />}
              loading={loading}
              loadingPosition="end"
              variant="contained"
            >
              {buttonTitle}
            </LoadingButton>
          </div>

          {allWaves.length && (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 800, backgroundColor: "black" }}>
                <colgroup>
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "70%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: "bold", color: orange[500] }}
                      align="left"
                    >
                      {firstColumnTitle}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: orange[500],
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      }}
                      align="left"
                    >
                      {secondColumnTitle}
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: orange[500] }}
                      align="right"
                    >
                      {thirdColumnTitle}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allWaves.map((wave, index) => (
                    <TableRow
                      key={`${wave.name}-${index}`}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        align="left"
                      >
                        <a
                          style={{ textDecoration: "none", color: orange[500] }}
                          href={`${rinkebyEtherscanURL}${wave.address}`}
                        >
                          {formatAddress(wave.address)}
                        </a>
                      </TableCell>
                      <TableCell sx={{ color: "white" }} align="left">
                        {wave.message}
                      </TableCell>
                      <TableCell sx={{ color: "white" }} align="right">
                        {formatDate(wave.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
