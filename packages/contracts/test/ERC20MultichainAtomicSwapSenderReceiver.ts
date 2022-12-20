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

describe.only('ERC20PredefinedAtomicSwap between two ERC20 tokens', function () {
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

    const senderConfig: ChainMap<TestChainNames, SenderConfig> = objMap(config, (key) => ({
      ...config[key],
      owner: signer.address,
      senderDomain,
    }))
    const senderDeployer = new SenderDeployer(multiProvider, senderConfig, core)
    await senderDeployer.deploy()
    const senderContract = senderDeployer.deployedContracts?.[senderChain]
      ?.router as ERC20MultichainAtomicSwapSender

    const receiverConfig: ChainMap<TestChainNames, ReceiverConfig> = objMap(config, (key) => ({
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
      .map((log) => {
        try {
          return contract.interface.parseLog(log)
        } catch (e) {
          return null
        }
      })
      .filter((log): log is LogDescription => !!log)
  }

  const getTxLog = (txLogs: LogDescription[], event: EventFragment) => {
    return txLogs.find((log) => event.format(FormatTypes.sighash) === log.signature)
  }

  it('Should be setup correctly', async function () {
    const { Alice, Bob, senderToken, receiverToken, senderContract, receiverContract } =
      await loadFixture(deployContractsFixture)

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance)
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
    expect(await receiverToken.balanceOf(Bob.address)).to.equal(initialBalance)
    expect(await receiverToken.balanceOf(Alice.address)).to.equal(0)
    expect(await senderContract.getHTLCIds()).to.be.empty
    expect(await receiverContract.getHTLCIds()).to.be.empty
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

    expect(await senderContract.getHTLCIds()).to.be.of.length(1)
    expect((await senderContract.getHTLCIds())[0]).to.equal(swapId)

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

    expect(await receiverContract.getHTLCIds()).to.be.of.length(1)
    expect((await receiverContract.getHTLCIds())[0]).to.equal(swapId)

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
})
