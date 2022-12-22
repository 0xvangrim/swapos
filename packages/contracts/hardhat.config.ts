import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'
import 'hardhat-deploy'
import { HardhatUserConfig } from 'hardhat/config'
dotenv.config()

const accounts = [
  ...(process.env.PRIVATE_KEY_01 ? [`${process.env.PRIVATE_KEY_01}`] : []),
  ...(process.env.PRIVATE_KEY_02 ? [`${process.env.PRIVATE_KEY_02}`] : []),
]

const config: HardhatUserConfig = {
  solidity: '0.8.13',
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  verify: {
    etherscan: {
      apiKey: `${process.env.ETHERSCAN_API_KEY}`,
    },
  },
}

export default config
