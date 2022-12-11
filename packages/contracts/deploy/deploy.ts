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
import { Wallet } from 'ethers'
import { ReceiverDeployer } from '../test/utils/deployReceiver'
import { SenderDeployer } from '../test/utils/deploySender'

dotenv.config()

export type HelloWorldConfig = SenderConfig
export type SenderConfig = RouterConfig & { senderDomain: number }

export const prodConfigs = {
  mumbai: chainConnectionConfigs.mumbai,
  fuji: chainConnectionConfigs.fuji,
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

  const core = HyperlaneCore.fromEnvironment('testnet2', multiProvider)
  const config = core.getConnectionClientConfigMap()

  const senderConfig = objMap(config, (key) => ({
    ...config[key],
    owner: signer.address,
    senderDomain: ChainNameToDomainId[key],
  }))

  const receiverConfig = objMap(config, (key) => ({
    ...config[key],
    owner: signer.address,
    receiverDomain: ChainNameToDomainId[key],
  }))

  console.info('Starting Deployment...')

  console.info('Deploying Senders...')
  const senderDeployer = new SenderDeployer(multiProvider, senderConfig, core)
  const senderContracts = await senderDeployer.deploy()
  const senderAddresses = serializeContracts(senderContracts)
  console.info('Sender Contract Addresses:')
  console.log(JSON.stringify(senderAddresses))

  console.info('Deploying Receivers...')
  const receiverDeployer = new ReceiverDeployer(multiProvider, receiverConfig, core)
  const receiverContracts = await receiverDeployer.deploy()
  const receiverAddresses = serializeContracts(receiverContracts)
  console.info('Receiver Contract Addresses:')
  console.log(JSON.stringify(receiverAddresses))

  console.log('Performing Router Registrations...')
  const registrations: Promise<any>[] = []
  Object.entries(senderContracts).forEach(([chainSender, senderContracts]) => {
    const localSender = senderContracts.router

    Object.entries(receiverContracts).forEach(([chainReceiver, receiverContracts]) => {
      if (chainSender === chainReceiver) return
      const remoteReceiver = receiverContracts.router

      registrations.push(
        localSender.enrollRemoteRouter(
          ChainNameToDomainId[chainReceiver],
          utils.addressToBytes32(remoteReceiver.address),
        ),
      )
    })
  })

  console.log('Found ' + registrations.length + ' Registrations to Perform...')
  await Promise.all(registrations)
}

main()
  .then(() => console.info('Deploy complete.'))
  .catch(console.error)
