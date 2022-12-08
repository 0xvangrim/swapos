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
          <Box padding={'16px'} gap={'8px'}>
            <ModalHeader textAlign={'center'}>Request to swap</ModalHeader>
            <Text
              textAlign={'center'}
              fontSize={'12px'}
              textColor={'#666666'}
              lineHeight={'13px'}
              fontWeight={400}
            >
              Trustless peer-to-peer request for swapping tokens cross-chain via Hyperlane
            </Text>
          </Box>
          <Divider />

          <ModalBody textAlign={'center'} padding={'16px'} gap={'16px'}>
            <FormControl>
              <FormLabel textColor={'#666666'}>From account</FormLabel>
              <Input
                size={'sm'}
                disabled
                variant={'filled'}
                placeholder="Address"
                bg={'#F3F2F2'}
                borderRadius={'8px'}
                value={shortenAddress(address)}
              />
              <Box display={'flex'} flexDir={'row'} justifyContent={'space-between'} mt={'16px'}>
                <Box width={'150px'}>
                  <FormLabel textColor={'#666666'}>Amount</FormLabel>
                  <Input
                    size={'sm'}
                    variant={'filled'}
                    placeholder="Amount"
                    bg={'#F3F2F2'}
                    borderRadius={'8px'}
                    value={amount}
                    onChange={handleAmountChange}
                  />
                  <FormLabel mt={'16px'} textColor={'#666666'}>
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
                  <FormLabel textColor={'#666666'}>Token in</FormLabel>
                  <Select
                    size={'sm'}
                    variant={'filled'}
                    placeholder="Choose token"
                    bg={'#F3F2F2'}
                    borderRadius={'8px'}
                    value={tokenIn}
                    onChange={handleTokenInChange}
                  >
                    <option>USDC</option>
                    <option>USDT</option>
                  </Select>
                  <FormLabel mt={'16px'} textColor={'#666666'}>
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
                    <option>USDC</option>
                    <option>USDT</option>
                  </Select>
                </Box>
              </Box>
            </FormControl>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Box display={'flex'} flexDir={'column'}>
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
              >
                Submit Request
              </Button>
              <Text textAlign={'center'} textColor={'#666666'} fontSize={'12px'}>
                Request can be revoked anytime and will only execute if the set conditions are met.
              </Text>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
