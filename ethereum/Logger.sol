pragma solidity ^0.4.21;

// Logger's only contract storage is the address of its owner.
// Log data is recorded as a side effect of emitted Ethereum events.
contract Logger {
    address owner;

    constructor () public {
        owner = msg.sender;
    }

    // Only the creator of this contract may call log().
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    event Logged(uint indexed hash);

    // _hash must be a 256-bit unsigned integer.
    // Submitting a string will cause an error.
    function log(uint _hash) onlyOwner public {
        emit Logged(_hash);
    }
}
