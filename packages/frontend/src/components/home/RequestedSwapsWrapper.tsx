import { Box, Heading } from '@chakra-ui/react'
import { FC, useMemo } from 'react'
import { SwapCard } from '../primitives/SwapCard'
import { useAccount, useNetwork } from 'wagmi'
import useSwaps from '@components/hooks/useSwaps'

const RequestedSwapsWrapper: FC = () => {
  const { isConnected } = useAccount()
  const { chain } = useNetwork()

  const data = useSwaps()

  const ownSwaps = useMemo(() => {
    const ownHtlcs = []
    ownHtlcs.push(...(data?.liveUserSentSwaps?.htlcerc20S || []))
    ownHtlcs.push(...(data?.liveUserReceivedSwaps?.htlcerc20S || []))
    ownHtlcs.push(...(data?.expiredUserSentSwaps?.htlcerc20S || []))
    ownHtlcs.push(...(data?.expiredUserReceivedSwaps?.htlcerc20S || []))
    return ownHtlcs
  }, [data])

  const activeSwaps = useMemo(() => data?.livePendingSwaps?.htlcerc20S || [], [data])

  const finishedSwaps = useMemo(() => {
    const finishedHtlcs = []
    finishedHtlcs.push(...(data?.completedUserReceivedSwaps?.htlcerc20S || []))
    finishedHtlcs.push(...(data?.completedUserSentSwaps?.htlcerc20S || []))
    return finishedHtlcs
  }, [data])

  return (
    <>
      <Box
        position={'relative'}
        display={'flex'}
        height={'100%'}
        flexDir={'column'}
        alignItems={'center'}
        backgroundColor={'#F9F9F9'}
        padding={'16px'}
      >
        {ownSwaps?.length > 0 && (
          <>
            <Box marginTop={'16px'} marginBottom={'16px'}>
              <Heading
                fontSize={'24px'}
                color={'#C5C5C5'}
                fontStyle={'normal'}
                lineHeight={'26px'}
                fontWeight={500}
              >
                Your swaps
              </Heading>
            </Box>
            <Box>
              {isConnected && ownSwaps?.map((htlc) => <SwapCard key={htlc.id} htlc={htlc} />)}
            </Box>
          </>
        )}

        {activeSwaps.length > 0 && (
          <>
            <Box marginTop={'16px'} marginBottom={'16px'}>
              <Heading
                fontSize={'24px'}
                color={'#C5C5C5'}
                fontStyle={'normal'}
                lineHeight={'26px'}
                fontWeight={500}
              >
                Requested swaps
              </Heading>
            </Box>
            <Box>
              {activeSwaps?.map((htlc) => (
                <SwapCard key={htlc.id} htlc={htlc} />
              ))}
            </Box>
          </>
        )}

        {finishedSwaps.length > 0 && (
          <>
            <Box marginTop={'16px'} marginBottom={'16px'}>
              <Heading
                fontSize={'24px'}
                color={'#C5C5C5'}
                fontStyle={'normal'}
                lineHeight={'26px'}
                fontWeight={500}
              >
                Finished swaps
              </Heading>
            </Box>
            <Box>
              {isConnected && finishedSwaps?.map((htlc) => <SwapCard key={htlc.id} htlc={htlc} />)}
            </Box>
          </>
        )}
      </Box>
    </>
  )
}

export default RequestedSwapsWrapper
