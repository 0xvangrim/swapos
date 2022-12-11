// @ts-nocheck
import {
  GraphQLResolveInfo,
  SelectionSetNode,
  FieldNode,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql'
import type { GetMeshOptions } from '@graphql-mesh/runtime'
import type { YamlConfig } from '@graphql-mesh/types'
import { PubSub } from '@graphql-mesh/utils'
import { DefaultLogger } from '@graphql-mesh/utils'
import MeshCache from '@graphql-mesh/cache-localforage'
import { fetch as fetchFn } from '@whatwg-node/fetch'

import { MeshResolvedSource } from '@graphql-mesh/runtime'
import { MeshTransform, MeshPlugin } from '@graphql-mesh/types'
import GraphqlHandler from '@graphql-mesh/graphql'
import BareMerger from '@graphql-mesh/merger-bare'
import { createMeshHTTPHandler, MeshHTTPHandler } from '@graphql-mesh/http'
import {
  getMesh,
  ExecuteMeshFn,
  SubscribeMeshFn,
  MeshContext as BaseMeshContext,
  MeshInstance,
} from '@graphql-mesh/runtime'
import { MeshStore, FsStoreStorageAdapter } from '@graphql-mesh/store'
import { path as pathModule } from '@graphql-mesh/cross-helpers'
import { ImportFn } from '@graphql-mesh/types'
import type { SwaposPolygonMumbaiTypes } from './sources/swapos-polygon-mumbai/types'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }

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
  htlcerc20?: Maybe<HTLCERC20>
  htlcerc20S: Array<HTLCERC20>
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>
}

export type Queryhtlcerc20Args = {
  id: Scalars['ID']
  block?: InputMaybe<Block_height>
  subgraphError?: _SubgraphErrorPolicy_
}

export type Queryhtlcerc20SArgs = {
  skip?: InputMaybe<Scalars['Int']>
  first?: InputMaybe<Scalars['Int']>
  orderBy?: InputMaybe<HTLCERC20_orderBy>
  orderDirection?: InputMaybe<OrderDirection>
  where?: InputMaybe<HTLCERC20_filter>
  block?: InputMaybe<Block_height>
  subgraphError?: _SubgraphErrorPolicy_
}

export type Query_metaArgs = {
  block?: InputMaybe<Block_height>
}

export type Subscription = {
  htlcerc20?: Maybe<HTLCERC20>
  htlcerc20S: Array<HTLCERC20>
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>
}

export type Subscriptionhtlcerc20Args = {
  id: Scalars['ID']
  block?: InputMaybe<Block_height>
  subgraphError?: _SubgraphErrorPolicy_
}

export type Subscriptionhtlcerc20SArgs = {
  skip?: InputMaybe<Scalars['Int']>
  first?: InputMaybe<Scalars['Int']>
  orderBy?: InputMaybe<HTLCERC20_orderBy>
  orderDirection?: InputMaybe<OrderDirection>
  where?: InputMaybe<HTLCERC20_filter>
  block?: InputMaybe<Block_height>
  subgraphError?: _SubgraphErrorPolicy_
}

export type Subscription_metaArgs = {
  block?: InputMaybe<Block_height>
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

export type WithIndex<TObject> = TObject & Record<string, any>
export type ResolversObject<TObject> = WithIndex<TObject>

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string | ((fieldNode: FieldNode) => SelectionSetNode)
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type StitchingResolver<TResult, TParent, TContext, TArgs> =
  | LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
  | NewStitchingResolver<TResult, TParent, TContext, TArgs>
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  BigDecimal: ResolverTypeWrapper<Scalars['BigDecimal']>
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>
  BlockChangedFilter: BlockChangedFilter
  Block_height: Block_height
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>
  Bytes: ResolverTypeWrapper<Scalars['Bytes']>
  Float: ResolverTypeWrapper<Scalars['Float']>
  HTLCERC20: ResolverTypeWrapper<HTLCERC20>
  HTLCERC20_filter: HTLCERC20_filter
  HTLCERC20_orderBy: HTLCERC20_orderBy
  HTLCSendStatus: HTLCSendStatus
  ID: ResolverTypeWrapper<Scalars['ID']>
  Int: ResolverTypeWrapper<Scalars['Int']>
  OrderDirection: OrderDirection
  Query: ResolverTypeWrapper<{}>
  String: ResolverTypeWrapper<Scalars['String']>
  Subscription: ResolverTypeWrapper<{}>
  _Block_: ResolverTypeWrapper<_Block_>
  _Meta_: ResolverTypeWrapper<_Meta_>
  _SubgraphErrorPolicy_: _SubgraphErrorPolicy_
}>

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  BigDecimal: Scalars['BigDecimal']
  BigInt: Scalars['BigInt']
  BlockChangedFilter: BlockChangedFilter
  Block_height: Block_height
  Boolean: Scalars['Boolean']
  Bytes: Scalars['Bytes']
  Float: Scalars['Float']
  HTLCERC20: HTLCERC20
  HTLCERC20_filter: HTLCERC20_filter
  ID: Scalars['ID']
  Int: Scalars['Int']
  Query: {}
  String: Scalars['String']
  Subscription: {}
  _Block_: _Block_
  _Meta_: _Meta_
}>

export type entityDirectiveArgs = {}

export type entityDirectiveResolver<
  Result,
  Parent,
  ContextType = MeshContext,
  Args = entityDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>

export type subgraphIdDirectiveArgs = {
  id: Scalars['String']
}

export type subgraphIdDirectiveResolver<
  Result,
  Parent,
  ContextType = MeshContext,
  Args = subgraphIdDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>

export type derivedFromDirectiveArgs = {
  field: Scalars['String']
}

export type derivedFromDirectiveResolver<
  Result,
  Parent,
  ContextType = MeshContext,
  Args = derivedFromDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>

export interface BigDecimalScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['BigDecimal'], any> {
  name: 'BigDecimal'
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt'
}

export interface BytesScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Bytes'], any> {
  name: 'Bytes'
}

export type HTLCERC20Resolvers<
  ContextType = MeshContext,
  ParentType extends ResolversParentTypes['HTLCERC20'] = ResolversParentTypes['HTLCERC20'],
> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>
  sender?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>
  senderDomain?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>
  senderToken?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>
  senderAmount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>
  receiver?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>
  receiverDomain?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>
  receiverToken?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>
  receiverAmount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>
  createdAt?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>
  timelock?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>
  sendStatus?: Resolver<ResolversTypes['HTLCSendStatus'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type QueryResolvers<
  ContextType = MeshContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = ResolversObject<{
  htlcerc20?: Resolver<
    Maybe<ResolversTypes['HTLCERC20']>,
    ParentType,
    ContextType,
    RequireFields<Queryhtlcerc20Args, 'id' | 'subgraphError'>
  >
  htlcerc20S?: Resolver<
    Array<ResolversTypes['HTLCERC20']>,
    ParentType,
    ContextType,
    RequireFields<Queryhtlcerc20SArgs, 'skip' | 'first' | 'subgraphError'>
  >
  _meta?: Resolver<
    Maybe<ResolversTypes['_Meta_']>,
    ParentType,
    ContextType,
    Partial<Query_metaArgs>
  >
}>

export type SubscriptionResolvers<
  ContextType = MeshContext,
  ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription'],
> = ResolversObject<{
  htlcerc20?: SubscriptionResolver<
    Maybe<ResolversTypes['HTLCERC20']>,
    'htlcerc20',
    ParentType,
    ContextType,
    RequireFields<Subscriptionhtlcerc20Args, 'id' | 'subgraphError'>
  >
  htlcerc20S?: SubscriptionResolver<
    Array<ResolversTypes['HTLCERC20']>,
    'htlcerc20S',
    ParentType,
    ContextType,
    RequireFields<Subscriptionhtlcerc20SArgs, 'skip' | 'first' | 'subgraphError'>
  >
  _meta?: SubscriptionResolver<
    Maybe<ResolversTypes['_Meta_']>,
    '_meta',
    ParentType,
    ContextType,
    Partial<Subscription_metaArgs>
  >
}>

export type _Block_Resolvers<
  ContextType = MeshContext,
  ParentType extends ResolversParentTypes['_Block_'] = ResolversParentTypes['_Block_'],
> = ResolversObject<{
  hash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
  timestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type _Meta_Resolvers<
  ContextType = MeshContext,
  ParentType extends ResolversParentTypes['_Meta_'] = ResolversParentTypes['_Meta_'],
> = ResolversObject<{
  block?: Resolver<ResolversTypes['_Block_'], ParentType, ContextType>
  deployment?: Resolver<ResolversTypes['String'], ParentType, ContextType>
  hasIndexingErrors?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}>

export type Resolvers<ContextType = MeshContext> = ResolversObject<{
  BigDecimal?: GraphQLScalarType
  BigInt?: GraphQLScalarType
  Bytes?: GraphQLScalarType
  HTLCERC20?: HTLCERC20Resolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Subscription?: SubscriptionResolvers<ContextType>
  _Block_?: _Block_Resolvers<ContextType>
  _Meta_?: _Meta_Resolvers<ContextType>
}>

export type DirectiveResolvers<ContextType = MeshContext> = ResolversObject<{
  entity?: entityDirectiveResolver<any, any, ContextType>
  subgraphId?: subgraphIdDirectiveResolver<any, any, ContextType>
  derivedFrom?: derivedFromDirectiveResolver<any, any, ContextType>
}>

export type MeshContext = SwaposPolygonMumbaiTypes.Context & BaseMeshContext

import { fileURLToPath } from '@graphql-mesh/utils'
const baseDir = pathModule.join(pathModule.dirname(fileURLToPath(import.meta.url)), '..')

const importFn: ImportFn = <T>(moduleId: string) => {
  const relativeModuleId = (
    pathModule.isAbsolute(moduleId) ? pathModule.relative(baseDir, moduleId) : moduleId
  )
    .split('\\')
    .join('/')
    .replace(baseDir + '/', '')
  switch (relativeModuleId) {
    case '.graphclient/sources/swapos-polygon-mumbai/introspectionSchema':
      return import('./sources/swapos-polygon-mumbai/introspectionSchema') as T

    default:
      return Promise.reject(new Error(`Cannot find module '${relativeModuleId}'.`))
  }
}

const rootStore = new MeshStore(
  '.graphclient',
  new FsStoreStorageAdapter({
    cwd: baseDir,
    importFn,
    fileType: 'ts',
  }),
  {
    readonly: true,
    validate: false,
  },
)

export const rawServeConfig: YamlConfig.Config['serve'] = undefined as any
export async function getMeshOptions(): Promise<GetMeshOptions> {
  const pubsub = new PubSub()
  const sourcesStore = rootStore.child('sources')
  const logger = new DefaultLogger('GraphClient')
  const cache = new (MeshCache as any)({
    ...({} as any),
    importFn,
    store: rootStore.child('cache'),
    pubsub,
    logger,
  } as any)

  const sources: MeshResolvedSource[] = []
  const transforms: MeshTransform[] = []
  const additionalEnvelopPlugins: MeshPlugin<any>[] = []
  const swaposPolygonMumbaiTransforms = []
  const additionalTypeDefs = [] as any[]
  const swaposPolygonMumbaiHandler = new GraphqlHandler({
    name: 'swapos-polygon-mumbai',
    config: {
      endpoint: 'https://api.thegraph.com/subgraphs/name/mprasanjith/swapos-polygon-mumbai',
    },
    baseDir,
    cache,
    pubsub,
    store: sourcesStore.child('swapos-polygon-mumbai'),
    logger: logger.child('swapos-polygon-mumbai'),
    importFn,
  })
  sources[0] = {
    name: 'swapos-polygon-mumbai',
    handler: swaposPolygonMumbaiHandler,
    transforms: swaposPolygonMumbaiTransforms,
  }
  const additionalResolvers = [] as any[]
  const merger = new (BareMerger as any)({
    cache,
    pubsub,
    logger: logger.child('bareMerger'),
    store: rootStore.child('bareMerger'),
  })

  return {
    sources,
    transforms,
    additionalTypeDefs,
    additionalResolvers,
    cache,
    pubsub,
    merger,
    logger,
    additionalEnvelopPlugins,
    get documents() {
      return []
    },
    fetchFn,
  }
}

export function createBuiltMeshHTTPHandler(): MeshHTTPHandler<MeshContext> {
  return createMeshHTTPHandler<MeshContext>({
    baseDir,
    getBuiltMesh: getBuiltGraphClient,
    rawServeConfig: undefined,
  })
}

let meshInstance$: Promise<MeshInstance> | undefined

export function getBuiltGraphClient(): Promise<MeshInstance> {
  if (meshInstance$ == null) {
    meshInstance$ = getMeshOptions()
      .then((meshOptions) => getMesh(meshOptions))
      .then((mesh) => {
        const id = mesh.pubsub.subscribe('destroy', () => {
          meshInstance$ = undefined
          mesh.pubsub.unsubscribe(id)
        })
        return mesh
      })
  }
  return meshInstance$
}

export const execute: ExecuteMeshFn = (...args) =>
  getBuiltGraphClient().then(({ execute }) => execute(...args))

export const subscribe: SubscribeMeshFn = (...args) =>
  getBuiltGraphClient().then(({ subscribe }) => subscribe(...args))
