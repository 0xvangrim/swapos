import { Box, Heading } from '@chakra-ui/react'
import { SwapOSStateProps } from '@components/types'
import { FC, useContext } from 'react'
import SwapOSContext from '../context/SwapOSContext'
import { SwapCard } from '../primitives/SwapCard'

export const RequestedSwapsWrapper: FC = () => {
  const { swapOSState, _ }: any = useContext(SwapOSContext)
  return (
    <>
      <Box
        position={'relative'}
        display={'flex'}
        height={'100%'}
        flexDir={'column'}
        alignItems={'center'}
        backgroundColor={'#F9F9F9'}
        paddingTop={'32px'}
      >
        <Box>
          <Heading
            fontSize={'24px'}
            color={'#9C9C9C'}
            fontStyle={'normal'}
            lineHeight={'26px'}
            fontWeight={500}
          >
            Requested swaps
          </Heading>
        </Box>
        <Box>
          {swapOSState.map(
            ({ amount, toChain, tokenIn, tokenOut }: SwapOSStateProps, index: number) => (
              <SwapCard
                key={index}
                amount={amount}
                toChain={toChain}
                tokenIn={tokenIn}
                tokenOut={tokenOut}
              />
            ),
          )}
        </Box>
        <Box />
      </Box>
    </>
  )
}
