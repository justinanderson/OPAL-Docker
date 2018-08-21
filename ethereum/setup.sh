#!/usr/bin/env bash

# Creates Ethereum configuration file for use in OPAL-Interface by compiling
# and deploying the contract in Logger.sol to the Ethereum network.
#
# Requires that an Ethereum node is available at the given URL and that the
# given Ethereum account exists on the network with sufficient funds to execute
# transactions of OPAL's Logger contract.

URL="http://localhost:8545/"
ACCOUNT="0xe092b1fa25df5786d151246e492eed3d15ea4daa"
PASSWORD="''"
GAS_PRICE="10"

npm install
node index.js setup --url ${URL} --account $ACCOUNT --password $PASSWORD --gasPrice $GAS_PRICE
node index.js status
node index.js compile
node index.js deploy

echo "Copy the contents of config.json into your opal.interface.config.js to enable logging requests to Ethereum."
