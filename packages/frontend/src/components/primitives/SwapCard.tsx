import { Box, Button, Card, CardBody, Heading, Text } from '@chakra-ui/react'
import { FC } from 'react'
import { BsArrowRight } from 'react-icons/bs'
import { useAccount, useNetwork, useToken } from 'wagmi'
import { HTLCERC20 } from '../../../.graphclient'
import { domainIdToChainId } from '@config/chains'
import { useMemo } from 'react'
import { utils } from 'ethers'
import { fromUnixTime, isAfter, isBefore } from 'date-fns'

interface SwapCardProps {
  htlc: HTLCERC20
  invert?: boolean
}

export const SwapCard: FC<SwapCardProps> = ({ htlc, invert }) => {
  const { address: ownAddress } = useAccount()
  const { chain } = useNetwork()

  const isSender = useMemo(
    () => ownAddress?.toLowerCase() === htlc.sender?.toLowerCase(),
    [htlc, ownAddress],
  )
  const isReceiver = useMemo(
    () => ownAddress?.toLowerCase() === htlc.receiver?.toLowerCase(),
    [htlc, ownAddress],
  )

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
    () => (senderToken ? utils.formatUnits(htlc?.senderAmount, senderToken?.decimals) : ''),
    [htlc.senderAmount, senderToken],
  )

  const receiverAmountFormatted = useMemo(
    () => (receiverToken ? utils.formatUnits(htlc?.receiverAmount, receiverToken?.decimals) : ''),
    [htlc.receiverAmount, receiverToken],
  )

  const isSenderChain = useMemo(() => chain?.id === senderChainId, [chain, senderChainId])
  const isReceiverChain = useMemo(() => chain?.id === receiverChainId, [chain, receiverChainId])

  const isExpired = useMemo(() => isAfter(new Date(), fromUnixTime(htlc.timelock)), [htlc])
  const isWithdrawable = useMemo(
    () => !(isSender || isReceiver || isExpired),
    [isSender, isReceiver, isExpired, htlc],
  )
  const isRefundable = useMemo(
    () => (isSender || isReceiver) && isExpired,
    [isSender, isReceiver, isExpired, htlc],
  )

  function capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

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
              {invert
                ? `${receiverAmountFormatted} ${receiverToken?.symbol}`
                : `${senderAmountFormatted} ${senderToken?.symbol}`}
            </Heading>
            <Text pt="2" fontSize="sm" color={'#737373'}>
              {invert ? receiverChain?.name : senderChain?.name}
            </Text>
          </Box>
          <BsArrowRight size={'30px'} color={'#E7E7E7'} />
          <Box>
            <Heading size="xs" textTransform={'uppercase'}>
              {invert
                ? `${senderAmountFormatted} ${senderToken?.symbol}`
                : `${receiverAmountFormatted} ${receiverToken?.symbol}`}
            </Heading>
            <Text pt="2" fontSize="sm" color={'#737373'}>
              {invert ? senderChain?.name : receiverChain?.name}
            </Text>
          </Box>
        </Box>
        {!isWithdrawable && !isRefundable && (
          <Box
            display="flex"
            alignItems="center"
            fontWeight="semibold"
            minWidth="10"
            minHeight="10"
            paddingInlineStart="4"
            paddingInlineEnd="4"
            color={'black'}
          >
            {isExpired ? 'Expired' : capitalize(htlc.sendStatus)}
          </Box>
        )}

        {isWithdrawable && (
          <Button
            colorScheme="blackAlpha"
            variant={'ghost'}
            color={'black'}
            border={'1px solid #E5E5E5'}
          >
            Accept
          </Button>
        )}
        {isRefundable && (
          <Button
            colorScheme="blackAlpha"
            variant={'ghost'}
            color={'black'}
            border={'1px solid #E5E5E5'}
          >
            Refund
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
