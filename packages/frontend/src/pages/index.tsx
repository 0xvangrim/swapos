import { HomeTopBar } from '@components/home/HomeTopBar'
import { RequestedSwapsWrapper } from '@components/home/RequestedSwapsWrapper'
import type { NextPage } from 'next'
import 'twin.macro'

const HomePage: NextPage = () => {
  return (
    <>
      <HomeTopBar />
      <RequestedSwapsWrapper />
    </>
  )
}

export default HomePage
