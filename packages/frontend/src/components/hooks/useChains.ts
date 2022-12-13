import { useMemo } from 'react'
import { useNetwork } from 'wagmi'

const useChains = () => {
  const { chains, chain } = useNetwork()

  const currentChain = useMemo(() => {
    if (!chain) return chains[0] || { network: 'mumbai' }
    return chain
  }, [chain, chains])

  const otherChain = useMemo(() => {
    if (!chain) return chains[0] || { network: 'fuji' }
    return chains.filter((c) => c.id !== chain.id)[0]
  }, [chain, chains])

  return { currentChain, otherChain }
}

export default useChains
