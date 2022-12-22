import { deployments } from '@deployments/deployments'
import { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { DeploymentAddresses } from '@deployments/deployments'
import useChains from '@components/hooks/useChains'

export const useDeployments = () => {
  const { currentChain, otherChain } = useChains()
  const [contracts, setContracts] = useState<DeploymentAddresses>()
  const [otherChainContracts, setOtherChainContracts] = useState<DeploymentAddresses>()

  useAsyncEffect(async () => {
    if (currentChain) {
      const contracts = await deployments[currentChain.id]
      setContracts(contracts)
    } else {
      setContracts(undefined)
    }

    if (otherChain) {
      const otherChainContracts = await deployments[otherChain.id]
      setOtherChainContracts(otherChainContracts)
    } else {
      setOtherChainContracts(undefined)
    }
  }, [currentChain, otherChain])

  return {
    contracts,
    otherContracts: otherChainContracts,
    [currentChain?.id]: contracts,
    [otherChain?.id]: otherChainContracts,
  }
}
