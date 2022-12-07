import { Box, Heading } from '@chakra-ui/react'
import { FC } from 'react'
import { SwapCard } from '../primitives/SwapCard'

export const RequestedSwapsWrapper: FC = () => {
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
          <SwapCard />
          <SwapCard />
          <SwapCard />
          <SwapCard />
          <SwapCard />
          <SwapCard />
          <SwapCard />
        </Box>
        <Box />
      </Box>
    </>
  )
}
