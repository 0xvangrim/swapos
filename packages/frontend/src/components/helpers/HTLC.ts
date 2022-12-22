import { BigNumber } from 'ethers'

export type HTLC = {
  id: string
  sender: string
  senderDomain: string
  senderToken: string
  senderAmount: BigNumber
  receiver?: string
  receiverDomain: string
  receiverToken: string
  receiverAmount: BigNumber
  timelock: BigNumber
  withdrawn: boolean
  refunded: boolean
}
