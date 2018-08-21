# OPAL Ethereum Setup

OPAL can optionally store hashes of job execution requests on the Ethereum blockchain for auditing purposes.

## Local testing with Ganache

For local testing, you can skip the sections "Running an Ethereum node" and "Creating an Ethereum Account" below and instead create a local instance of Ganache with:

```
docker-compose -f docker-compose-test.yml up -d
```

Once Ganache's Docker image has been downloaded, it should only take a few seconds to start up. Because it is entirely local, there is no wait time for syncing.

Ganache comes preloaded with 10 funded, passwordless accounts with ~100ETH each. Ganache prints the addresses of those accounts and their balances each time it starts. The Docker Compose setup hardcodes Ganache's random seed to be 0, so the first account will always be `0xe092b1fa25df5786d151246e492eed3d15ea4daa`.


## Running an Ethereum node

For production use, you can run an instance of Geth with:

```
docker-compose -f docker-compose-prod.yml up -d
```

The first time you run Geth, it must sync its state with the network before you can execute any new transactions. The Docker Compose setup runs Geth in fast sync mode, which downloads the history of the Ethereum blockchain from other nodes. This can take anywhere from 30 minutes to 72 hours depending on the network and disk speed of the host computer as well as the speed of the nodes it syncs with. This is still considerably faster than Geth's default mode, which reruns the entire chain's transaction history and is heavily CPU bound.

Note that Geth will not report when it has finished syncing, but you can follow its output to see the latest block it has processed and compare that to the latest block on Ethereum monitoring sites like https://www.etherchain.org and https://etherscan.io.

## Creating an Ethereum account

Every transactions on the Ethereum blockchain costs money in the form of "gas". To pay for those transactions, you need an Ethereum account with some amount of Ether stored in it.

To create an Ethereum account, run the following and answer its prompts:

```
docker-compose -f docker-compose-prod.yml run --rm geth account new
```

It's important to save the account address that command outputs and remember the password used if any.

There are many ways to add funds to an Ethereum account / wallet. https://www.coinbase.com is a popular option.

## Deploying the smart contract

OPAL stores its hashes on the Ethereum blockchain by executing a smart contract. There is a convenience tool and script in this directory for compiling and deploying the contract as well as creating the necessary configuration data for use by OPAL.

By default, the script is defined for testing with the local Ganache instance defined in docker-compose-test.yml. To configure for production, edit setup.sh and replace the variables with the address of your Ethereum node, account, and password. This is also a chance to define the gas price you're willing to bid. More on that below.

To deploy the contract, with your Ethereum node running and fully synced, run:

```
sh setup.sh
```

If the Ethereum node is fully synced, your account and password are valid, and your account has sufficient funds, you should now have a contract deployed to the blockchain and the configuration data OPAL needs in `config.json`.

## Configuring OPAL-Interface

Once the contract is deployed, copy the contents of `config.json` into your `opal.interface.config.js`. Make sure the ethereum.enabled attribute is set to `true` to enable logging request hashes to Ethereum. You will need to restart OPAL after changing `opal.interface.config.js`.

## Gas price, gas, wei, and Ether

Ethereum has notions of currency called Ether, wei, and gas. Ether can be exchanged for regular money and are the currency held by Ethereum accounts / wallets. Ether can be subdivided into smaller units, the smallest of which is called wei, aka 1e-18 ether.

Ethereum's smart contracts cost gas to deploy and execute. Each compiled instruction costs a certain amount. Logging a query from OPAL to the blockchain costs at most 25,070 gas, depending on the length of the hash to be logged.

Gas price is how many wei per gas you bid for Ethereum network miners to execute a transaction. 1 wei is equivalent to 1e-18 ether. The higher the gas price, the sooner miners will include your transaction in their work, and the sooner it will be confirmed on the blockchain.

As of July 2018, the average gas price is 1.5 gwei or 1,500,000,000 wei for transactions that resolve in about 5 minutes.

Deployments should adjust their gas price to fit a confirmation time they find acceptable. Until a transaction has been confirmed, its result won't be available on the Ethereum network. For OPAL's logging contract, that means the log audit trail will lag reality by that much time.

Confirmation times and the exchange rate of Ether change frequently. See https://ethgasstation.info for up to date transaction confirmation estimates.
