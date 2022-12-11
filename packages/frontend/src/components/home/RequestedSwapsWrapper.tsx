import { Box, Heading } from '@chakra-ui/react'
import { FC } from 'react'
import { SwapCard } from '../primitives/SwapCard'
import { HTLCERC20 } from '../../../.graphclient'
import gql from 'graphql-tag'
import { useAccount, useNetwork } from 'wagmi'
import { useQuery } from 'urql'
import { useMemo } from 'react'
import { chainIdToDomainId } from '@config/chains'

export const RequestedSwapsWrapper: FC = () => {
  const { isConnected, address } = useAccount()
  const { chains, chain } = useNetwork()

  const currentChain = useMemo(() => {
    if (!chain) return chains[0] || 'mumbai'
    return chain
  }, [chain, chains])

  const otherChain = useMemo(() => {
    if (!chain) return chains[0]
    return chains.filter((c) => c.id !== chain.id)[0]
  }, [chain, chains])

  const [result] = useQuery({
    requestPolicy: 'network-only',
    query: gql`
      query GetAllHTLCs($chain: String) @live {
        ${currentChain?.network} {
          htlcerc20S(where: { sender: "${address}" }, orderBy: createdAt, orderDirection: desc) {
            id
            sender
            senderAmount
            senderDomain
            senderToken
            receiverDomain
            receiverAmount
            receiverToken
            timelock
            sendStatus
          }
        }
        ${otherChain?.network} {
          htlcerc20S(where: { receiverDomain: "${
            chainIdToDomainId[currentChain.id]
          }" }, orderBy: createdAt, orderDirection: desc) {
            id
            sender
            senderAmount
            senderDomain
            senderToken
            receiverDomain
            receiverAmount
            receiverToken
            timelock
            sendStatus
          }
        }

      }
    `,
  })
  const { data, fetching, error } = result
  const otherHtlcs: HTLCERC20[] = data?.[otherChain?.network]?.htlcerc20S
  const ownHtlcs: HTLCERC20[] = data?.[currentChain?.network]?.htlcerc20S

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
        {ownHtlcs?.length > 0 && (
          <Box marginTop={'16px'} marginBottom={'16px'}>
            <Heading
              fontSize={'24px'}
              color={'#C5C5C5'}
              fontStyle={'normal'}
              lineHeight={'26px'}
              fontWeight={500}
            >
              Your swaps on {chain?.name}
            </Heading>
          </Box>
        )}
        <Box>{isConnected && ownHtlcs?.map((htlc) => <SwapCard key={htlc.id} htlc={htlc} />)}</Box>

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
          {isConnected && otherHtlcs?.map((htlc) => <SwapCard invert key={htlc.id} htlc={htlc} />)}
        </Box>
      </Box>
    </>
  )
}
