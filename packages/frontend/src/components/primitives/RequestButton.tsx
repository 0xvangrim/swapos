import { Button } from '@chakra-ui/react'
import { FC } from 'react'

export const RequestButton: FC = () => {
  const handleNewRequest = () => {
    console.log('new request')
  }
  return (
    <>
      <Button
        colorScheme={'teal'}
        bg="#000000"
        textColor={'white'}
        onClick={handleNewRequest}
        borderRadius={'8px'}
        padding={'8px 16px'}
      >
        New Request
      </Button>
    </>
  )
}
