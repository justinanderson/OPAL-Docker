#! /usr/bin/env node

const fs = require('fs');
const Web3 = require('web3');

// Set up CLI commands.
const argv = require('yargs')
    .command('setup', 'Configure Ethereum connection and account. Run this first.',
        {
            url: {
                describe: 'URL of Ethereum node',
            },
            account: {
                describe: 'Address of account on Ethereum network',
            },
            password: {
                describe: 'Password for account on Ethereum network'
            },
            gasPrice: {
                describe: 'Price per wei to pay for Ethereum transactions. A lower gas price than the current network average can lead to long confirmation time for transactions.'
            }
        },
        setup)
    .command('status', 'Check configuration and if Ethereum network is reachable.',
        {},
        status)
    .command('compile', 'Compiles Solidity file Logger.sol for deployment. Saves result to output.json.',
        {},
        compile)
    .command('deploy', 'Deploy the compiled smart contract from output.json.',
        {},
        deploy)
    .command('log <hash>', 'Log a hash using the deployed contract.',
        {},
        logHash)
    .command('events', 'List all logged hashes.',
        {
            filter: {
                alias: 'f',
                describe: 'Optional hash to search for'
            },
            verbose: {
                alias: 'v',
                describe: 'Outputs raw event details'
            }
        },
        events)
    .demandCommand()
    .example('$0 compile', "Compiles Logger.sol into output.json.")
    .example('$0 deploy', "Deploys the compiled contract from output.json using the connection defined in config.json.")
    .example('$0 log 0x1234', "Logs the hash 0x1234 to the contract and connection defined in config.json.")
    .example('$0 events', "Lists all logged hashes for the contract and connection defined in config.json.")
    .example('$0 events --filter 0x1234', "Lists all logged hashes where the hash matches the filter for the contract and connection defined in config.json.")
    .help()
.argv

var config;
var web3;
var Logger;

// Convenience function to connect to Ethereum node using info from
// config.json.
async function initEthereum() {
    try {
        config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    } catch (err) {
        console.error("config.json missing or malformed. Please delete config.json, run setup, and try again.");
    }
    
    web3 = new Web3(config.ethereum.url);
    web3.eth.defaultAccount = config.ethereum.account;
    web3.eth.personal.unlockAccount(
        config.ethereum.account,
        config.ethereum.password)
    .catch((error) => {
        console.error("Failed to unlock Ethereum account. Please verify account and password in config.json are correct.");
        console.error(error, {depth: null});
        process.exit(1);
    });
}

// Convenience function to load Logger contract info from config.json and
// prepare for transactions.
function loadContract() {
    Logger = new web3.eth.Contract(
        config.contract.abi,
        config.contract.address);
}

// Command 'setup'
function setup(args) {
    var readline = require('readline');

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(args);

    var answers = {
        enabled: true,
        url: (args.url ? args.url : null),
        account: (args.account !== undefined ? args.account : null),
        password: (args.password !== undefined ? args.password : null),
        gasPrice: (args.gasPrice !== undefined ? args.gasPrice : null)
    }

    let questions = [
        {
            question: 'Ethereum node URL [http://localhost:8545/]: ',
            default: 'http://localhost:8545/',
            key: 'url'
        },
        {
            question: 'Ethereum account address: ',
            key: 'account'
        },
        {
            question: 'Ethereum account password []: ',
            default: '',
            key: 'password'
        },
        {
            question: 'Gas price in wei [10]: ',
            default: 10,
            key: 'gasPrice'
        }
    ]

    console.log("\nWarning: this command will overwrite the file config.json.\n");

    function askQuestions(index) {
        if (index >= questions.length) {
            rl.close();
            var output = {
                ethereum: answers
            };
            console.log();
            console.log(answers);
            console.log();
            fs.writeFileSync('config.json', JSON.stringify(output, null, 4), 'utf8');
            return;
        }
        // Skip questions already answered via args
        if (answers[questions[index]['key']] != null) {
            askQuestions(index + 1);
            return;
        }
        // Prompt user for any unanswered questions
        rl.question(questions[index]['question'], (answer) => {
            if (answer.length == 0) {
                // Use the default if it exists
                if (questions[index]['default'] !== undefined) {
                    answer = questions[index]['default'];
                } else {
                    // Require an answer if there's no default value.
                    askQuestions(index);
                    return;
                }
            }
            answers[questions[index]['key']] = answer;
            askQuestions(index + 1);
        })
    }
    askQuestions(0)
}

// Command 'status'
async function status(args) {
    await initEthereum();
    console.log("Client URL: " + config.ethereum.url);
    console.log("Account: " + config.ethereum.account);
    var balance = await web3.eth.getBalance(config.ethereum.account);
    console.log("Balance: " + web3.utils.fromWei(balance) + " ETH");
}

// Command 'compile'
function compile(args) {
    const solc = require('solc');
    let input = {
        language: "Solidity",
        sources: {
            "Logger": {
                content: fs.readFileSync('Logger.sol', 'utf8')
            }
        },
        settings: {
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode", "evm.gasEstimates"]
                }
            }
        }
    };
    console.log("solc compiler input:");
    console.log(input);
    var output = solc.compileStandardWrapper(JSON.stringify(input));
    output = JSON.parse(output);
    fs.writeFileSync('output.json', JSON.stringify(output, null, 4), 'utf8');
    console.log("\nCompilation result saved to output.json.\n");
}

// Command 'deploy'
function deploy(args) {
    initEthereum();
    // Load compiled contract from output.json.
    compilation = JSON.parse(fs.readFileSync('output.json', 'utf8'));
    let abi = compilation.contracts.Logger.Logger.abi;
    let bytecode = compilation.contracts.Logger.Logger.evm.bytecode;
    console.log("Deploying contract...");
    Logger = new web3.eth.Contract(abi);
    // Deploy to Ethereum network.
    Logger.deploy({
        data: '0x' + bytecode.object
    })
    .send({
        from: web3.eth.defaultAccount,
        gas: 3e5, // Uses closer to 160000 for deployment.
        gasPrice: config.ethereum.gasPrice
    })
    .then(function (newContractInstance) {
        console.log("Contract deployed to " + newContractInstance.options.address);
        config.ethereum['contract'] = {
            abi: abi,
            address: newContractInstance.options.address
        }
        console.dir(config, {depth: null});
        fs.writeFileSync('config.json', JSON.stringify(config, null, 4), 'utf8');
        console.log("Contract details written to config.json.");
    });
}

// Command 'log'
function logHash(args) {
    initEthereum();
    loadContract();
    // Expects to log a 256-bit hexadecimal number or string
    let hash = web3.utils.toBN(args.hash);
    Logger.methods.log(hash).send(
        {
            from: web3.eth.defaultAccount,
            // Logger.sol as written uses at most 25070 gas per logged event.
            gas: 3e4,
            // gasPrice is how many wei per gas to bid for the Ethereum network
            // to execute a transaction. 1 wei is equivalent to 1e-18 ether.
            // 
            // Deployments should adjust their gas price to fit a confirmation
            // time they find acceptable. Until a transaction has been
            // confirmed, its result won't be available on the Ethereum
            // network. For the Logger contract, that means the log audit trail
            // will lag reality by that much time.
            //
            // Confirmation times and the exchange rate of Ether change
            // frequently. See https://ethgasstation.info for up to date
            // transaction confirmation estimates.
            gasPrice: config.ethereum.gasPrice
        }
    ).on('error', function (error) {
        throw error;
    });
}

// Command 'events'
function events(args) {
    initEthereum();
    loadContract();
    var options = { fromBlock: 0 };
    // Optionally limit to events matching a hash.
    if (args.filter !== undefined) {
        // Uses web3's BigNumber to handle 256-bit uints.
        // Will throw an error if args.filter can't be parsed as a number.
        options.filter = { hash: web3.utils.toBN(args.filter) };
    }
    let f = (args.verbose) ? deepDir : printEvents;
    Logger.getPastEvents(
        "Logged", options
    ).then(f);
}

// Convenience function to log objects without truncating for depth.
function deepDir(object) {
    console.dir(object, {depth: null});
}

// Prints ASCII table of pertinent block info.
// If --verbose is enabled, prints raw JSON instead.
function printEvents(events) {
    var widths = ["Block #".length, "Block Hash".length, "Logged Value".length];
    let mapped = events.map(function (value) {
        result = [String(value.blockNumber), value.blockHash, "0x" + web3.utils.toBN(value.returnValues.hash).toString(16)];
        widths[0] = Math.max(widths[0], result[0].length);
        widths[1] = Math.max(widths[1], result[1].length);
        widths[2] = Math.max(widths[2], result[2].length);
        return result;
    });
    console.log(
        "Block #".padStart(widths[0]) + " | " +
        "Block Hash".padEnd(widths[1]) + " | " +
        "Logged Value".padEnd(widths[2])
    );
    console.log("-".repeat(6 + widths.reduce((a, b) => a + b)));
    mapped.forEach(value => {
        console.log(
            value[0].padStart(widths[0]) + " | " +
            value[1].padStart(widths[1]) + " | " +
            value[2].padStart(widths[2])
        );
    });
}