import { Box, Button, Card, CardBody, Heading, Text, useToast } from '@chakra-ui/react'
import { FC } from 'react'
import { BsArrowRight } from 'react-icons/bs'
import {
  erc20ABI,
  useAccount,
  useBalance,
  useContractRead,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
  useToken,
  useWaitForTransaction,
} from 'wagmi'
import { domainIdToChainId } from '@config/chains'
import { useMemo } from 'react'
import { BigNumber, constants, utils } from 'ethers'
import { fromUnixTime, isPast } from 'date-fns'
import { useDeployments } from '@shared/useDeployments'
import senderContract from '@ethathon/contracts/artifacts/contracts/ERC20MultichainAtomicSwapSender.sol/ERC20MultichainAtomicSwapSender.json'
import receiverContract from '@ethathon/contracts/artifacts/contracts/ERC20MultichainAtomicSwapReceiver.sol/ERC20MultichainAtomicSwapReceiver.json'
import { HTLC } from '@components/helpers/HTLC'

interface SwapCardProps {
  htlc: HTLC
  invert?: boolean
}

export const SwapCard: FC<SwapCardProps> = ({ htlc, invert }) => {
  const toast = useToast()
  const { address: ownAddress } = useAccount()
  const contractAddresses = useDeployments()

  const { chain, chains } = useNetwork()

  const senderChainId = useMemo(() => domainIdToChainId[htlc.senderDomain], [htlc])
  const receiverChainId = useMemo(
    () => domainIdToChainId[htlc.receiverDomain],
    [htlc.receiverDomain],
  )

  const senderChain = useMemo(
    () => chains.find((chain) => chain.id === senderChainId),
    [chains, senderChainId],
  )
  const receiverChain = useMemo(
    () => chains.find((chain) => chain.id === receiverChainId),
    [chains, receiverChainId],
  )

  const receiverContractAddress = useMemo(() => {
    const contractsMatch = contractAddresses[receiverChainId]
    return contractsMatch?.receiver
  }, [contractAddresses, receiverChainId])

  const { data: htlcReceipt, ...rest } = useContractRead({
    address: receiverContractAddress,
    abi: receiverContract.abi,
    functionName: 'getHTLC',
    args: [htlc.id],
    chainId: receiverChainId,
    watch: true,
  })

  const hasReceipt = useMemo(() => htlcReceipt?.receiver != constants.AddressZero, [htlcReceipt])

  const isSender = useMemo(
    () => ownAddress?.toLowerCase() === htlc.sender?.toLowerCase(),
    [htlc, ownAddress],
  )
  const isReceiver = useMemo(
    () => ownAddress?.toLowerCase() === htlcReceipt?.receiver?.toLowerCase(),
    [htlc, ownAddress],
  )

  const { data: senderToken } = useToken({
    address: htlc.senderToken as any,
    chainId: senderChainId,
  })
  const { data: receiverToken, ...err } = useToken({
    address: htlc.receiverToken as any,
    chainId: receiverChainId,
  })

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

  const isExpired = useMemo(() => isPast(fromUnixTime(htlc.timelock.toNumber())), [htlc])

  const status = useMemo(() => {
    if ((htlc.withdrawn && htlcReceipt?.confirmed) || (htlc.refunded && htlcReceipt?.refunded))
      return 'Complete'

    if (htlc.withdrawn || htlcReceipt?.confirmed) return 'In Progress'

    if (htlc.refunded || htlcReceipt?.refunded) return 'Refunded'

    if (isExpired) return 'Refundable'

    return 'Pending'
  }, [htlc, htlcReceipt, isExpired])

  const isCompleted = useMemo(() => status === 'Complete', [status])

  const isWithdrawable = useMemo(
    () => !(isSender || isReceiver || isExpired || isCompleted || hasReceipt),
    [isSender, isReceiver, isExpired, isCompleted, hasReceipt],
  )

  const isRefundable = useMemo(
    () =>
      status === 'Refundable' &&
      ((isSender && !htlc.refunded) || (isReceiver && !htlcReceipt.refunded)),
    [isSender, isReceiver, isExpired, isCompleted],
  )

  // Refunds
  const { config: refundConfig } = usePrepareContractWrite({
    address: contractAddresses.contracts?.sender,
    abi: senderContract.abi,
    functionName: 'refund',
    args: [htlc.id],
    enabled: isSenderChain && isRefundable,
  })
  const {
    data: refundData,
    isLoading: refundIsLoading,
    write: refundWrite,
  } = useContractWrite(refundConfig)
  const { isFetching: isRefundInProgress } = useWaitForTransaction({
    hash: refundData?.hash,
  })

  const { switchNetwork: switchToSenderChain } = useSwitchNetwork({ chainId: senderChainId })
  function handleRefund() {
    if (!isRefundable) return false
    if (!isSenderChain) {
      toast({
        title: 'Switch network',
        status: 'warning',
        description: `You need to switch network to ${senderChain?.name} to continue`,
      })
      switchToSenderChain?.()
      return
    }

    refundWrite?.()
  }

  // Withdrawals - Balance checks
  const { data: receiverTokenBalance } = useBalance({
    address: ownAddress,
    token: htlc.receiverToken as any,
    enabled: isWithdrawable && isReceiverChain,
  })
  const userHasBalance = useMemo(
    () => receiverTokenBalance?.value.gte(htlc.senderAmount),
    [receiverTokenBalance, htlc],
  )

  // Withdrawals - Deposit Token Approval
  const {
    data: approvalAmount,
    refetch: refetchApproval,
    isRefetching: isRefetchingApproval,
  } = useContractRead({
    address: htlc.receiverToken,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [ownAddress as any, contractAddresses.contracts?.receiver as any],
    enabled: isWithdrawable && isReceiverChain,
  })

  const { config: approvalConfig } = usePrepareContractWrite({
    address: htlc.receiverToken,
    abi: erc20ABI,
    functionName: 'approve',
    args: [contractAddresses.contracts?.receiver as any, htlc.receiverAmount],
    enabled: isWithdrawable && isReceiverChain,
  })

  const {
    data: approvalWriteData,
    isLoading: isApprovalWriteLoading,
    write: writeApproval,
  } = useContractWrite(approvalConfig)
  const { isFetching: isTokenApprovalInProgress } = useWaitForTransaction({
    hash: approvalWriteData?.hash,
    onSuccess: () => {
      refetchApproval()
      toast({ title: 'Approval successful', status: 'success' })
    },
  })

  function approveTokens() {
    if (!userHasBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'You do not have enough funds to complete this swap',
        status: 'error',
      })
    } else {
      writeApproval?.()
    }
  }

  // Withdrawals
  const { config: withdrawConfig } = usePrepareContractWrite({
    enabled: approvalAmount?.gte(htlc.receiverAmount),
    address: contractAddresses.contracts?.receiver,
    abi: receiverContract.abi,
    functionName: 'startWithdrawal',
    args: [
      BigNumber.from(htlc.timelock),
      htlc.sender,
      htlc.senderDomain,
      htlc.senderToken,
      BigNumber.from(htlc.senderAmount),
      htlc.receiverToken,
      BigNumber.from(htlc.receiverAmount),
    ],
  })
  const { data, isLoading, write } = useContractWrite(withdrawConfig)
  const { isFetching: isInProgress } = useWaitForTransaction({
    hash: data?.hash,
  })

  function withdrawTokens() {
    if (!userHasBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'You do not have enough funds to complete this swap',
        status: 'error',
      })
    } else {
      write?.()
    }
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
            {status}
          </Box>
        )}

        {isWithdrawable &&
          (approvalAmount?.lt(htlc.receiverAmount) ? (
            <Button
              isLoading={
                isApprovalWriteLoading || isTokenApprovalInProgress || isRefetchingApproval
              }
              disabled={!writeApproval}
              onClick={approveTokens}
              colorScheme="blackAlpha"
              variant={'ghost'}
              color={'black'}
              border={'1px solid #E5E5E5'}
            >
              Accept
            </Button>
          ) : (
            <Button
              isLoading={isLoading || isInProgress}
              onClick={withdrawTokens}
              colorScheme="green"
              variant={'ghost'}
              color={'black'}
              border={'1px solid #E5E5E5'}
            >
              Confirm
            </Button>
          ))}

        {isRefundable && (
          <Button
            isLoading={refundIsLoading || isRefundInProgress}
            onClick={handleRefund}
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
