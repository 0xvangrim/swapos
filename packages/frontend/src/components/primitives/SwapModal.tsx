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
} from '@chakra-ui/react'
import SwapOSContext from '@components/context/SwapOSContext'
import { shortenAddress } from '@components/helpers/shortenAddress'
import { useTokens } from '@shared/useTokens'
import { useContext, useRef, useState } from 'react'
import { useAccount } from 'wagmi'

export const SwapModal = ({ isOpen, onClose }: { isOpen: any; onClose: any }) => {
  const { address } = useAccount()
  const finalRef = useRef(null)
  const { swapOSState, setSwapOSState }: any = useContext(SwapOSContext)

  const [amount, setAmount] = useState(0)
  const [toChain, setToChain] = useState('')
  const [tokenIn, setTokenIn] = useState('')
  const [tokenOut, setTokenOut] = useState('')

  const { tokens: sentTokensList } = useTokens()
  const { tokens: receivedTokensList } = useTokens()

  const handleAmountChange = (e: any) => setAmount(e?.target.value)
  const handleToChainChange = (e: any) => setToChain(e?.target.value)
  const handleTokenInChange = (e: any) => setTokenIn(e?.target.value)
  const handleTokenOutChange = (e: any) => setTokenOut(e?.target.value)

  const handleSubmitRequest = () => {
    setSwapOSState([
      ...swapOSState,
      {
        amount,
        toChain,
        tokenIn,
        tokenOut,
      },
    ])
    onClose()
  }

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
                  <Input
                    size={'sm'}
                    variant={'filled'}
                    placeholder="Amount"
                    bg={'#F3F2F2'}
                    borderRadius={'8px'}
                    value={amount}
                    onChange={handleAmountChange}
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
                    <option>Goerli testnet</option>
                    <option>Mumbai testnet</option>
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
                      <option key={token.address}>USDC</option>
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
                      <option key={token.address}>USDC</option>
                    ))}
                  </Select>
                </Box>
              </Box>
            </FormControl>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Box display={'flex'} width={'100%'} flexDir={'column'}>
              <Button
                bg={'black'}
                textColor={'white'}
                colorScheme={'teal'}
                borderRadius={'8px'}
                padding={'8px 16px 8px 16px'}
                gap={'10px'}
                onClick={handleSubmitRequest}
                width={'100%'}
                type={'submit'}
                marginBottom={'8px'}
              >
                Submit Request
              </Button>
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
