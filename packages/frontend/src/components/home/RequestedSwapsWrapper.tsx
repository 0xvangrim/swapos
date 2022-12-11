import { Box, Heading } from '@chakra-ui/react'
import { FC, useEffect } from 'react'
import { SwapCard } from '../primitives/SwapCard'
import { execute, HTLCERC20 } from '../../../.graphclient'
import gql from 'graphql-tag'
import { useState } from 'react'
import { useAccount } from 'wagmi'

export const RequestedSwapsWrapper: FC = () => {
  const { isConnected } = useAccount()
  const [htlcs, setHtlcs] = useState<HTLCERC20[]>([])

  useEffect(() => {
    execute(gql`
      query {
        htlcerc20S {
          id
          senderAmount
          senderDomain
          senderToken
          receiverAmount
          receiverToken
          receiverDomain
          sendStatus
        }
      }
    `).then((result: any) => setHtlcs(result?.data?.htlcerc20S))
  }, [])

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
        <Box>{isConnected && htlcs.map((htlc) => <SwapCard key={htlc.id} htlc={htlc} />)}</Box>
        <Box />
      </Box>
    </>
  )
}
