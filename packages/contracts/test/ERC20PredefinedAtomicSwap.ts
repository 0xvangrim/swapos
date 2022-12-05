import { EventFragment, FormatTypes, LogDescription } from '@ethersproject/abi'
import { TransactionResponse } from '@ethersproject/providers'
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { constants, Contract } from 'ethers'
import { ethers } from 'hardhat'

describe('ERC20PredefinedAtomicSwap between two ERC20 tokens', function() {
  const tokenSupply = 1000
  const initialBalance = 100
  const senderTokenAmount = 5
  const receiverTokenAmount = senderTokenAmount * 2

  const deployContractsFixture = async () => {
    const [, Alice, Bob] = await ethers.getSigners()
    // if both tokens run on the same chain, they can share the HTLC contract to
    // coordinate the swap. They can also use separate instances on the same chain,
    // or even separate instances on different chains.
    // The key is the HTLC contract must be running on the same chain
    // that the target Token to be transferred between the two counterparties runs on

    const ERC20PredefinedAtomicSwap = await ethers.getContractFactory('ERC20PredefinedAtomicSwap')
    const htlc = await ERC20PredefinedAtomicSwap.deploy()

    const AliceERC20 = await ethers.getContractFactory('AliceERC20')
    const senderToken = await AliceERC20.deploy(tokenSupply)

    const BobERC20 = await ethers.getContractFactory('BobERC20')
    const receiverToken = await BobERC20.deploy(tokenSupply)

    await senderToken.transfer(Alice.address, initialBalance) // so Alice has some tokens to trade
    await receiverToken.transfer(Bob.address, initialBalance) // so Bob has some tokens to trade

    return {
      Alice,
      Bob,
      htlc,
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
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    // Step 1: Alice sets up a swap
    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx: TransactionResponse = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )
    const txLogs = await getTxLogs(contractTx, htlc)
    const txEvent = getTxLog(txLogs, htlc.interface.getEvent('HTLCERC20Created'))
    const swapId = txEvent?.args.contractId

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)

    let a2bContract = await htlc.getContract(swapId)
    expect(a2bContract.withdrawn).to.equal(false)
    expect(a2bContract.refunded).to.equal(false)
    expect(a2bContract.receiver).to.equal(constants.AddressZero)
    expect(a2bContract.counterContractId).to.equal(constants.Zero)

    // Step 2: Bob sends money to the swap contract and withdraws money in the same transaction
    await receiverToken.connect(Bob).approve(htlc.address, receiverTokenAmount)
    const bobContractTx: TransactionResponse = await htlc.connect(Bob).withdraw(swapId)
    const bobTxLogs = await getTxLogs(bobContractTx, htlc)
    const bobTxEvent = getTxLog(bobTxLogs, htlc.interface.getEvent('HTLCERC20Withdrawn'))
    const b2aSwapId = bobTxEvent?.args.contractId

    expect(await receiverToken.balanceOf(Bob.address)).to.equal(
      initialBalance - receiverTokenAmount,
    )
    expect(await receiverToken.balanceOf(htlc.address)).to.equal(0)
    expect(await receiverToken.balanceOf(Alice.address)).to.equal(receiverTokenAmount)

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(0)
    expect(await senderToken.balanceOf(Bob.address)).to.equal(senderTokenAmount)

    const b2aContract = await htlc.getContract(b2aSwapId)
    expect(b2aContract.withdrawn).to.equal(true)
    expect(b2aContract.refunded).to.equal(false)
    expect(b2aContract.receiver).to.equal(Alice.address)
    expect(b2aContract.counterContractId).to.equal(swapId)

    a2bContract = await htlc.getContract(swapId)
    expect(a2bContract.withdrawn).to.equal(true)
    expect(a2bContract.refunded).to.equal(false)
    expect(a2bContract.receiver).to.equal(Bob.address)
    expect(a2bContract.counterContractId).to.equal(b2aSwapId)
  })

  it('Should allow refunds', async () => {
    const { Alice, senderToken, receiverToken, htlc } = await loadFixture(deployContractsFixture)

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx: TransactionResponse = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )
    const txLogs = await getTxLogs(contractTx, htlc)
    const txEvent = getTxLog(txLogs, htlc.interface.getEvent('HTLCERC20Created'))
    const swapId = txEvent?.args.contractId

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)

    await time.increaseTo(timeLock)

    await htlc.connect(Alice).refund(swapId)

    const a2bContract = await htlc.getContract(swapId)
    expect(a2bContract.withdrawn).to.equal(false)
    expect(a2bContract.refunded).to.equal(true)
  })

  it('should not allow deposits without approval', async () => {
    const { Alice, receiverToken, senderToken, htlc } = await loadFixture(deployContractsFixture)
    const timeLock = (await time.latest()) + 5 // 5 seconds
    await expect(
      htlc
        .connect(Alice)
        .newContract(
          timeLock,
          senderToken.address,
          senderTokenAmount,
          receiverToken.address,
          receiverTokenAmount,
        ),
    ).to.be.revertedWith('tokensTransferable: token allowance must be >= amount')
  })

  it('should not allow deposits without balance', async () => {
    const { Alice, receiverToken, senderToken, htlc } = await loadFixture(deployContractsFixture)
    const timeLock = (await time.latest()) + 5 // 5 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    await expect(
      htlc
        .connect(Alice)
        .newContract(timeLock, senderToken.address, 0, receiverToken.address, receiverTokenAmount),
    ).to.be.revertedWith('tokensTransferable: token amount must be > 0')
  })

  it('should not allow deposits with received balance set to 0', async () => {
    const { Alice, receiverToken, senderToken, htlc } = await loadFixture(deployContractsFixture)
    const timeLock = (await time.latest()) + 5 // 5 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    await expect(
      htlc
        .connect(Alice)
        .newContract(timeLock, senderToken.address, senderTokenAmount, receiverToken.address, 0),
    ).to.be.revertedWith('newContract: token amount must be > 0')
  })

  it('should not allow deposits with timelock in the past', async () => {
    const { Alice, receiverToken, senderToken, htlc } = await loadFixture(deployContractsFixture)
    let timeLock = await time.latest()
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    await expect(
      htlc
        .connect(Alice)
        .newContract(
          timeLock,
          senderToken.address,
          senderTokenAmount,
          receiverToken.address,
          receiverTokenAmount,
        ),
    ).to.be.revertedWith('futureTimelock: timelock time must be in the future')

    timeLock = (await time.latest()) - 5 // current time
    await expect(
      htlc
        .connect(Alice)
        .newContract(
          timeLock,
          senderToken.address,
          senderTokenAmount,
          receiverToken.address,
          receiverTokenAmount,
        ),
    ).to.be.revertedWith('futureTimelock: timelock time must be in the future')
  })

  it('should not allow duplicate contract IDs', async () => {
    const { Alice, senderToken, receiverToken, htlc } = await loadFixture(deployContractsFixture)

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount * 2)
    await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )

    await expect(
      htlc
        .connect(Alice)
        .newContract(
          timeLock,
          senderToken.address,
          senderTokenAmount,
          receiverToken.address,
          receiverTokenAmount,
        ),
    ).to.be.revertedWith('newContract: Contract already exists')
  })

  it('should not allow withdrawals on non-existing contracts', async () => {
    const { Bob, htlc } = await loadFixture(deployContractsFixture)

    await expect(
      htlc
        .connect(Bob)
        .withdraw('0x2335bdc450f6affcf18b52ea4e50076346d79533fe5131664b50feea35e0f307'),
    ).to.be.revertedWith('contractExists: contractId does not exist')
  })

  it('should not allow withdrawals without token approval', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )

    const aliceTxLogs = await getTxLogs(contractTx, htlc)
    const aliceTxEvent = getTxLog(aliceTxLogs, htlc.interface.getEvent('HTLCERC20Created'))

    const a2bSwapId = aliceTxEvent?.args.contractId

    await expect(htlc.connect(Bob).withdraw(a2bSwapId)).to.be.revertedWith(
      'tokensTransferable: token allowance must be >= amount',
    )
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)
  })

  it('should not allow withdrawals with token approval under required amount', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )

    const aliceTxLogs = await getTxLogs(contractTx, htlc)
    const aliceTxEvent = getTxLog(aliceTxLogs, htlc.interface.getEvent('HTLCERC20Created'))

    const a2bSwapId = aliceTxEvent?.args.contractId

    await receiverToken.connect(Bob).approve(htlc.address, receiverTokenAmount - 1)
    await expect(htlc.connect(Bob).withdraw(a2bSwapId)).to.be.revertedWith(
      'tokensTransferable: token allowance must be >= amount',
    )
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)
  })

  it('should not allow duplicate withdrawals', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )

    const aliceTxLogs = await getTxLogs(contractTx, htlc)
    const aliceTxEvent = getTxLog(aliceTxLogs, htlc.interface.getEvent('HTLCERC20Created'))

    const a2bSwapId = aliceTxEvent?.args.contractId

    await receiverToken.connect(Bob).approve(htlc.address, receiverTokenAmount * 2)

    await htlc.connect(Bob).withdraw(a2bSwapId)
    await expect(htlc.connect(Bob).withdraw(a2bSwapId)).to.be.revertedWith(
      'withdrawable: already withdrawn',
    )
    expect(await senderToken.balanceOf(Bob.address)).to.equal(senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(0)
    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)

    expect(await receiverToken.balanceOf(Bob.address)).to.equal(
      initialBalance - receiverTokenAmount,
    )
    expect(await receiverToken.balanceOf(htlc.address)).to.equal(0)
    expect(await receiverToken.balanceOf(Alice.address)).to.equal(receiverTokenAmount)
  })

  it('should not allow withdrawals after timelock', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )

    const aliceTxLogs = await getTxLogs(contractTx, htlc)
    const aliceTxEvent = getTxLog(aliceTxLogs, htlc.interface.getEvent('HTLCERC20Created'))

    const a2bSwapId = aliceTxEvent?.args.contractId

    await time.increaseTo(timeLock)

    await receiverToken.connect(Bob).approve(htlc.address, receiverTokenAmount * 2)
    await expect(htlc.connect(Bob).withdraw(a2bSwapId)).to.be.revertedWith(
      'withdrawable: timelock expired',
    )
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)
  })

  it('should not allow refunds on non-existing contracts', async () => {
    const { Bob, htlc } = await loadFixture(deployContractsFixture)

    await expect(
      htlc
        .connect(Bob)
        .refund('0x2335bdc450f6affcf18b52ea4e50076346d79533fe5131664b50feea35e0f307'),
    ).to.be.revertedWith('contractExists: contractId does not exist')
  })

  it('should only allow refunds from sender', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 5 // 5 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx: TransactionResponse = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )
    const aliceTxLogs = await getTxLogs(contractTx, htlc)
    const aliceTxEvent = getTxLog(aliceTxLogs, htlc.interface.getEvent('HTLCERC20Created'))

    const a2bSwapId = aliceTxEvent?.args.contractId

    await time.increaseTo(timeLock)

    await expect(htlc.connect(Bob).refund(a2bSwapId)).to.be.revertedWith('refundable: not sender')
    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)
  })

  it('should not allow duplicate refunds', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx: TransactionResponse = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )
    const txLogs = await getTxLogs(contractTx, htlc)
    const txEvent = getTxLog(txLogs, htlc.interface.getEvent('HTLCERC20Created'))
    const swapId = txEvent?.args.contractId

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)

    await time.increaseTo(timeLock)

    await htlc.connect(Alice).refund(swapId)

    await expect(htlc.connect(Alice).refund(swapId)).to.be.revertedWith(
      'refundable: already refunded',
    )

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance)
    expect(await senderToken.balanceOf(Bob.address)).to.equal(0)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(0)
  })

  it('should not allow refunds on withdrawn contracts', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx: TransactionResponse = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )
    const txLogs = await getTxLogs(contractTx, htlc)
    const txEvent = getTxLog(txLogs, htlc.interface.getEvent('HTLCERC20Created'))
    const swapId = txEvent?.args.contractId

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)

    await receiverToken.connect(Bob).approve(htlc.address, receiverTokenAmount)
    await htlc.connect(Bob).withdraw(swapId)

    await time.increaseTo(timeLock)

    await expect(htlc.connect(Alice).refund(swapId)).to.be.revertedWith(
      'refundable: already withdrawn',
    )
  })

  it('should not allow refunds before timelock', async () => {
    const { Alice, Bob, senderToken, receiverToken, htlc } = await loadFixture(
      deployContractsFixture,
    )

    const timeLock = (await time.latest()) + 10 // 10 seconds
    await senderToken.connect(Alice).approve(htlc.address, senderTokenAmount)
    const contractTx: TransactionResponse = await htlc
      .connect(Alice)
      .newContract(
        timeLock,
        senderToken.address,
        senderTokenAmount,
        receiverToken.address,
        receiverTokenAmount,
      )
    const txLogs = await getTxLogs(contractTx, htlc)
    const txEvent = getTxLog(txLogs, htlc.interface.getEvent('HTLCERC20Created'))
    const swapId = txEvent?.args.contractId

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)

    await expect(htlc.connect(Alice).refund(swapId)).to.be.revertedWith(
      'refundable: timelock not yet passed',
    )

    await time.increaseTo(timeLock)

    expect(await senderToken.balanceOf(Alice.address)).to.equal(initialBalance - senderTokenAmount)
    expect(await senderToken.balanceOf(htlc.address)).to.equal(senderTokenAmount)
  })
})
