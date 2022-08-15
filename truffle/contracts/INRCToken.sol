// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";

error InvalidExchangeCurrency();
error LowExchangeCurrencyBalance();
error MintToZeroAddress();
error MintZeroQuantity();

interface IExchangeCurrency {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract INRCToken is ERC20, Ownable, ReentrancyGuard {
    IExchangeCurrency private ExchangeCurrency;
    mapping(string => address) public exchangeCurrencies;

    constructor() ERC20("INRCToken", "INRC") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /** 
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function addExchangeCurrency(string memory exchangeCurrencyName, address exchangeCurrencyAddress) public onlyOwner {
        exchangeCurrencies[exchangeCurrencyName] = exchangeCurrencyAddress;
    }

    function buy(string memory exchangeCurrencyName, uint256 amount) public {
        address receiver = msg.sender;
        if (amount == 0) {
            revert MintZeroQuantity();
        }

        if (msg.sender == address(0)) {
            revert MintToZeroAddress();
        }

        uint256 amountWithoutDecimals = amount;
        address exchangeCurrencyAddress = exchangeCurrencies[exchangeCurrencyName];
        if(exchangeCurrencyAddress == address(0x0)) {
            revert InvalidExchangeCurrency();
        }
        ExchangeCurrency = IExchangeCurrency(exchangeCurrencyAddress);
        uint256 exchangeCurrencyBalance = ExchangeCurrency.balanceOf(receiver);
        uint8 exchangeCurrencyDecimals = ExchangeCurrency.decimals();

        // Adding transaction fee 0.5% to the amount
        amount = amount * (10 ** exchangeCurrencyDecimals);
        uint256 transactionFee = amount * 5 / 1000;
        amount = amount + transactionFee;

        if(exchangeCurrencyBalance < amount) {
            revert LowExchangeCurrencyBalance();
        }

        ExchangeCurrency.transferFrom(receiver, address(this), amount);

        uint256 tokensToMint = amountWithoutDecimals * 80 * (10 ** 18);
        _mint(receiver, tokensToMint);
    }

}