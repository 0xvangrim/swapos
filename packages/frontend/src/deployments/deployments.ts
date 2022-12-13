import { env } from '@shared/environment'

/**
 * Dynamically aggregating all deployments (addresses, abis)
 */

export interface DeploymentAddresses {
  sender: string
  receiver: string
}

export type DeploymentsType = { [_: number]: Promise<DeploymentAddresses> }

export const deployments: DeploymentsType = env.supportedChains.reduce(
  (acc: DeploymentsType, chainId: number) => ({
    ...acc,
    [chainId]: require(`@ethathon/contracts/deployments/${chainId}.json`),
  }),
  {},
)
