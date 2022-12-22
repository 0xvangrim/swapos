import { useAccount } from 'wagmi'
import { useDeployments } from '@shared/useDeployments'
import useSwapsNoSubgraph from './useSwapsNoSubgraph'
import useChains from './useChains'
import { fromUnixTime, isFuture } from 'date-fns'
import { useMemo } from 'react'
import type { HTLC } from '@components/helpers/HTLC'

interface useSwapsOrganizedReturn {
  activeSwaps: HTLC[] | undefined
  finishedSwaps: HTLC[] | undefined
  ownSwaps: HTLC[] | undefined
}

const useSwapsOrganized = (): useSwapsOrganizedReturn => {
  const { otherChain } = useChains()
  const { contracts, otherContracts } = useDeployments()
  const swaps = useSwapsNoSubgraph(contracts?.sender)
  const swapsOtherChain = useSwapsNoSubgraph(otherContracts?.sender, otherChain?.id)

  const combinedSwaps: HTLC[] = useMemo(
    () =>
      [...(swaps || []), ...(swapsOtherChain || [])].sort(
        (a, b) => b.timelock?.toNumber() - a.timelock?.toNumber(),
      ),
    [swaps, swapsOtherChain],
  )

  // Get live swaps from other network where sender != user (For withdrawals)
  // Get expired swaps from current network where sender == user (For refunds)
  // Get expired swaps from current network where receiver == user (For refunds)
  // Get all incomplete swaps from current network where sender == user (For info about own swaps)
  // Get all incomplete swaps from current network where receiver == user (For info about own swaps)
  const { address } = useAccount()

  const addressStr = address ? address : ''

  const activeSwaps = useMemo(() => {
    return swapsOtherChain?.filter((htlc) => {
      return (
        isFuture(fromUnixTime(htlc.timelock?.toNumber())) &&
        !htlc.withdrawn &&
        !htlc.refunded &&
        htlc.sender !== addressStr
      )
    })
  }, [swapsOtherChain, addressStr])

  const ownUnfinishedSwaps = useMemo(() => {
    return combinedSwaps?.filter((htlc) => {
      return (
        (htlc.sender === addressStr || htlc.receiver === addressStr) &&
        !htlc.withdrawn &&
        !htlc.refunded
      )
    })
  }, [combinedSwaps, addressStr])

  const ownFinishedSwaps = useMemo(() => {
    return combinedSwaps?.filter((htlc) => {
      return (
        (htlc.sender === addressStr || htlc.receiver === addressStr) &&
        (htlc.withdrawn || htlc.refunded)
      )
    })
  }, [combinedSwaps, addressStr])

  return {
    activeSwaps,
    ownSwaps: ownUnfinishedSwaps,
    finishedSwaps: ownFinishedSwaps,
  }
}

export default useSwapsOrganized
