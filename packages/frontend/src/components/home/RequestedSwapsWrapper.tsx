import { Box, Heading } from '@chakra-ui/react'
import { FC } from 'react'

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
      >
        <Heading
          fontSize={'24px'}
          color={'#9C9C9C'}
          fontStyle={'normal'}
          lineHeight={'26px'}
          display={'flex'}
          alignItems={'center'}
        >
          Requested swaps
        </Heading>
        <Box></Box>
      </Box>
    </>
  )
}
