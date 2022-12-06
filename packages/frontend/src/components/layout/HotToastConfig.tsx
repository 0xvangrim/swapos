import { FC } from 'react'
import { Toaster } from 'react-hot-toast'

export const HotToastConfig: FC = () => {
  return (
    <Toaster
      toastOptions={{
        position: 'top-center',
        style: {
          marginTop: '2rem',
          wordBreak: 'break-all',
          maxWidth: '30rem',
          background: 'white',
          color: 'white',
          borderRadius: '12px',
        },
        success: {
          duration: 5000,
        },
      }}
    />
  )
}
