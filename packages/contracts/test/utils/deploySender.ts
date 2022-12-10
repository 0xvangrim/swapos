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
  ERC20MultichainAtomicSwapSender,
  ERC20MultichainAtomicSwapSender__factory,
} from '../../typechain-types'

export type SenderContracts = RouterContracts<ERC20MultichainAtomicSwapSender>
export type SenderConfig = RouterConfig & { senderDomain: number }
export type SenderFactories = RouterFactories<ERC20MultichainAtomicSwapSender>

export const senderFactories: SenderFactories = {
  router: new ERC20MultichainAtomicSwapSender__factory(),
}

export class SenderDeployer<
  Chain extends ChainName // inferred from configured chains passed to constructor
> extends HyperlaneRouterDeployer<Chain, SenderConfig, SenderContracts, SenderFactories> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, SenderConfig>,
    protected core: HyperlaneCore<Chain>,
  ) {
    super(multiProvider, configMap, senderFactories, {})
  }

  async deployContracts(chain: Chain, config: SenderConfig) {
    const connection = this.multiProvider.getChainConnection(chain)
    const router = await this.deployContractFromFactory(
      chain,
      new ERC20MultichainAtomicSwapSender__factory(),
      'Sender',
      [],
    )
    await connection.handleTx(
      router.initialize(
        config.connectionManager,
        config.interchainGasPaymaster,
        config.senderDomain,
      ),
    )
    return { router }
  }
}
