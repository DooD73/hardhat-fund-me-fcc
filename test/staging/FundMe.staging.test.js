const { getNamedAccounts, ethers, network } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config')
const { assert } = require('chai')

developmentChains.includes(network.name)
    ? describe.skip
    : describe('Fund Me', async () => {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther('0.03')
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract('FundMe', deployer)
              // we don't deplot and fixture because in our staging test we assume it's already deployed
              // we don't need a mock because we assume we are on a testnet
          })

          it('Should allow people to fund and withdraw', async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), '0')
          })
      })
