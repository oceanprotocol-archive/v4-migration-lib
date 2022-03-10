import { assert, expect } from 'chai'
import { AbiItem } from 'web3-utils/types'
import { TestContractHandler } from '../TestContractHandler'
import Web3 from 'web3'
import { Migration } from '../../src/migration/FixedRateExchangeMigration'
import Dispenser from './../../src/artifacts/Dispenser.json'
import IERC20 from './../../src/artifacts/IERC20.json'
import ERC721Factory from './../../src/artifacts/ERC721Factory.json'
import ERC721Template from './../../src/artifacts/ERC721Template.json'
import SideStaking from './../../src/artifacts/SideStaking.json'
import Router from './../../src/artifacts/FactoryRouter.json'
import ERC20Template from './../../src/artifacts/ERC20Template.json'
import FixedRate from './../../src/artifacts/FixedRateExchange.json'
import OPFCommunityFeeCollector from './../../src/artifacts/OPFCommunityFeeCollector.json'
import PoolTemplate from './../../src/artifacts/BPool.json'
import { ZERO_ADDRESS, ONE_ADDRESS } from '../../src/utils/Constants'
import BN from 'bn.js'
import sha256 from 'crypto-js/sha256'
import ProviderInstance from '../../src/provider/Provider'
import { getAndConvertDDO } from '../../src/DDO/convertDDO'

const web3 = new Web3('http://127.0.0.1:8545')
const providerUrl = 'https://v4.provider.rinkeby.oceanprotocol.com/'
const metadataCacheUri = 'https://aquarius.oceanprotocol.com'

describe('Migration test', () => {
  let v3DtOwner: string,
    user1: string,
    user2: string,
    daemon: string,
    v3dt1Address: string,
    v3dt2Address: string,
    v3pool1Address: string,
    v3pool2Address: string,
    migrationAddress: string,
    contracts: TestContractHandler,
    migration: Migration,
    oceanAddress: string,
    stakingAddress: string,
    did: string,
    ERC721FactoryAddress: string,
    nftName: string,
    nftSymbol: string,
    ownerAddress: string,
    cap: number,
    rate: string,
    marketFee: number,
    publishingMarketFeeAddress: string,
    publishingMarketTokenAddress: string,
    fixedRateExchangeAddress: string,
    baseTokenAddress: string,
    factory721Address: string,
    fixedRateAddress: string,
    txReceipt: any

  it('should initiate Migration instance', async () => {
    migration = new Migration(web3)
    assert(migration != undefined, 'Failed to initialize Migration class')
  })

  it('should deploy contracts', async () => {
    contracts = new TestContractHandler(
      web3,
      ERC721Template.abi as AbiItem[],
      ERC20Template.abi as AbiItem[],
      PoolTemplate.abi as AbiItem[],
      ERC721Factory.abi as AbiItem[],
      Router.abi as AbiItem[],
      SideStaking.abi as AbiItem[],
      FixedRate.abi as AbiItem[],
      Dispenser.abi as AbiItem[],
      OPFCommunityFeeCollector.abi as AbiItem[],

      ERC721Template.bytecode,
      ERC20Template.bytecode,
      PoolTemplate.bytecode,
      ERC721Factory.bytecode,
      Router.bytecode,
      SideStaking.bytecode,
      FixedRate.bytecode,
      Dispenser.bytecode,
      OPFCommunityFeeCollector.bytecode
    )
    await contracts.getAccounts()
    v3DtOwner = contracts.accounts[0]
    user1 = contracts.accounts[1]
    user2 = contracts.accounts[2]
    daemon = contracts.accounts[9]

    await contracts.deployContracts(v3DtOwner, daemon, Router.abi as AbiItem[])
    //console.log(contracts)
    v3dt1Address = contracts.v3dt1Address
    v3dt2Address = contracts.v3dt2Address
    v3pool1Address = contracts.v3pool1Address
    v3pool2Address = contracts.v3pool2Address
    migrationAddress = contracts.migrationAddress
    oceanAddress = contracts.oceanAddress
    stakingAddress = contracts.sideStakingAddress
    factory721Address = contracts.factory721Address
    fixedRateAddress = contracts.fixedRateAddress
  })

  it('should publish Fixed Rate Asset', async () => {
    user1 = contracts.accounts[1]
    did = 'did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38'
    ERC721FactoryAddress = factory721Address
    nftName = 'OCEAN NFT'
    nftSymbol = 'OCEAN-NFT'
    cap = 10000
    marketFee = 1e15
    rate = web3.utils.toWei('1')
    publishingMarketFeeAddress = '0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d'
    publishingMarketTokenAddress = '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
    fixedRateExchangeAddress = fixedRateAddress
    baseTokenAddress = '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'

    try {
      txReceipt = await migration.publishFixedRateAsset(
        did,
        ERC721FactoryAddress,
        nftName,
        nftSymbol,
        v3DtOwner,
        cap,
        rate,
        marketFee,
        publishingMarketFeeAddress,
        publishingMarketTokenAddress,
        fixedRateExchangeAddress,
        baseTokenAddress
      )
    } catch (e) {
      console.log('Error', e)
    }

    expect(txReceipt.events.NFTCreated != null)
    expect(txReceipt.events.TokenCreated != null)
    expect(txReceipt.events.NewFixedRate != null)
  })

  it('should update metadata for Asset', async () => {
    const nftAddress = txReceipt.events.NFTCreated.returnValues.newTokenAddress
    const erc20Address =
      txReceipt.events.TokenCreated.returnValues.newTokenAddress

    const ddo = await getAndConvertDDO(
      'did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38',
      nftAddress,
      erc20Address,
      metadataCacheUri
    )
    const provider = await ProviderInstance
    const encryptedDdo = await provider.encrypt(ddo, providerUrl)
    const dataHash = '0x' + sha256(JSON.stringify(ddo)).toString()
    const flags = '0x123'
    let txReceipt2
    try {
      txReceipt2 = await migration.updateMetadata(
        v3DtOwner,
        txReceipt,
        1,
        providerUrl,
        '0x123',
        flags,
        encryptedDdo,
        dataHash
      )
    } catch (e) {
      console.log('Error', e)
    }
    expect(txReceipt2.events.MetadataCreated != null)
  })
})
