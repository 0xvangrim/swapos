import { Box, Button, Card, CardBody, Heading, Text } from '@chakra-ui/react'
import { FC } from 'react'
import { BsArrowRight } from 'react-icons/bs'
import { useNetwork, useToken } from 'wagmi'
import { HTLCERC20 } from '../../../.graphclient'
import { domainIdToChainId } from '@config/chains'
import { useMemo } from 'react'
import { utils } from 'ethers'

interface SwapCardProps {
  htlc: HTLCERC20
}

export const SwapCard: FC<SwapCardProps> = ({ htlc }) => {
  const senderChainId = useMemo(() => domainIdToChainId[htlc.senderDomain], [htlc.senderDomain])
  const receiverChainId = useMemo(
    () => domainIdToChainId[htlc.receiverDomain],
    [htlc.receiverDomain],
  )

  const { data: senderToken } = useToken({
    address: htlc.senderToken,
    chainId: senderChainId,
  })
  const { data: receiverToken } = useToken({
    address: htlc.receiverToken,
    chainId: receiverChainId,
  })

  const { chains } = useNetwork()
  const senderChain = useMemo(
    () => chains.find((chain) => chain.id === senderChainId),
    [chains, senderChainId],
  )
  const receiverChain = useMemo(
    () => chains.find((chain) => chain.id === receiverChainId),
    [chains, receiverChainId],
  )

  const senderAmountFormatted = useMemo(
    () => utils.formatUnits(htlc.senderAmount, senderToken?.decimals),
    [htlc.senderAmount],
  )

  const receiverAmountFormatted = useMemo(
    () => utils.formatUnits(htlc.receiverAmount, receiverToken?.decimals),
    [htlc.senderAmount],
  )

  return (
    <Card backgroundColor={'#FFFFF'} borderRadius={'16px'} marginBottom={'16px'}>
      <CardBody
        width={'502px'}
        height={'70px'}
        color={'#000000'}
        display={'flex'}
        flexDir={'row'}
        justifyContent={'space-between'}
        alignItems={'center'}
        padding={'16px'}
        gap={'16px'}
        borderRadius={'16px'}
        border={'1px solid #E5E5E5'}
      >
        <Box width="250px" display={'flex'} justifyContent="space-between">
          <Box>
            <Heading size="xs" textTransform={'uppercase'}>
              {`${senderAmountFormatted} ${senderToken?.symbol}`}
            </Heading>
            <Text pt="2" fontSize="sm" color={'#737373'}>
              {senderChain?.name}
            </Text>
          </Box>
          <BsArrowRight size={'30px'} color={'#E7E7E7'} />
          <Box>
            <Heading size="xs" textTransform={'uppercase'}>
              {`${receiverAmountFormatted} ${receiverToken?.symbol}`}
            </Heading>
            <Text pt="2" fontSize="sm" color={'#737373'}>
              {receiverChain?.name}
            </Text>
          </Box>
        </Box>
        <Button
          colorScheme="blackAlpha"
          variant={'ghost'}
          color={'black'}
          border={'1px solid #E5E5E5'}
        >
          Accept
        </Button>
      </CardBody>
    </Card>
  )
}
