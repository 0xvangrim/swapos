import { Box, Heading, Stack } from '@chakra-ui/react'
import { RequestButton } from '@components/home/RequestButton'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { FC } from 'react'
import { useAccount } from 'wagmi'

export const HomeTopBar: FC = () => {
  const { isConnected } = useAccount()

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
        borderBottom={'1px solid #E5E5E5'}
      >
        <Heading as="h1" size="lg" lineHeight={'26px'} fontWeight={500}>
          <b>Swap</b>OS
        </Heading>
        <Stack direction="row" spacing={4} align="center">
          <ConnectButton label="Connect" />
          {isConnected && <RequestButton />}
        </Stack>
      </Box>
    </>
  )
}
