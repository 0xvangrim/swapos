import { useContractRead, useContractReads } from 'wagmi'
import senderContract from '@ethathon/contracts/artifacts/contracts/ERC20MultichainAtomicSwapSender.sol/ERC20MultichainAtomicSwapSender.json'
import useChains from './useChains'
import { chainIdToDomainId } from '@config/chains'
import { useMemo } from 'react'
import { HTLC } from '@components/helpers/HTLC'

const useSwapsNoSubgraph = (address?: string, chainId?: number) => {
  const { currentChain: defaultChain } = useChains()
  const { data: HTLCIds } = useContractRead({
    address,
    abi: senderContract.abi,
    functionName: 'getHTLCIds',
    chainId: chainId || defaultChain?.id,
    enabled: !!address && !!defaultChain,
    watch: true,
  })

  const { data } = useContractReads({
    enabled: !!HTLCIds && !!address,
    contracts: ((HTLCIds as string[]) || []).map((id) => ({
      address,
      abi: senderContract.abi as any,
      functionName: 'getHTLC',
      chainId: chainId || defaultChain?.id,
      args: [id],
    })),
    watch: true,
  })

  const dataExtended: HTLC[] | undefined = useMemo(() => {
    return data?.map(
      (htlc, idx) =>
        ({
          ...htlc,
          id: (HTLCIds as any[])[idx],
          senderDomain: chainIdToDomainId[chainId || defaultChain.id],
        } as any as HTLC),
    )
  }, [data, chainId, defaultChain])

  return dataExtended
}

export default useSwapsNoSubgraph
