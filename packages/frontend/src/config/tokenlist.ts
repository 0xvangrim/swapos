interface Token {
  name: string
  symbol: string
  addresses: { [chainId: number]: string }
  decimals: number
}

const tokens: Token[] = [
  {
    symbol: 'USDC',
    name: 'USDC',
    addresses: {
      '43113': '0x5425890298aed601595a70AB815c96711a31Bc65',
    },
    decimals: 6,
  },
  {
    symbol: 'ALOT',
    name: 'Dexalot',
    addresses: {
      '43113': '0x9983F755Bbd60d1886CbfE103c98C272AA0F03d6',
    },
    decimals: 18,
  },
  {
    symbol: 'JUP',
    name: 'Jupyter',
    addresses: {
      '1287': '0x9Aac6FB41773af877a2Be73c99897F3DdFACf576',
    },
    decimals: 18,
  },
]

export default tokens
