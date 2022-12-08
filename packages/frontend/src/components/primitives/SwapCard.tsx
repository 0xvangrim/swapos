import { Box, Button, Card, CardBody, Heading, Text } from '@chakra-ui/react'
import { FC } from 'react'
import { BsArrowRight } from 'react-icons/bs'

export const SwapCard: FC = ({ amount, toChain, tokenIn, tokenOut }: any) => {
  console.log({ amount, toChain, tokenIn, tokenOut })
  return (
    <>
      <Card backgroundColor={'#FFFFF'} borderRadius={'16px'} margin={'16px'}>
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
        >
          <Box width="250px" display={'flex'} justifyContent="space-between">
            <Box>
              <Heading size="xs" textTransform={'uppercase'}>
                {`${amount} ${tokenIn}`}
              </Heading>
              <Text pt="2" fontSize="sm" color={'#737373'}>
                Goerli testnet
              </Text>
            </Box>
            <BsArrowRight size={'30px'} color={'#E7E7E7'} />
            <Box>
              <Heading size="xs" textTransform={'uppercase'}>
                {`${amount} ${tokenOut}`}
              </Heading>
              <Text pt="2" fontSize="sm" color={'#737373'}>
                {toChain}
              </Text>
            </Box>
          </Box>
          <Button
            colorScheme="blackAlpha"
            variant={'ghost'}
            color={'black'}
            border={'1px solid #E5E5E5'}
          >
            Accept
          </Button>
        </CardBody>
      </Card>
    </>
  )
}
