import { Box, Heading } from '@chakra-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { FC } from 'react'

export const HomeTopBar: FC = () => {
  return (
    <>
      <Box
        display="flex"
        flexDirection={'row'}
        justifyContent={'space-between'}
        p={'16px'}
        alignItems={'center'}
        mt={0}
        bg={'rgba(255, 255, 255, 0.5)'}
        borderBottom={'1px solid #E1E1E1'}
      >
        <Heading>SwapOS</Heading>
        <ConnectButton label="Connect" />
      </Box>
    </>
  )
}
