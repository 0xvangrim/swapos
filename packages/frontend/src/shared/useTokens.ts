import { useMemo } from 'react'
import { useNetwork } from 'wagmi'
import tokens from '../config/tokenlist'

export const useTokens = (chainId?: number) => {
  const { chain } = useNetwork()

  const chainIdCurrent = useMemo(() => chainId || chain?.id, [chain, chainId])

  const tokensFiltered = useMemo(() => {
    if (!chainIdCurrent) return []

    return tokens
      .filter((token: any) => token.addresses?.[chainIdCurrent])
      .map((token) => ({ ...token, address: token.addresses?.[chainIdCurrent] }))
  }, [chainIdCurrent, tokens])

  return { tokens: tokensFiltered }
}
