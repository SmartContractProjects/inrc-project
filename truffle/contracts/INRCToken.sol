// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IExchangeToken {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function transfer(address to, uint256 amount) external returns (bool);
}

error LowExchangeTokenBalance();
error InvalidExchangeToken();
error MintToZeroAddress();
error RedeemToZeroAddress();
error MintZeroQuantity();
error RedeemZeroQuantity();
error AddingOwnAddress();
error LowBalanceInContract();
error InsufficientBalanceToRedeem();

contract INRCToken is ERC20, Ownable, ReentrancyGuard {
    IExchangeToken private ExchangeToken;
    mapping(string => address) public exchangeTokens;

    constructor() ERC20("INRCToken", "INRC") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /** 
     * Adds a new exchange token(e.g. DUSDC, 0x12D3424BdC7a9FC2f6F9D794810641662967a412)
     */
    function addExchangeToken(string memory exchangeTokenName, address exchangeTokenAddress) public onlyOwner {
        if (exchangeTokenAddress == address(this)) {
            revert AddingOwnAddress();
        }
        exchangeTokens[exchangeTokenName] = exchangeTokenAddress;
    }

    /**
     * Function to buy INRC tokens by keeping any exchange coin as collateral
     * Pre-Conditions:
     * 1. The exchange token should be present in exchangeTokens mappings. These can be added by the owner only.
     * 2. User should approve the INRCToken contract to transfer the required amount of particular exchange token
     */
    function buy(string memory exchangeTokenName, uint256 amount) public {
        address receiver = msg.sender;
        if (amount == 0) {
            revert MintZeroQuantity();
        }

        if (msg.sender == address(0)) {
            revert MintToZeroAddress();
        }

        uint256 amountWithoutDecimals = amount / (10 ** 18);
        address exchangeTokenAddress = exchangeTokens[exchangeTokenName];
        if(exchangeTokenAddress == address(0x0)) {
            revert InvalidExchangeToken();
        }
        ExchangeToken = IExchangeToken(exchangeTokenAddress);
        uint256 exchangeTokenBalance = ExchangeToken.balanceOf(receiver);

        uint256 transactionFee = amount * 5 / 1000;
        amount = amount + transactionFee;

        if(exchangeTokenBalance < amount) {
            revert LowExchangeTokenBalance();
        }

        ExchangeToken.transferFrom(receiver, address(this), amount);

        // The conversion rate of 1:80 can be kept in mappings if more currencies are added
        uint256 tokensToMint = amountWithoutDecimals * 80;
        _mint(receiver, tokensToMint);
    }

    /**
     * Function to redeem INRC tokens getting back the Collateral
     * Pre-Conditions:
     * 1. The exchange token should be present in exchangeTokens mappings. These can be added by the owner only.
     * 2. User should approve the INRCToken contract to transfer the required amount tokens from user's account to contract
     */
    function redeem(string memory exchangeTokenName, uint256 inrcAmount) public {
        address receiver = msg.sender;
        if (inrcAmount == 0) {
            revert RedeemZeroQuantity();
        }

        if (msg.sender == address(0)) {
            revert RedeemToZeroAddress();
        }

        address exchangeTokenAddress = exchangeTokens[exchangeTokenName];
        if(exchangeTokenAddress == address(0x0)) {
            revert InvalidExchangeToken();
        }
        ExchangeToken = IExchangeToken(exchangeTokenAddress);
        
        uint256 inrcAmountWithoutDecimals = inrcAmount / (10 ** 18);

        // Checking exchange token(USDC) balance of contract
        uint256 contractExchangeTokenBalance = ExchangeToken.balanceOf(address(this));
        uint256 exchangeTokenAmount = inrcAmountWithoutDecimals / 80;
        uint256 exchangeTokenAmoutWithDecimals = exchangeTokenAmount * (10 ** ExchangeToken.decimals());
        
        if(exchangeTokenAmoutWithDecimals > contractExchangeTokenBalance) {
            revert LowBalanceInContract();
        }

        // Calculating amount to charge in INRC with transaction fee + conversion ratio
        uint256 transactionFee = inrcAmount * 5 / 1000;
        inrcAmount += transactionFee;

        if(this.balanceOf(receiver) < inrcAmount) {
            revert InsufficientBalanceToRedeem();
        }

        this.transferFrom(receiver, address(this), inrcAmount);

        // Transfering exchange token(USDC) back to user
        ExchangeToken.transfer(receiver, exchangeTokenAmoutWithDecimals);
    }
}