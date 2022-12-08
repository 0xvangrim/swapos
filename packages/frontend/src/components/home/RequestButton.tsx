import { Button, useDisclosure } from '@chakra-ui/react'
import { FC } from 'react'
import { SwapModal } from '../primitives/SwapModal'

export const RequestButton: FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button
        colorScheme={'teal'}
        bg="#000000"
        textColor={'white'}
        onClick={onOpen}
        borderRadius={'8px'}
        padding={'8px 16px'}
      >
        New Request
      </Button>
      <SwapModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
