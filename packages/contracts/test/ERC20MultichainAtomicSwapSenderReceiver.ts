import { EventFragment, FormatTypes, LogDescription } from '@ethersproject/abi'
import { TransactionResponse } from '@ethersproject/providers'
import {
  ChainMap,
  ChainNameToDomainId,
  getTestMultiProvider,
  objMap,
  TestChainNames,
  TestCoreApp,
  TestCoreDeployer,
} from '@hyperlane-xyz/sdk'
import { utils } from '@hyperlane-xyz/utils'
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { constants, Contract } from 'ethers'
import { ethers } from 'hardhat'
import { ERC20MultichainAtomicSwapSender } from 'typechain-types/contracts/ERC20MultichainAtomicSwapSender'
import { ERC20MultichainAtomicSwapReceiver } from '../typechain-types/contracts/ERC20MultichainAtomicSwapReceiver'
import { ReceiverConfig, ReceiverDeployer } from './utils/deployReceiver'
import { SenderConfig, SenderDeployer } from './utils/deploySender'

describe.only('ERC20PredefinedAtomicSwap between two ERC20 tokens', function() {
  const tokenSupply = 1000
  const initialBalance = 100
  const senderTokenAmount = 5
  const receiverTokenAmount = senderTokenAmount * 2

  const senderChain: TestChainNames = 'test1'
  const receiverChain: TestChainNames = 'test2'
  const senderDomain = ChainNameToDomainId[senderChain]
  const receiverDomain = ChainNameToDomainId[receiverChain]

  const deployContractsFixture = async () => {
    const [signer, Alice, Bob] = await ethers.getSigners()

    const multiProvider = getTestMultiProvider(signer)
    const coreDeployer = new TestCoreDeployer(multiProvider)
    const coreContractsMaps = await coreDeployer.deploy()
    const core = new TestCoreApp(coreContractsMaps, multiProvider)

    const config = core.getConnectionClientConfigMap()

    const senderConfig: ChainMap<TestChainNames, SenderConfig> = objMap(config, key => ({
      ...config[key],
      owner: signer.address,
      senderDomain,
    }))
    const senderDeployer = new SenderDeployer(multiProvider, senderConfig, core)
    await senderDeployer.deploy()
    const senderContract = senderDeployer.deployedContracts?.[senderChain]
      ?.router as ERC20MultichainAtomicSwapSender

    const receiverConfig: ChainMap<TestChainNames, ReceiverConfig> = objMap(config, key => ({
      ...config[key],
      owner: signer.address,
      receiverDomain,
    }))
    const receiverDeployer = new ReceiverDeployer(multiProvider, receiverConfig, core)
    await receiverDeployer.deploy()
    const receiverContract = receiverDeployer.deployedContracts?.[receiverChain]
      ?.router as ERC20MultichainAtomicSwapReceiver

    await receiverContract.enrollRemoteRouter(
      senderDomain,
      utils.addressToBytes32(senderContract.address),
    )
    await senderContract.enrollRemoteRouter(
      receiverDomain,
      utils.addressToBytes32(receiverContract.address),
    )

    const AliceERC20 = await ethers.getContractFactory('AliceERC20')
    const senderToken = await AliceERC20.deploy(tokenSupply)

    const BobERC20 = await ethers.getContractFactory('BobERC20')
    const receiverToken = await BobERC20.deploy(tokenSupply)

    await senderToken.transfer(Alice.address, initialBalance)
    await receiverToken.transfer(Bob.address, initialBalance)

    return {
      hyperlaneCore: core,
      Alice,
      Bob,
      senderContract,
      receiverContract,
      senderToken,
      receiverToken,
    }
  }

  const getTxLogs = async (txResponse: TransactionResponse, contract: Contract) => {
    const txReceipt = await txResponse.wait()

    return txReceipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log)
        } catch (e) {
          return null
        }
      })
      .filter((log): log is LogDescription => !!log)
  }

  const getTxLog = (txLogs: LogDescription[], event: EventFragment) => {
    return txLogs.find(log => event.format(FormatTypes.sighash) === log.signature)
  }

  it('Should be setup correctly', async function() {
    const { Alice, Bob, senderToken, receiverToken } = await loadFixture(deployContractsFixture)

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance)
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
    expect(await receiverToken.balanceOf(Bob.address)).to.equal(initialBalance)
    expect(await receiverToken.balanceOf(Alice.address)).to.equal(0)
  })

  it('Should be working correctly in the happy path', async () => {
    const {
      Alice,
      Bob,
      senderToken,
      receiverToken,
      senderContract,
      receiverContract,
      hyperlaneCore,
    } = await loadFixture(deployContractsFixture)

    // Step 1: Alice sets up a swap
    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
    const contractTx = await senderContract
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverDomain,
        receiverToken.address,
        receiverTokenAmount,
      )
    const txLogs = await getTxLogs(contractTx, senderContract)

    const txEvent = getTxLog(txLogs, senderContract.interface.getEvent('HTLCERC20Created'))
    const swapId = txEvent?.args.htlcId

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)

    let htlc = await senderContract.getHTLC(swapId)
    expect(htlc.withdrawn).to.equal(false)
    expect(htlc.refunded).to.equal(false)
    expect(htlc.receiver).to.equal(constants.AddressZero)

    // Step 2: Bob sends money to the swap contract and initiates withdrawal
    await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount)
    const bobWithdrawalTx = await receiverContract
      .connect(Bob)
      .startWithdrawal(
        timeLock,
        Alice.address,
        senderDomain,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )
    const bobWithdrawalTxLogs = await getTxLogs(bobWithdrawalTx, receiverContract)
    const bobWithdrawalTxEvent = getTxLog(
      bobWithdrawalTxLogs,
      receiverContract.interface.getEvent('HTLCERC20WithdrawalInitiated'),
    )
    const b2aSwapId = bobWithdrawalTxEvent?.args.htlcId
    expect(b2aSwapId).to.equal(swapId)

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)

    expect(await receiverToken.balanceOf(Bob.address)).to.equal(
      initialBalance - receiverTokenAmount,
    )
    expect(await receiverToken.balanceOf(receiverContract.address)).to.equal(receiverTokenAmount)
    expect(await receiverToken.balanceOf(Alice.address)).to.equal(0)

    htlc = await senderContract.getHTLC(swapId)
    expect(htlc.withdrawn).to.equal(false)
    expect(htlc.refunded).to.equal(false)
    expect(htlc.receiver).to.equal(constants.AddressZero)

    let htlcBob = await receiverContract.getHTLC(swapId)
    expect(htlcBob.confirmed).to.equal(false)
    expect(htlcBob.refunded).to.equal(false)
    expect(htlcBob.receiver).to.equal(Alice.address)

    // Step 3: The withdrawal gets requested in Alice's HTLC by Hyperlane
    const b2aTxs = await hyperlaneCore.processOutboundMessages(receiverChain)
    expect(b2aTxs.get(senderChain)?.length).to.equal(1)

    htlc = await senderContract.getHTLC(swapId)
    expect(htlc.withdrawn).to.equal(true)
    expect(htlc.refunded).to.equal(false)
    expect(htlc.receiver).to.equal(Bob.address)

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(senderContract.address)).to.equal(0)
    expect(await senderToken.balanceOf(Bob.address)).to.equal(senderTokenAmount)

    // Step 4: The withdrawal gets confirmed in Bob's HTLC by Hyperlane
    const a2bTxs = await hyperlaneCore.processOutboundMessages(senderChain)
    expect(a2bTxs.get(receiverChain)?.length).to.equal(1)

    htlcBob = await receiverContract.getHTLC(swapId)
    expect(htlcBob.confirmed).to.equal(true)
    expect(htlcBob.refunded).to.equal(false)
    expect(htlcBob.receiver).to.equal(Alice.address)

    expect(await receiverToken.balanceOf(Bob.address)).to.equal(
      initialBalance - receiverTokenAmount,
    )
    expect(await receiverToken.balanceOf(receiverContract.address)).to.equal(0)
    expect(await receiverToken.balanceOf(Alice.address)).to.equal(receiverTokenAmount)
  })

  // it('[Sender] Should allow refunds from sender contract', async () => {
  //   const {
  //     Alice,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx: TransactionResponse = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )
  //   const txLogs = await getTxLogs(contractTx, senderContract)
  //   const txEvent = getTxLog(txLogs, senderContract.interface.getEvent('HTLCERC20Created'))
  //   const swapId = txEvent?.args.contractId

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)

  //   const swapContract = await senderContract.getContract(swapId)
  //   expect(swapContract.withdrawn).to.equal(false)
  //   expect(swapContract.refunded).to.equal(false)
  //   expect(swapContract.receiver).to.equal(constants.AddressZero)

  //   await time.increaseTo(timeLock)

  //   const refundTx: TransactionResponse = await senderContract.connect(Alice).refund(swapId)
  //   const refundTxLogs = await getTxLogs(refundTx, senderContract)
  //   const refundTxEvent = getTxLog(
  //     refundTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Refunded'),
  //   )
  //   expect(refundTxEvent).to.not.equal(undefined)

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(0)
  // })

  // it('[Sender] should not allow deposits without approval', async () => {
  //   const {
  //     Alice,
  //     receiverToken,
  //     senderToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)
  //   const timeLock = (await time.latest()) + 5 // 5 seconds
  //   await expect(
  //     senderContract
  //       .connect(Alice)
  //       .newContract(
  //         timeLock,
  //         senderToken.address,
  //         senderTokenAmount,
  //         receiverToken.address,
  //         receiverTokenAmount,
  //         receiverContract.address,
  //       ),
  //   ).to.be.revertedWith('tokensTransferable: token allowance must be >= amount')
  // })

  // it('[Sender] should not allow deposits without balance', async () => {
  //   const {
  //     Alice,
  //     receiverToken,
  //     senderToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)
  //   const timeLock = (await time.latest()) + 5 // 5 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   await expect(
  //     senderContract
  //       .connect(Alice)
  //       .newContract(
  //         timeLock,
  //         senderToken.address,
  //         0,
  //         receiverToken.address,
  //         receiverTokenAmount,
  //         receiverContract.address,
  //       ),
  //   ).to.be.revertedWith('tokensTransferable: token amount must be > 0')
  // })

  // it('[Sender] should not allow deposits with received balance set to 0', async () => {
  //   const {
  //     Alice,
  //     receiverToken,
  //     senderToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)
  //   const timeLock = (await time.latest()) + 5 // 5 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   await expect(
  //     senderContract
  //       .connect(Alice)
  //       .newContract(
  //         timeLock,
  //         senderToken.address,
  //         senderTokenAmount,
  //         receiverToken.address,
  //         0,
  //         receiverContract.address,
  //       ),
  //   ).to.be.revertedWith('newContract: token amount must be > 0')
  // })

  // it('[Sender] should not allow deposits with timelock in the past', async () => {
  //   const {
  //     Alice,
  //     receiverToken,
  //     senderToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)
  //   let timeLock = await time.latest()
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   await expect(
  //     senderContract
  //       .connect(Alice)
  //       .newContract(
  //         timeLock,
  //         senderToken.address,
  //         senderTokenAmount,
  //         receiverToken.address,
  //         receiverTokenAmount,
  //         receiverContract.address,
  //       ),
  //   ).to.be.revertedWith('futureTimelock: timelock time must be in the future')

  //   timeLock = (await time.latest()) - 5 // current time
  //   await expect(
  //     senderContract
  //       .connect(Alice)
  //       .newContract(
  //         timeLock,
  //         senderToken.address,
  //         senderTokenAmount,
  //         receiverToken.address,
  //         receiverTokenAmount,
  //         receiverContract.address,
  //       ),
  //   ).to.be.revertedWith('futureTimelock: timelock time must be in the future')
  // })

  // it('[Sender] should not allow duplicate contract IDs', async () => {
  //   const {
  //     Alice,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount * 2)
  //   await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )

  //   await expect(
  //     senderContract
  //       .connect(Alice)
  //       .newContract(
  //         timeLock,
  //         senderToken.address,
  //         senderTokenAmount,
  //         receiverToken.address,
  //         receiverTokenAmount,
  //         receiverContract.address,
  //       ),
  //   ).to.be.revertedWith('newContract: Contract already exists')
  // })

  // it('[Sender] should not allow calling withdraw directly', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderContract,
  //     senderToken,
  //     receiverContract,
  //     receiverToken,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx: TransactionResponse = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )
  //   const txLogs = await getTxLogs(contractTx, senderContract)
  //   const txEvent = getTxLog(txLogs, senderContract.interface.getEvent('HTLCERC20Created'))
  //   const swapId = txEvent?.args.contractId

  //   await expect(senderContract.connect(Bob).withdraw(swapId, Bob.address)).to.be.revertedWith(
  //     'withdraw: must be called by the receiver contract',
  //   )
  // })

  // it('[Receiver] should not allow initiating withdrawals without token approval', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )

  //   const aliceTxLogs = await getTxLogs(contractTx, senderContract)
  //   const aliceTxEvent = getTxLog(
  //     aliceTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Created'),
  //   )

  //   const swapId = aliceTxEvent?.args.contractId

  //   await expect(
  //     receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId),
  //   ).to.be.revertedWith('startWithdrawal: token allowance must be >= amount')
  //   expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)
  // })

  // it('[Receiver] should not allow withdrawals with token approval under required amount', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )

  //   const aliceTxLogs = await getTxLogs(contractTx, senderContract)
  //   const aliceTxEvent = getTxLog(
  //     aliceTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Created'),
  //   )

  //   const swapId = aliceTxEvent?.args.contractId

  //   await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount - 1)
  //   await expect(
  //     receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId),
  //   ).to.be.revertedWith('startWithdrawal: token allowance must be >= amount')
  //   expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)
  // })

  // it('[Receiver] should not allow duplicate withdrawals', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )

  //   const aliceTxLogs = await getTxLogs(contractTx, senderContract)
  //   const aliceTxEvent = getTxLog(
  //     aliceTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Created'),
  //   )

  //   const swapId = aliceTxEvent?.args.contractId

  //   await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount)
  //   await receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId)

  //   await expect(
  //     receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId),
  //   ).to.be.revertedWith('contractNonExistent: contract fulfilled already')
  //   expect(await senderToken.balanceOf(Bob.address)).to.equal(senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(0)
  //   expect(await receiverToken.balanceOf(Alice.address)).to.equal(0)
  //   expect(await receiverToken.balanceOf(receiverContract.address)).to.equal(receiverTokenAmount)
  // })

  // it('[Receiver] should not allow initiating withdrawals after timelock', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )

  //   const aliceTxLogs = await getTxLogs(contractTx, senderContract)
  //   const aliceTxEvent = getTxLog(
  //     aliceTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Created'),
  //   )

  //   const swapId = aliceTxEvent?.args.contractId

  //   await time.increaseTo(timeLock)

  //   await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount)

  //   await expect(
  //     receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId),
  //   ).to.be.revertedWith('startWithdrawal: timelock expired')
  //   expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)
  // })

  // it('[Receiver] should allow finalizing withdrawals after timelock', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )

  //   const aliceTxLogs = await getTxLogs(contractTx, senderContract)
  //   const aliceTxEvent = getTxLog(
  //     aliceTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Created'),
  //   )

  //   const swapId = aliceTxEvent?.args.contractId

  //   await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount)
  //   await receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId)

  //   await time.increaseTo(timeLock)

  //   await receiverContract.connect(Alice).finishWithdrawal(swapId)
  //   expect(await senderToken.balanceOf(Bob.address)).to.equal(senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(0)
  //   expect(await receiverToken.balanceOf(Alice.address)).to.equal(receiverTokenAmount)
  //   expect(await receiverToken.balanceOf(receiverContract.address)).to.equal(0)
  // })

  // it('[Receiver] should not allow finalizing withdrawals without initiating', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )

  //   const aliceTxLogs = await getTxLogs(contractTx, senderContract)
  //   const aliceTxEvent = getTxLog(
  //     aliceTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Created'),
  //   )

  //   const swapId = aliceTxEvent?.args.contractId

  //   await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount)

  //   await expect(receiverContract.connect(Alice).finishWithdrawal(swapId)).to.be.revertedWith(
  //     'contractExists: contractId does not exist',
  //   )
  // })

  // it('[Sender] should not allow refunds on non-existing contracts', async () => {
  //   const { Bob, senderContract } = await loadFixture(deployContractsFixture)

  //   await expect(
  //     senderContract
  //       .connect(Bob)
  //       .refund('0x2335bdc450f6affcf18b52ea4e50076346d79533fe5131664b50feea35e0f307'),
  //   ).to.be.revertedWith('contractExists: contractId does not exist')
  // })

  // it('[Sender] should only allow refunds from sender', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 5 // 5 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx: TransactionResponse = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )
  //   const aliceTxLogs = await getTxLogs(contractTx, senderContract)
  //   const aliceTxEvent = getTxLog(
  //     aliceTxLogs,
  //     senderContract.interface.getEvent('HTLCERC20Created'),
  //   )

  //   const a2bSwapId = aliceTxEvent?.args.contractId

  //   await time.increaseTo(timeLock)

  //   await expect(senderContract.connect(Bob).refund(a2bSwapId)).to.be.revertedWith(
  //     'refundable: not sender',
  //   )
  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
  //   expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)
  // })

  // it('[Sender] should not allow duplicate refunds', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx: TransactionResponse = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )
  //   const txLogs = await getTxLogs(contractTx, senderContract)
  //   const txEvent = getTxLog(txLogs, senderContract.interface.getEvent('HTLCERC20Created'))
  //   const swapId = txEvent?.args.contractId

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)

  //   await time.increaseTo(timeLock)

  //   await senderContract.connect(Alice).refund(swapId)

  //   await expect(senderContract.connect(Alice).refund(swapId)).to.be.revertedWith(
  //     'refundable: already refunded',
  //   )

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance)
  //   expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(0)
  // })

  // it('[Sender] should not allow refunds on withdrawal started contracts', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx: TransactionResponse = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )
  //   const txLogs = await getTxLogs(contractTx, senderContract)
  //   const txEvent = getTxLog(txLogs, senderContract.interface.getEvent('HTLCERC20Created'))
  //   const swapId = txEvent?.args.contractId

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)

  //   await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount)
  //   await receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId)

  //   await time.increaseTo(timeLock)

  //   await expect(senderContract.connect(Alice).refund(swapId)).to.be.revertedWith(
  //     'refundable: already withdrawn',
  //   )
  // })

  // it('[Sender] should not allow refunds on withdrawn contracts', async () => {
  //   const {
  //     Alice,
  //     Bob,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx: TransactionResponse = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )
  //   const txLogs = await getTxLogs(contractTx, senderContract)
  //   const txEvent = getTxLog(txLogs, senderContract.interface.getEvent('HTLCERC20Created'))
  //   const swapId = txEvent?.args.contractId

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)

  //   await receiverToken.connect(Bob).approve(receiverContract.address, receiverTokenAmount)
  //   await receiverContract.connect(Bob).startWithdrawal(senderContract.address, swapId)
  //   await receiverContract.connect(Alice).finishWithdrawal(swapId)

  //   await time.increaseTo(timeLock)

  //   await expect(senderContract.connect(Alice).refund(swapId)).to.be.revertedWith(
  //     'refundable: already withdrawn',
  //   )
  // })

  // it('[Sender] should not allow refunds before timelock', async () => {
  //   const {
  //     Alice,
  //     senderToken,
  //     receiverToken,
  //     senderContract,
  //     receiverContract,
  //   } = await loadFixture(deployContractsFixture)

  //   const timeLock = (await time.latest()) + 10 // 10 seconds
  //   await senderToken.connect(Alice).approve(senderContract.address, senderTokenAmount)
  //   const contractTx: TransactionResponse = await senderContract
  //     .connect(Alice)
  //     .newContract(
  //       timeLock,
  //       senderToken.address,
  //       senderTokenAmount,
  //       receiverToken.address,
  //       receiverTokenAmount,
  //       receiverContract.address,
  //     )
  //   const txLogs = await getTxLogs(contractTx, senderContract)
  //   const txEvent = getTxLog(txLogs, senderContract.interface.getEvent('HTLCERC20Created'))
  //   const swapId = txEvent?.args.contractId

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)

  //   await expect(senderContract.connect(Alice).refund(swapId)).to.be.revertedWith(
  //     'refundable: timelock not yet passed',
  //   )

  //   await time.increaseTo(timeLock)

  //   expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
  //   expect(await senderToken.balanceOf(senderContract.address)).to.equal(senderTokenAmount)
  // })
})
