import { ethers } from "ethers";
import contract from "../utils/contractABI/WavePortal.json";

export const getContract = () => {
  const { ethereum } = window;
  const contractAddress = "0xc9cba0069E818c6D0A82DB4d0B70f0E480Ddb578";
  const contractABI = contract.abi;
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const contractInstance = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );
  return contractInstance;
};
