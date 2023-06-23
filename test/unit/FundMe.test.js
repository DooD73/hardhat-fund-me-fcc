const { assert, expect } = require('chai')
const { deployments, ethers, getNamedAccounts } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config')

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Fund Me', async () => {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther('1')
          beforeEach(async () => {
              // deploy FundMe contract
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(['all'])
              fundMe = await ethers.getContract('FundMe', deployer) // will get the most recent deployment of FundMe contract
              mockV3Aggregator = await ethers.getContract(
                  'MockV3Aggregator',
                  deployer
              )
          })

          describe('constructor', async () => {
              it('Should set the aggregator addresses correctly', async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe('fund', async () => {
              it("Should fail if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      'You need to spend more ETH!'
                  )
              })

              it('Should update the amount funded data structure', async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it('Should add funder to array of funders', async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer)
              })
          })

          describe('withdraw', async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it('Should withdraw from a single funder', async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // TO DEBUG IN VSCODE: add breakpoints, they stop the script at the pointed line (red dot at the left), allows us to drop to a debug console and see all the variables that are happening at that point in time

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingBalanceDeployer),
                      endingBalanceDeployer.add(gasCost).toString()
                  )
              })

              it('Should allow us to withdraw with multiple funders', async () => {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // beacuse when we call this, the deployer is connected to the account
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingBalanceDeployer),
                      endingBalanceDeployer.add(gasCost).toString()
                  )

                  // make sure funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it('Should do a cheaper withdraw with multiple funders', async () => {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // beacuse when we call this, the deployer is connected to the account
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingBalanceDeployer),
                      endingBalanceDeployer.add(gasCost).toString()
                  )

                  // make sure funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it('Should allow only the owner to withdraw', async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, 'FundMe__NotOwner')
              })
          })
      })

/*
******************************************************************************************************

    RUN SPECIFIC TESTS
    "yarn hardhat test --grep <keyword>"

******************************************************************************************************
    
    SOLIDITY CONSOLE.LOG()
    
    In solidity contract we can use console.log() to print out values to the console
    To do so we need to add an import "import hardhat/console.sol"
    and then right in solidity we can "console.log()", similar as we do in JS
    they will console log in the terminal where we run the 'yarn hardhat test' command

    url: https://hardhat.org/tutorial/debugging-with-hardhat-network.html#solidity-console-log

******************************************************************************************************
*/
