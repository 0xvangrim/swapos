// import { RequestedSwapsWrapper } from '@components/home/RequestedSwapsWrapper'
import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import 'twin.macro'

const RequestedSwapsWrapper = dynamic(() => import('@components/home/RequestedSwapsWrapper'), {
  ssr: false,
})

const HomePage: NextPage = () => {
  return <RequestedSwapsWrapper />
}

export default HomePage
