// @ts-nocheck

import { InContextSdkMethod } from '@graphql-mesh/types'
import { MeshContext } from '@graphql-mesh/runtime'

export namespace FujiTypes {
  export type Maybe<T> = T | null
  export type InputMaybe<T> = Maybe<T>
  export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
  export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
  export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
  /** All built-in and custom scalars, mapped to their actual values */
  export type Scalars = {
    ID: string
    String: string
    Boolean: boolean
    Int: number
    Float: number
    BigDecimal: any
    BigInt: any
    Bytes: any
  }

  export type BlockChangedFilter = {
    number_gte: Scalars['Int']
  }

  export type Block_height = {
    hash?: InputMaybe<Scalars['Bytes']>
    number?: InputMaybe<Scalars['Int']>
    number_gte?: InputMaybe<Scalars['Int']>
  }

  export type HTLCERC20 = {
    id: Scalars['ID']
    sender: Scalars['Bytes']
    senderDomain: Scalars['BigInt']
    senderToken: Scalars['Bytes']
    senderAmount: Scalars['BigInt']
    receiver?: Maybe<Scalars['Bytes']>
    receiverDomain: Scalars['BigInt']
    receiverToken: Scalars['Bytes']
    receiverAmount: Scalars['BigInt']
    createdAt: Scalars['BigInt']
    timelock: Scalars['BigInt']
    sendStatus: HTLCSendStatus
  }

  export type HTLCERC20_filter = {
    id?: InputMaybe<Scalars['ID']>
    id_not?: InputMaybe<Scalars['ID']>
    id_gt?: InputMaybe<Scalars['ID']>
    id_lt?: InputMaybe<Scalars['ID']>
    id_gte?: InputMaybe<Scalars['ID']>
    id_lte?: InputMaybe<Scalars['ID']>
    id_in?: InputMaybe<Array<Scalars['ID']>>
    id_not_in?: InputMaybe<Array<Scalars['ID']>>
    sender?: InputMaybe<Scalars['Bytes']>
    sender_not?: InputMaybe<Scalars['Bytes']>
    sender_in?: InputMaybe<Array<Scalars['Bytes']>>
    sender_not_in?: InputMaybe<Array<Scalars['Bytes']>>
    sender_contains?: InputMaybe<Scalars['Bytes']>
    sender_not_contains?: InputMaybe<Scalars['Bytes']>
    senderDomain?: InputMaybe<Scalars['BigInt']>
    senderDomain_not?: InputMaybe<Scalars['BigInt']>
    senderDomain_gt?: InputMaybe<Scalars['BigInt']>
    senderDomain_lt?: InputMaybe<Scalars['BigInt']>
    senderDomain_gte?: InputMaybe<Scalars['BigInt']>
    senderDomain_lte?: InputMaybe<Scalars['BigInt']>
    senderDomain_in?: InputMaybe<Array<Scalars['BigInt']>>
    senderDomain_not_in?: InputMaybe<Array<Scalars['BigInt']>>
    senderToken?: InputMaybe<Scalars['Bytes']>
    senderToken_not?: InputMaybe<Scalars['Bytes']>
    senderToken_in?: InputMaybe<Array<Scalars['Bytes']>>
    senderToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>
    senderToken_contains?: InputMaybe<Scalars['Bytes']>
    senderToken_not_contains?: InputMaybe<Scalars['Bytes']>
    senderAmount?: InputMaybe<Scalars['BigInt']>
    senderAmount_not?: InputMaybe<Scalars['BigInt']>
    senderAmount_gt?: InputMaybe<Scalars['BigInt']>
    senderAmount_lt?: InputMaybe<Scalars['BigInt']>
    senderAmount_gte?: InputMaybe<Scalars['BigInt']>
    senderAmount_lte?: InputMaybe<Scalars['BigInt']>
    senderAmount_in?: InputMaybe<Array<Scalars['BigInt']>>
    senderAmount_not_in?: InputMaybe<Array<Scalars['BigInt']>>
    receiver?: InputMaybe<Scalars['Bytes']>
    receiver_not?: InputMaybe<Scalars['Bytes']>
    receiver_in?: InputMaybe<Array<Scalars['Bytes']>>
    receiver_not_in?: InputMaybe<Array<Scalars['Bytes']>>
    receiver_contains?: InputMaybe<Scalars['Bytes']>
    receiver_not_contains?: InputMaybe<Scalars['Bytes']>
    receiverDomain?: InputMaybe<Scalars['BigInt']>
    receiverDomain_not?: InputMaybe<Scalars['BigInt']>
    receiverDomain_gt?: InputMaybe<Scalars['BigInt']>
    receiverDomain_lt?: InputMaybe<Scalars['BigInt']>
    receiverDomain_gte?: InputMaybe<Scalars['BigInt']>
    receiverDomain_lte?: InputMaybe<Scalars['BigInt']>
    receiverDomain_in?: InputMaybe<Array<Scalars['BigInt']>>
    receiverDomain_not_in?: InputMaybe<Array<Scalars['BigInt']>>
    receiverToken?: InputMaybe<Scalars['Bytes']>
    receiverToken_not?: InputMaybe<Scalars['Bytes']>
    receiverToken_in?: InputMaybe<Array<Scalars['Bytes']>>
    receiverToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>
    receiverToken_contains?: InputMaybe<Scalars['Bytes']>
    receiverToken_not_contains?: InputMaybe<Scalars['Bytes']>
    receiverAmount?: InputMaybe<Scalars['BigInt']>
    receiverAmount_not?: InputMaybe<Scalars['BigInt']>
    receiverAmount_gt?: InputMaybe<Scalars['BigInt']>
    receiverAmount_lt?: InputMaybe<Scalars['BigInt']>
    receiverAmount_gte?: InputMaybe<Scalars['BigInt']>
    receiverAmount_lte?: InputMaybe<Scalars['BigInt']>
    receiverAmount_in?: InputMaybe<Array<Scalars['BigInt']>>
    receiverAmount_not_in?: InputMaybe<Array<Scalars['BigInt']>>
    createdAt?: InputMaybe<Scalars['BigInt']>
    createdAt_not?: InputMaybe<Scalars['BigInt']>
    createdAt_gt?: InputMaybe<Scalars['BigInt']>
    createdAt_lt?: InputMaybe<Scalars['BigInt']>
    createdAt_gte?: InputMaybe<Scalars['BigInt']>
    createdAt_lte?: InputMaybe<Scalars['BigInt']>
    createdAt_in?: InputMaybe<Array<Scalars['BigInt']>>
    createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']>>
    timelock?: InputMaybe<Scalars['BigInt']>
    timelock_not?: InputMaybe<Scalars['BigInt']>
    timelock_gt?: InputMaybe<Scalars['BigInt']>
    timelock_lt?: InputMaybe<Scalars['BigInt']>
    timelock_gte?: InputMaybe<Scalars['BigInt']>
    timelock_lte?: InputMaybe<Scalars['BigInt']>
    timelock_in?: InputMaybe<Array<Scalars['BigInt']>>
    timelock_not_in?: InputMaybe<Array<Scalars['BigInt']>>
    sendStatus?: InputMaybe<HTLCSendStatus>
    sendStatus_not?: InputMaybe<HTLCSendStatus>
    sendStatus_in?: InputMaybe<Array<HTLCSendStatus>>
    sendStatus_not_in?: InputMaybe<Array<HTLCSendStatus>>
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>
  }

  export type HTLCERC20_orderBy =
    | 'id'
    | 'sender'
    | 'senderDomain'
    | 'senderToken'
    | 'senderAmount'
    | 'receiver'
    | 'receiverDomain'
    | 'receiverToken'
    | 'receiverAmount'
    | 'createdAt'
    | 'timelock'
    | 'sendStatus'

  export type HTLCSendStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED'

  /** Defines the order direction, either ascending or descending */
  export type OrderDirection = 'asc' | 'desc'

  export type Query = {
    fuji: fujiQuery
  }

  export type Subscription = {
    fuji: fujiSubscription
  }

  export type _Block_ = {
    /** The hash of the block */
    hash?: Maybe<Scalars['Bytes']>
    /** The block number */
    number: Scalars['Int']
    /** Integer representation of the timestamp stored in blocks for the chain */
    timestamp?: Maybe<Scalars['Int']>
  }

  /** The type for the top-level _meta field */
  export type _Meta_ = {
    /**
     * Information about a specific subgraph block. The hash of the block
     * will be null if the _meta field has a block constraint that asks for
     * a block number. It will be filled if the _meta field has no block constraint
     * and therefore asks for the latest  block
     *
     */
    block: _Block_
    /** The deployment ID */
    deployment: Scalars['String']
    /** If `true`, the subgraph encountered indexing errors at some past block */
    hasIndexingErrors: Scalars['Boolean']
  }

  export type _SubgraphErrorPolicy_ =
    /** Data will be returned even if the subgraph has indexing errors */
    | 'allow'
    /** If the subgraph has indexing errors, data will be omitted. The default. */
    | 'deny'

  export type fujiQuery = {
    htlcerc20?: Maybe<HTLCERC20>
    htlcerc20S: Array<HTLCERC20>
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>
  }

  export type fujiQueryhtlcerc20Args = {
    id: Scalars['ID']
    block?: InputMaybe<Block_height>
    subgraphError?: _SubgraphErrorPolicy_
  }

  export type fujiQueryhtlcerc20SArgs = {
    skip?: InputMaybe<Scalars['Int']>
    first?: InputMaybe<Scalars['Int']>
    orderBy?: InputMaybe<HTLCERC20_orderBy>
    orderDirection?: InputMaybe<OrderDirection>
    where?: InputMaybe<HTLCERC20_filter>
    block?: InputMaybe<Block_height>
    subgraphError?: _SubgraphErrorPolicy_
  }

  export type fujiQuery_metaArgs = {
    block?: InputMaybe<Block_height>
  }

  export type fujiSubscription = {
    htlcerc20?: Maybe<HTLCERC20>
    htlcerc20S: Array<HTLCERC20>
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>
  }

  export type fujiSubscriptionhtlcerc20Args = {
    id: Scalars['ID']
    block?: InputMaybe<Block_height>
    subgraphError?: _SubgraphErrorPolicy_
  }

  export type fujiSubscriptionhtlcerc20SArgs = {
    skip?: InputMaybe<Scalars['Int']>
    first?: InputMaybe<Scalars['Int']>
    orderBy?: InputMaybe<HTLCERC20_orderBy>
    orderDirection?: InputMaybe<OrderDirection>
    where?: InputMaybe<HTLCERC20_filter>
    block?: InputMaybe<Block_height>
    subgraphError?: _SubgraphErrorPolicy_
  }

  export type fujiSubscription_metaArgs = {
    block?: InputMaybe<Block_height>
  }

  export type QuerySdk = {
    /** undefined **/
    fuji: InContextSdkMethod<Query['fuji'], {}, MeshContext>
  }

  export type MutationSdk = {}

  export type SubscriptionSdk = {
    /** undefined **/
    fuji: InContextSdkMethod<Subscription['fuji'], {}, MeshContext>
  }

  export type Context = {
    ['fuji']: { Query: QuerySdk; Mutation: MutationSdk; Subscription: SubscriptionSdk }
  }
}
