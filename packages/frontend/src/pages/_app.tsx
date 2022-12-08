import { ChakraProvider } from '@chakra-ui/react'
import SwapOSContext from '@components/context/SwapOSContext'
import { BaseLayout } from '@components/layout/BaseLayout'
import { HotToastConfig } from '@components/layout/HotToastConfig'
import { cache } from '@emotion/css'
import { CacheProvider } from '@emotion/react'
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { chains, wagmiClient } from '@shared/wagmiClient'
import GlobalStyles from '@styles/GlobalStyles'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import NProgress from 'nprogress'
import { useState } from 'react'
import { WagmiConfig } from 'wagmi'
import theme from '../theme/theme'

// Router Loading Animation with @tanem/react-nprogress
Router.events.on('routeChangeStart', () => NProgress.start())
Router.events.on('routeChangeComplete', () => NProgress.done())
Router.events.on('routeChangeError', () => NProgress.done())

function MyApp({ Component, pageProps }: AppProps) {
  const [swapOSState, setSwapOSState] = useState({
    amount: 0,
    toChain: '',
    tokenIn: '',
    tokenOut: '',
  })
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <CacheProvider value={cache}>
        <ChakraProvider theme={theme}>
          <GlobalStyles />
          <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider
              chains={chains}
              theme={darkTheme({
                accentColor: 'black',
              })}
              coolMode={true}
            >
              <BaseLayout>
                <SwapOSContext.Provider value={{ swapOSState, setSwapOSState }}>
                  <Component {...pageProps} />
                </SwapOSContext.Provider>
              </BaseLayout>
            </RainbowKitProvider>
          </WagmiConfig>
          <HotToastConfig />
        </ChakraProvider>
      </CacheProvider>
    </>
  )
}

export default MyApp
