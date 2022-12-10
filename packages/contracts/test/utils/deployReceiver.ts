import {
  ChainMap,
  ChainName,
  HyperlaneCore,
  HyperlaneRouterDeployer,
  MultiProvider,
  RouterConfig,
  RouterContracts,
  RouterFactories,
} from '@hyperlane-xyz/sdk'
import {
  ERC20MultichainAtomicSwapReceiver,
  ERC20MultichainAtomicSwapReceiver__factory,
} from '../../typechain-types'

export type ReceiverContracts = RouterContracts<ERC20MultichainAtomicSwapReceiver>
export type ReceiverConfig = RouterConfig & { receiverDomain: number }
export type ReceiverFactories = RouterFactories<ERC20MultichainAtomicSwapReceiver>

export const receiverFactories: ReceiverFactories = {
  router: new ERC20MultichainAtomicSwapReceiver__factory(),
}

export class ReceiverDeployer<
  Chain extends ChainName // inferred from configured chains passed to constructor
> extends HyperlaneRouterDeployer<Chain, ReceiverConfig, ReceiverContracts, ReceiverFactories> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, ReceiverConfig>,
    protected core: HyperlaneCore<Chain>,
  ) {
    super(multiProvider, configMap, receiverFactories, {})
  }

  async deployContracts(chain: Chain, config: ReceiverConfig) {
    const connection = this.multiProvider.getChainConnection(chain)
    const router = await this.deployContractFromFactory(
      chain,
      new ERC20MultichainAtomicSwapReceiver__factory(),
      'Receiver',
      [],
    )
    await connection.handleTx(
      router.initialize(
        config.connectionManager,
        config.interchainGasPaymaster,
        config.receiverDomain,
      ),
    )
    return { router }
  }
}
