require('dotenv').config()
require('@nomicfoundation/hardhat-toolbox')
require('hardhat-gas-reporter')
require('solidity-coverage')
require('hardhat-deploy')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    // solidity: "0.8.8",
    solidity: {
        compilers: [{ version: '0.8.8' }, { version: '0.6.6' }],
    },
    defaultNetwork: 'hardhat',
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || '',
            accounts: [process.env.SEPOLIA_PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: 'gas-report.txt',
        noColors: true,
        currency: 'USD',
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        token: 'ETH',
    },
}
