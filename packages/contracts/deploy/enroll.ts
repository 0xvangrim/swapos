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
  mumbai: chainConnectionConfigs.mumbai,
  fuji: chainConnectionConfigs.fuji,
}

const contracts = {
  mumbai: require('../deployments/80001.json'),
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

  const mumbaiSigner = multiProvider.getChainSigner('mumbai')

  //   const mumbaiSender = contracts.mumbai?.sender as string
  //   const senderContract = new ethers.Contract(mumbaiSender, artifacts.sender.abi, mumbaiSigner);
  //   console.log({ routers: await senderContract.routers(ChainNameToDomainId["fuji"]) })

  const mumbaiReceiver = contracts.mumbai?.receiver as string
  const receiverContract = new ethers.Contract(mumbaiReceiver, artifacts.sender.abi, mumbaiSigner)
  //   console.log({
  //     routers: await receiverContract.enrollRemoteRouter(
  //       ChainNameToDomainId['mumbai'],
  //       utils.addressToBytes32(contracts.mumbai?.sender),
  //     ),
  //   })
  console.log({
    routers: await receiverContract.routers(ChainNameToDomainId['fuji']),
  })
}

main()
  .then(() => console.info('Deploy complete.'))
  .catch(console.error)
