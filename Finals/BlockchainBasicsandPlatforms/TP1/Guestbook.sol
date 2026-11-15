// SPDX-License-Identifier: GPL-3.0
// SOC4190 Blockchain Basics and Platforms, Fall 2026 - Term Project I, Part C.
// The class guestbook: the instructor deploys it once on Sepolia, every student signs it once.
// Read it next to 1_Storage.sol: same shape, a few new words, each explained on the line where it appears.

pragma solidity >=0.8.2 <0.9.0; // same compiler range as 1_Storage.sol

contract Guestbook { // one contract, one address, shared by the whole class

    // mapping = a lookup table: give it an address, it gives back the value stored for that address
    mapping(address => uint256) public numberOf;  // the number each address wrote (0 if it never wrote)
    mapping(address => bool) public hasSigned;    // true once an address has signed, false before

    address[] public signers; // a list of every address that signed, in the order they signed

    // sign = the one transaction each student sends (orange button in Remix)
    function sign(uint256 number) public {
        // msg.sender = the address that sent this transaction: your own Account 1, nobody can fake it
        // require(check, "message") = if the check is false, stop, undo everything, show the message
        require(!hasSigned[msg.sender], "Guestbook: this address has already signed");
        hasSigned[msg.sender] = true;  // remember that this address has signed
        numberOf[msg.sender] = number; // keep the number it wrote
        signers.push(msg.sender);      // push = add the address at the end of the list
    }

    // count = how many addresses have signed so far (blue button: a call, free, no block)
    function count() public view returns (uint256) {
        return signers.length; // .length = how many items are in the list
    }
}
