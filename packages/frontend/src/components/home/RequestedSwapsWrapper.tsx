import { Box, Heading } from '@chakra-ui/react'
import { FC, useEffect } from 'react'
import { SwapCard } from '../primitives/SwapCard'
import { execute, GetAllHTLCsDocument, HTLCERC20 } from '../../../.graphclient'
import gql from 'graphql-tag'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from 'urql'

export const RequestedSwapsWrapper: FC = () => {
  const { isConnected } = useAccount()
  const [result, reexecuteQuery] = useQuery({
    query: GetAllHTLCsDocument,
  })
  const { data, fetching, error } = result
  const htlcs: HTLCERC20[] = data?.htlcerc20S

  console.log({ htlcs })

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
