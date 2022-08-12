// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract INRCToken is ERC20, Ownable, ReentrancyGuard {
    constructor() ERC20("INRCToken", "INRC") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}