import { getUnixTime } from 'date-fns'
import { gql, useQuery } from 'urql'
import { useAccount } from 'wagmi'
import useChains from './useChains'
import { HTLCERC20 } from '../../../.graphclient'

interface useSwapsReturn {
  livePendingSwaps: { htlcerc20S: HTLCERC20[] }
  expiredUserSentSwaps: { htlcerc20S: HTLCERC20[] }
  expiredUserReceivedSwaps: { htlcerc20S: HTLCERC20[] }
  liveUserSentSwaps: { htlcerc20S: HTLCERC20[] }
  liveUserReceivedSwaps: { htlcerc20S: HTLCERC20[] }
  completedUserSwaps: { htlcerc20S: HTLCERC20[] }
}

const useSwaps = (): useSwapsReturn => {
  // Get live swaps from other network where sender != user (For withdrawals)
  // Get expired swaps from current network where sender == user (For refunds)
  // Get expired swaps from current network where receiver == user (For refunds)
  // Get all incomplete swaps from current network where sender == user (For info about own swaps)
  // Get all incomplete swaps from current network where receiver == user (For info about own swaps)
  const { address } = useAccount()
  const { currentChain, otherChain } = useChains()

  const currUnixTime = getUnixTime(Date.now()).toString()
  const addressStr = address ? address : ''

  const [result] = useQuery({
    requestPolicy: 'network-only',
    query: gql`
        query GetAllHTLCs @live {
          livePendingSwaps: ${otherChain?.network} {
            htlcerc20S(where: { sendStatus: PENDING, timelock_gte: ${currUnixTime}, sender_not: "${addressStr}" }, orderBy: createdAt, orderDirection: desc) {
              id
              sender
              senderAmount
              senderDomain
              senderToken
              receiverDomain
              receiverAmount
              receiverToken
              timelock
              sendStatus
            }
          }

          expiredUserSentSwaps: ${currentChain?.network}{ 
            htlcerc20S(where: { sendStatus: PENDING, timelock_lt: ${currUnixTime}, sender: "${addressStr}" }, orderBy: createdAt, orderDirection: desc) {
              id
              sender
              senderAmount
              senderDomain
              senderToken
              receiverDomain
              receiverAmount
              receiverToken
              timelock
              sendStatus
            }
          }

          expiredUserReceivedSwaps: ${currentChain?.network}{ 
            htlcerc20S(where: { sendStatus: PENDING, timelock_lt: ${currUnixTime}, receiver: "${addressStr}" }, orderBy: createdAt, orderDirection: desc) {
              id
              sender
              senderAmount
              senderDomain
              senderToken
              receiverDomain
              receiverAmount
              receiverToken
              timelock
              sendStatus
            }
          }

          liveUserSentSwaps: ${currentChain?.network} {
            htlcerc20S(where: { sendStatus: PENDING, sender: "${addressStr}" }, orderBy: createdAt, orderDirection: desc) {
              id
              sender
              senderAmount
              senderDomain
              senderToken
              receiverDomain
              receiverAmount
              receiverToken
              timelock
              sendStatus
            }
          }

          liveUserReceivedSwaps: ${currentChain?.network} {
            htlcerc20S(where: { sendStatus: PENDING, receiver: "${addressStr}" }, orderBy: createdAt, orderDirection: desc) {
              id
              sender
              senderAmount
              senderDomain
              senderToken
              receiverDomain
              receiverAmount
              receiverToken
              timelock
              sendStatus
            }
          }

          completedUserSwaps: ${currentChain?.network} {
            htlcerc20S(where: { sendStatus_not: PENDING, sender: "${addressStr}" }, orderBy: createdAt, orderDirection: desc) {
              id
              sender
              senderAmount
              senderDomain
              senderToken
              receiverDomain
              receiverAmount
              receiverToken
              timelock
              sendStatus
            }
          }
        }
      `,
  })
  const { data } = result
  return data
}

export default useSwaps
