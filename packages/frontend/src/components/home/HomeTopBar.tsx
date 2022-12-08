import { Box, Heading, Stack } from '@chakra-ui/react'
import { RequestButton } from '@components/home/RequestButton'
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
        <Heading as="h1" size="lg" lineHeight={'26px'} fontWeight={500}>
          SwapOS
        </Heading>
        <Stack direction="row" spacing={4} align="center">
          <ConnectButton label="Connect" />
          <RequestButton />
        </Stack>
      </Box>
    </>
  )
}
