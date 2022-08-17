import { useEffect, useState } from 'react';
import "bootstrap/dist/css/bootstrap.css";
import { Form, Button} from "react-bootstrap";
import NumericInput from 'react-numeric-input';
import LoadingOverlay from 'react-loading-overlay';

import Web3 from 'web3';
import { 
  DEMO_DUSDC_CONTRACT_ADDRESS,
  INRC_TOKEN_CONTRACT_ADDRESS,
  DEMO_DUSDC_CONTRACT_ABI,
  INRC_TOKEN_CONTRACT_ABI
} from './contracts/config';

function App() {
  const [account, setAccount] = useState();
  const [demoUSDCContract, setDemoUSDCContract] = useState();
  const [inrcTokenContract, setINRCTokenContract] = useState();
  const [dusdcCBalance, setDUSDCBalance] = useState();
  const [inrcTokenBalance, setINRCTokenBalance] = useState();
  const [dusdcDecimals, setDemoUSDCDecimals] = useState();
  const [dusdcSymbol, setDUSDCSymbol] = useState();
  const [inrcDecimals, setINRCTokenDecimals] = useState();
  const [ethBalance, setEthBalance] = useState();
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [dusdcTransactionFee, setDUSDCTransactionFee] = useState('');
  const [inrcTransactionFee, setINRCTransactionFee] = useState('');
  const [dusdcValue, setDUSDCValue] = useState();
  const [inrcValue, setINRCValue] = useState();
  const [isActive, toggleLoader] = useState();
  const [errors, setErrors] = useState({});
  const [messages, setMessages] = useState({});
  const [totalDUSDCCharged, setDUSDCCharged] = useState();
  const [totalINRCCharged, setINRCCharged] = useState();

  async function load() {
    toggleLoader(true);
    const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
    const accounts = await web3.eth.requestAccounts();
    setAccount(accounts[0]);

    var eth = await web3.eth.getBalance(accounts[0]);
    setEthBalance(Web3.utils.fromWei(eth, 'ether'));

    const demoUSDCContract = new web3.eth.Contract(DEMO_DUSDC_CONTRACT_ABI, DEMO_DUSDC_CONTRACT_ADDRESS);
    setDemoUSDCContract(demoUSDCContract);
    const dusdDecimals = await demoUSDCContract.methods.decimals().call();
    setDemoUSDCDecimals(dusdDecimals);
    const dusdBal = await demoUSDCContract.methods.balanceOf(accounts[0]).call();
    setDUSDCBalance(dusdBal/(10 ** dusdDecimals));
    const dusdSymbol = await demoUSDCContract.methods.symbol().call();
    setDUSDCSymbol(dusdSymbol);

    const inrcTokenContract = new web3.eth.Contract(INRC_TOKEN_CONTRACT_ABI, INRC_TOKEN_CONTRACT_ADDRESS);
    setINRCTokenContract(inrcTokenContract);
    const inrcDecimals = await inrcTokenContract.methods.decimals().call()
    setINRCTokenDecimals(inrcDecimals);
    const inrcBal = await inrcTokenContract.methods.balanceOf(accounts[0]).call();
    setINRCTokenBalance(inrcBal/(10 ** inrcDecimals)); 

    toggleLoader(false);
  }

  useEffect(() => {
    load();
  }, []);

  // function updateError(key, value) {
  //   setTimeout(() => {
  //     errors[key] = null;
  //     setErrors(errors);
  //   }, 3000);
  //   errors[key] = value;
  //   setErrors(errors);
  // }

  function handleUSDCInput(value) {
    const balance = dusdcCBalance ? dusdcCBalance * (10 ** dusdcDecimals) : 0;
    const requiredAmt = value === 0 || value === null ? 0 : value * (10 ** dusdcDecimals);
    const transactionFee = requiredAmt * 5 / 1000;

    setDUSDCTransactionFee(value === 0 || value === null ? '' : `${transactionFee / (10 ** dusdcDecimals)}`);
    if(balance < (requiredAmt + transactionFee)) {
      setErrors({...errors, usdcAmount: `Low USDC balance! Transaction will likely fail!`});
      setTimeout(() => {
        setErrors({...errors, usdcAmount: ""});
      }, 3000);
    } else {
      setErrors({...errors, usdcAmount: ""});
      setDUSDCValue(value);
      setEstimatedOutput(value === 0 || value === null ? '' : `${value * 80} INRC`);
    }
  }

  function handleINRCInput(value) {
    const balance = inrcTokenBalance ? inrcTokenBalance * (10 ** inrcDecimals) : 0;
    const requiredAmt = value === 0 || value === null ? 0 : value * (10 ** inrcDecimals);
    const transactionFee = requiredAmt * 5 / 1000;

    setINRCTransactionFee(value === 0 || value === null ? '' : `${transactionFee / (10 ** inrcDecimals)}`);
    if(balance < (requiredAmt + transactionFee)) {
      setErrors({...errors, inrcAmount: `Low INRC balance! Transaction will likely fail!`});
      setTimeout(() => {
        setErrors({...errors, inrcAmount: ""});
      }, 3000);
    } else {
      setErrors({...errors, inrcAmount: ""});
      setINRCValue(value);
      setEstimatedOutput(value === 0 || value === null ? '' : `${value / 80} USDC`);
    }
  }

  const buyINRC = async (event) => {
    event.preventDefault();
    toggleLoader(true);
    let amount = `${dusdcValue * (10 ** dusdcDecimals)}`;
    let totalAmount = `${(dusdcValue * (10 ** dusdcDecimals)) + (dusdcTransactionFee * (10 ** dusdcDecimals))}`;
    // Approve INRC_TOKEN_CONTRACT_ADDRESS to access dusd value from user
    try {
      await demoUSDCContract.methods.approve(INRC_TOKEN_CONTRACT_ADDRESS, totalAmount).send({from: account});
      await inrcTokenContract.methods.buy(dusdcSymbol, amount).send({from: account});
      setMessages({...messages, buyMessage: `Successfully bought INRC tokens!`});
      load();
    } catch(error) {
      setErrors({...errors, buyError: `Error: ${error.message}`});
      setTimeout(() => {
        setErrors({...errors, buyError: ""});
      }, 3000);
    } finally {
      toggleLoader(false);
    }
  }

  const redeemINRC = async (event) => {
    event.preventDefault();
    toggleLoader(true);
    let amount = `${inrcValue * (10 ** inrcDecimals)}`;
    let totalAmount = `${(inrcValue * (10 ** inrcDecimals)) + inrcTransactionFee * (10 ** inrcDecimals)}`;
    // Approve INRC_TOKEN_CONTRACT_ADDRESS to access inrc value from user
    try {
      await inrcTokenContract.methods.approve(INRC_TOKEN_CONTRACT_ADDRESS, totalAmount).send({from: account});
      await inrcTokenContract.methods.redeem(dusdcSymbol, amount).send({from: account});
      setMessages({...messages, redeemMessage: `Successfully redeemed INRC tokens!`});
      load();
    } catch(error) {
      setErrors({...errors, redeemError: `Error: ${error.message}`});
      setTimeout(() => {
        setErrors({...errors, redeemError: ""});
      }, 3000);
    } finally {
      toggleLoader(false);
    }
  }

  return (
    <div>
      <LoadingOverlay active={isActive} spinner text='Please wait...'>
        <div style={{ display: "block", width: "auto", padding: 30,}}>
          <Form onSubmit={buyINRC}>
            <Form.Group>
              <Form.Label className="account">Your account is: {account}</Form.Label><br></br>
              <Form.Label className="ethBalance">Eth Balance is: {ethBalance} ETH</Form.Label><br></br>
              <Form.Label className="estimatedOutput">Estimated output: {estimatedOutput}</Form.Label>
            </Form.Group><br></br>
            <Form.Group>
              <Form.Label className="rate">Mint Rate: 1 USDC = 80 INRC</Form.Label><br></br>
              <Form.Label className="dusdcTransactionFee">USDC Transaction Fee(0.5%): {dusdcTransactionFee ? dusdcTransactionFee + ' USDC' : ''}</Form.Label><br></br>
              <Form.Label className="dusdcBalance">My USDC Balance: {dusdcCBalance} USDC</Form.Label>
            </Form.Group>
            <Form.Group>
              <Form.Label>Pay using USDC</Form.Label><br></br>
              <NumericInput precision={0} class="form-control" type="text" placeholder="USDC Amount" onChange={handleUSDCInput} />
              <Form.Label className="error" type="invalid">{errors.usdcAmount}</Form.Label><br></br>
            </Form.Group><br></br>
            <Form.Group>
              <Form.Label className="error" type="invalid">{errors.buyError}</Form.Label><br></br>
              <Form.Label className="message">{messages.buyMessage}</Form.Label><br></br>
            </Form.Group><br></br>
            <Button variant="primary" type="submit">
              BUY
            </Button>
          </Form><br></br><br></br>

          <Form onSubmit={redeemINRC}>
            <Form.Group>
              <Form.Label className="inrcBalance">INRC Token Balance is: {inrcTokenBalance} INRC</Form.Label><br></br>
              <Form.Label className="rate">Redeem Rate: 80 INRC = 1 USDC</Form.Label><br></br>
              <Form.Label className="inrcTransactionFee">INRC Transaction Fee(0.5%): {inrcTransactionFee}</Form.Label><br></br>
            </Form.Group><br></br>
            <Form.Group>
              <Form.Label className="error" type="invalid">{errors.redeemError}</Form.Label><br></br>
            </Form.Group><br></br>
            <Form.Group>
              <Form.Label>Redeem using INRC</Form.Label><br></br>
              <NumericInput precision={0} class="form-control" type="text" placeholder="INRC Amount" onChange={handleINRCInput} />
            </Form.Group><br></br>
            <Form.Group>
              <Form.Label className="error" type="invalid">{errors.inrcAmount}</Form.Label><br></br>
              <Form.Label className="message">{messages.redeemMessage}</Form.Label><br></br>
            </Form.Group><br></br>
            <Button variant="primary" type="submit">
              REDEEM
            </Button>
          </Form>
        </div>
      </LoadingOverlay>
    </div>
  );
}

export default App;