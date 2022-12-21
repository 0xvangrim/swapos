import {
  chainConnectionConfigs,
  ChainNameToDomainId,
  HyperlaneCore,
  MultiProvider,
  objMap,
  RouterConfig,
  serializeContracts,
} from '@hyperlane-xyz/sdk'
import { utils } from '@hyperlane-xyz/utils'
import dotenv from 'dotenv'
import { ethers, Wallet } from 'ethers'
import { ReceiverDeployer } from '../test/utils/deployReceiver'
import { SenderDeployer } from '../test/utils/deploySender'

dotenv.config()

export type HelloWorldConfig = SenderConfig
export type SenderConfig = RouterConfig & { senderDomain: number }

export const prodConfigs = {
  // alfajores: chainConnectionConfigs.alfajores,
  moonbasealpha: chainConnectionConfigs.moonbasealpha,
  fuji: chainConnectionConfigs.fuji,
}

const contracts = {
  moonbasealpha: require('../deployments/1287.json'),
  fuji: require('../deployments/43113.json'),
}

const artifacts = {
  sender: require('../artifacts/contracts/ERC20MultichainAtomicSwapSender.sol/ERC20MultichainAtomicSwapSender.json'),
  receiver: require('../artifacts/contracts/ERC20MultichainAtomicSwapReceiver.sol/ERC20MultichainAtomicSwapReceiver.json'),
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY_01
  if (!privateKey) throw new Error('No private key')

  const signer = new Wallet(privateKey)
  const chainProviders = objMap(prodConfigs, (_, config) => ({
    ...config,
    signer: signer.connect(config.provider),
  }))
  const multiProvider = new MultiProvider(chainProviders)

  const fujiSigner = multiProvider.getChainSigner('fuji')

  const fujiReceiver = contracts.fuji?.receiver as string
  const receiverContract = new ethers.Contract(fujiReceiver, artifacts.receiver.abi, fujiSigner)
  console.log({ routers: await receiverContract.routers(ChainNameToDomainId['moonbasealpha']) })

  // const moonbaseReceiver = contracts.moonbasealpha?.receiver as string
  // const receiverContract = new ethers.Contract(moonbaseReceiver, artifacts.sender.abi, moonbaseSigner)
  // console.log({
  //   routers: await receiverContract.routers(ChainNameToDomainId['fuji']),
  // })
  // console.log({
  //   routers: await receiverContract.enrollRemoteRouter(
  //     ChainNameToDomainId['moonbasealpha'],
  //     utils.addressToBytes32(contracts.moonbasealpha?.sender),
  //   ),
  // })
}

main()
  .then(() => console.info('Deploy complete.'))
  .catch(console.error)
