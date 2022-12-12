import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  useToast,
} from '@chakra-ui/react'
import { shortenAddress } from '@components/helpers/shortenAddress'
import { useDeployments } from '@shared/useDeployments'
import { useTokens } from '@shared/useTokens'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useAccount,
  useNetwork,
  useContractWrite,
  usePrepareContractWrite,
  useBalance,
  erc20ABI,
  useContractRead,
  useWaitForTransaction,
} from 'wagmi'
import senderContract from '@ethathon/contracts/artifacts/contracts/ERC20MultichainAtomicSwapSender.sol/ERC20MultichainAtomicSwapSender.json'
import { addHours, getUnixTime } from 'date-fns'
import { BigNumber } from 'ethers'
import { chainIdToDomainId } from '@config/chains'
import { BigNumberInput } from 'big-number-input'

export const SwapModal = ({ isOpen, onClose }: { isOpen: any; onClose: any }) => {
  const toast = useToast()
  const contractAddresses = useDeployments()

  const { address } = useAccount()
  const { chains } = useNetwork()
  const finalRef = useRef(null)

  const [amount, setAmount] = useState<string>('')
  const [toChain, setToChain] = useState<number>(0)
  const [tokenIn, setTokenIn] = useState<string>('')
  const [tokenOut, setTokenOut] = useState<string>('')

  const { tokens: sentTokensList } = useTokens()
  const { tokens: receivedTokensList } = useTokens(toChain)

  const { data: sentToken } = useBalance({
    address: tokenIn ? address : undefined,
    token: tokenIn as any,
  })

  // Validations and Transformations
  const senderAmount = useMemo(() => BigNumber.from(amount || '0'), [amount])
  const receiverAmount = useMemo(() => BigNumber.from(amount || '0'), [amount])

  const handleAmountChange = (value: any) => setAmount(value)
  const handleToChainChange = (e: any) => {
    setToChain(e?.target.value)
    setTokenOut('')
  }
  const handleTokenInChange = (e: any) => setTokenIn(e?.target.value)
  const handleTokenOutChange = (e: any) => setTokenOut(e?.target.value)

  const canSubmitRequest = useMemo(() => {
    return amount && toChain && tokenIn && tokenOut
  }, [amount, toChain, tokenIn, tokenOut])

  // Token Approvals
  const {
    data: approvalAmount,
    refetch: refetchApproval,
    isRefetching: isRefetchingApproval,
  } = useContractRead({
    address: tokenIn,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address as any, contractAddresses.contracts?.sender as any],
  })

  const { config: configApproval } = usePrepareContractWrite({
    address: tokenIn,
    abi: erc20ABI,
    functionName: 'approve',
    args: [contractAddresses.contracts?.sender as any, senderAmount],
    onError: (error) =>
      toast({
        title: 'Error occurred.',
        description: error.message,
        status: 'error',
      }),
  })

  const {
    data: dataApproval,
    isLoading: isLoadingApproval,
    write: writeApproval,
  } = useContractWrite(configApproval)
  const { isFetching: isTokenApprovalInProgress } = useWaitForTransaction({
    hash: dataApproval?.hash,
    onSuccess: () => {
      refetchApproval()
      toast({ title: 'Approval successful', status: 'success' })
    },
  })

  // New HTLC creation
  const { config } = usePrepareContractWrite({
    enabled: approvalAmount?.gte(receiverAmount),
    address: contractAddresses.contracts?.sender,
    abi: senderContract.abi,
    functionName: 'newContract',
    args: [
      BigNumber.from(getUnixTime(addHours(new Date(), 1))), // _timelock,
      tokenIn, // _senderToken,
      senderAmount, // _senderAmount
      chainIdToDomainId[toChain], // _receiverDomain,
      tokenOut, // _receiverToken
      receiverAmount, // _receiverAmount
    ],
  })

  const { data, isLoading, isSuccess, write } = useContractWrite(config)
  const { isFetched: isTxComplete, isFetching: isInProgress } = useWaitForTransaction({
    hash: data?.hash,
  })

  useEffect(() => {
    if (isTxComplete) onClose()
  }, [isTxComplete])

  return (
    <>
      <Modal size={'sm'} finalFocusRef={finalRef} isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <Box padding={'16px'}>
            <ModalHeader textAlign={'center'} padding={'0px'} mb={'8px'}>
              Request to swap
            </ModalHeader>
            <Text
              textAlign={'center'}
              fontSize={'14px'}
              textColor={'#666666'}
              lineHeight={'inherit'}
              fontWeight={400}
            >
              Peer-to-peer request to swap tokens cross-chain in a trustless fashion via Hyperlane.
            </Text>
          </Box>
          <Divider />

          <ModalBody textAlign={'center'} padding={'16px'} gap={'16px'}>
            <FormControl>
              <FormLabel fontSize={'14px'} textColor={'#666666'}>
                From account
              </FormLabel>
              <Input
                size={'sm'}
                disabled
                variant={'filled'}
                placeholder="Address"
                bg={'#E2E8F0'}
                borderRadius={'8px'}
                value={address ? shortenAddress(address) : ''}
              />
              <Box display={'flex'} flexDir={'row'} justifyContent={'space-between'} mt={'16px'}>
                <Box>
                  <FormLabel fontSize={'14px'} textColor={'#666666'}>
                    Amount
                  </FormLabel>
                  <BigNumberInput
                    decimals={sentToken?.decimals || 18}
                    onChange={handleAmountChange}
                    value={amount}
                    renderInput={({ as, ...props }) => (
                      <Input
                        {...props}
                        size="sm"
                        variant={'filled'}
                        placeholder="Amount"
                        bg={'#F3F2F2'}
                        borderRadius={'8px'}
                      />
                    )}
                  />
                  <FormLabel fontSize={'14px'} mt={'16px'} textColor={'#666666'}>
                    To chain
                  </FormLabel>
                  <Select
                    variant={'filled'}
                    size={'sm'}
                    placeholder="Select chain"
                    bg={'#F3F2F2'}
                    borderRadius={'8px'}
                    value={toChain}
                    onChange={handleToChainChange}
                  >
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <FormLabel fontSize={'14px'} textColor={'#666666'}>
                    Token in
                  </FormLabel>
                  <Select
                    size={'sm'}
                    variant={'filled'}
                    placeholder="Choose token"
                    bg={'#F3F2F2'}
                    borderRadius={'8px'}
                    value={tokenIn}
                    onChange={handleTokenInChange}
                  >
                    {sentTokensList.map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                  </Select>
                  <FormLabel fontSize={'14px'} mt={'16px'} textColor={'#666666'}>
                    Token out
                  </FormLabel>
                  <Select
                    size={'sm'}
                    variant={'filled'}
                    placeholder="Choose token"
                    bg={'#F3F2F2'}
                    borderRadius={'8px'}
                    value={tokenOut}
                    onChange={handleTokenOutChange}
                  >
                    {receivedTokensList.map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Box>
            </FormControl>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Box display={'flex'} width={'100%'} flexDir={'column'}>
              {approvalAmount?.gte(senderAmount) ? (
                <Button
                  isLoading={isLoading || isInProgress || isRefetchingApproval}
                  disabled={!canSubmitRequest || sentToken?.value.lt(senderAmount)}
                  bg={'black'}
                  textColor={'white'}
                  colorScheme={'teal'}
                  borderRadius={'8px'}
                  padding={'8px 16px 8px 16px'}
                  gap={'10px'}
                  onClick={() => write?.()}
                  width={'100%'}
                  type={'submit'}
                  marginBottom={'8px'}
                >
                  Submit Request
                </Button>
              ) : (
                <Button
                  isLoading={isLoadingApproval || isTokenApprovalInProgress}
                  disabled={!writeApproval || sentToken?.value.lt(senderAmount)}
                  bg={'black'}
                  textColor={'white'}
                  colorScheme={'teal'}
                  borderRadius={'8px'}
                  padding={'8px 16px 8px 16px'}
                  gap={'10px'}
                  onClick={() => writeApproval?.()}
                  width={'100%'}
                  type={'submit'}
                  marginBottom={'8px'}
                >
                  Approve {sentToken?.symbol} transfer
                </Button>
              )}

              {sentToken?.value.lt(senderAmount) && (
                <Text textAlign={'center'} textColor={'red'} fontSize={'12px'}>
                  You do not have enough {sentToken?.symbol} to perform this swap
                </Text>
              )}

              <Text textAlign={'center'} textColor={'#666666'} fontSize={'12px'}>
                Request will only execute if conditions are met.
              </Text>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
