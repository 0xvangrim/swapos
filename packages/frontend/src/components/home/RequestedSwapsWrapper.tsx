import { Box, Heading } from '@chakra-ui/react'
import { FC } from 'react'
import { SwapCard } from '../primitives/SwapCard'
import { useAccount } from 'wagmi'
import useSwapsOrganized from '@components/hooks/useSwapsOrganized'

const RequestedSwapsWrapper: FC = () => {
  const { isConnected } = useAccount()

  const { activeSwaps, ownSwaps, finishedSwaps } = useSwapsOrganized()

  if (!isConnected)
    return (
      <Box marginTop={'16px'} marginBottom={'16px'} textAlign="center">
        <Heading
          fontSize={'24px'}
          color={'#C5C5C5'}
          fontStyle={'normal'}
          lineHeight={'26px'}
          fontWeight={500}
        >
          Connect your wallet to see available swaps
        </Heading>
      </Box>
    )

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
        {ownSwaps && (
          <>
            <Box marginTop={'16px'} marginBottom={'16px'}>
              <Heading
                fontSize={'24px'}
                color={'#C5C5C5'}
                fontStyle={'normal'}
                lineHeight={'26px'}
                fontWeight={500}
              >
                Your requests
              </Heading>
            </Box>
            <Box>
              {ownSwaps?.map((htlc) => (
                <SwapCard key={htlc.id} htlc={htlc} />
              ))}
            </Box>
          </>
        )}

        {activeSwaps && (
          <>
            <Box marginTop={'16px'} marginBottom={'16px'}>
              <Heading
                fontSize={'24px'}
                color={'#C5C5C5'}
                fontStyle={'normal'}
                lineHeight={'26px'}
                fontWeight={500}
              >
                Available requests
              </Heading>
            </Box>
            <Box>
              {activeSwaps?.map((htlc) => (
                <SwapCard key={htlc.id} htlc={htlc} invert />
              ))}
            </Box>
          </>
        )}

        {finishedSwaps && (
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
              {finishedSwaps?.map((htlc) => (
                <SwapCard key={htlc.id} htlc={htlc} />
              ))}
            </Box>
          </>
        )}
      </Box>
    </>
  )
}

export default RequestedSwapsWrapper
