import { assert, expect } from 'chai'
import { AbiItem } from 'web3-utils/types'
import { TestContractHandler } from '../TestContractHandler'
import Web3 from 'web3'
import { Migration, DispenserData } from '../../src/migration/Migration'
import Dispenser from '../../src/artifacts/Dispenser.json'
import ERC721Factory from '../../src/artifacts/ERC721Factory.json'
import ERC721Template from '../../src/artifacts/ERC721Template.json'
import SideStaking from '../../src/artifacts/SideStaking.json'
import Router from '../../src/artifacts/FactoryRouter.json'
import ERC20Template from '../../src/artifacts/ERC20Template.json'
import FixedRate from '../../src/artifacts/FixedRateExchange.json'
import OPFCommunityFeeCollector from '../../src/artifacts/OPFCommunityFeeCollector.json'
import PoolTemplate from '../../src/artifacts/BPool.json'
import { Account } from '../../src/v3'
import { ZERO_ADDRESS } from '../../src/utils/Constants'

const web3 = new Web3('http://127.0.0.1:8545')
const providerUrl = 'https://v4.provider.rinkeby.oceanprotocol.com/'
const metadataCacheUri = 'https://aquarius.oceanprotocol.com'
const marketURL = 'https://market.oceanprotocol.com'

const did = 'did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38'
const nftName = 'OCEAN NFT'
const nftSymbol = 'OCEAN-NFT'
const cap = 10000
const marketFee = 1e15
const rate = web3.utils.toWei('1')
const publishingMarketFeeAddress = '0x9984b2453eC7D99a73A5B3a46Da81f197B753C8d'
const publishingMarketTokenAddress =
  '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
const baseTokenAddress = '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
const flags = '0x02'
const templateIndex = 1
const dtName = 'Test Datatoken'
const dtSymbol = 'TEST-DT'
const network = 'v4-testing'
const description = 'Example description with lots of detail...'

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
    factory721Address: string,
    fixedRateAddress: string,
    txReceipt: any,
    dispenserAddress: string

  it('should initiate Migration instance', async () => {
    migration = new Migration(web3)
    assert(migration != undefined, 'Failed to initialize Migration class')
  })

  it('should deploy contracts', async () => {
    try {
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
    } catch (error) {
      console.log('contracts error', error)
    }

    try {
      await contracts.getAccounts()
      v3DtOwner = contracts.accounts[0]
      user1 = contracts.accounts[1]
      user2 = contracts.accounts[2]
      daemon = contracts.accounts[9]
    } catch (error) {
      console.log('Get Accounts error', error)
    }
    expect(v3DtOwner != undefined)
    expect(user1 != undefined)
    expect(user2 != undefined)
    expect(daemon != undefined)

    try {
      await contracts.deployContracts(
        v3DtOwner,
        daemon,
        Router.abi as AbiItem[]
      )
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
      dispenserAddress = contracts.dispenserAddress
    } catch (error) {
      console.log('Deploy Contracts error', error)
    }
    expect(v3dt1Address != undefined)
    expect(v3dt2Address != undefined)
    expect(v3pool1Address != undefined)
    expect(v3pool2Address != undefined)
    expect(migrationAddress != undefined)
    expect(oceanAddress != undefined)
    expect(stakingAddress != undefined)
    expect(factory721Address != undefined)
    expect(fixedRateAddress != undefined)
    expect(dispenserAddress != dispenserAddress)
  })

  it('should publish Fixed Rate Asset', async () => {
    try {
      txReceipt = await migration.publishFixedRateAsset(
        did,
        description,
        factory721Address,
        nftName,
        nftSymbol,
        v3DtOwner,
        cap,
        rate,
        marketFee,
        publishingMarketFeeAddress,
        publishingMarketTokenAddress,
        fixedRateAddress,
        baseTokenAddress,
        templateIndex,
        dtName,
        dtSymbol
      )
    } catch (e) {
      console.log('Error', e)
    }

    expect(txReceipt.events.NFTCreated != null)
    expect(txReceipt.events.TokenCreated != null)
    expect(txReceipt.events.NewFixedRate != null)
  })

  it('should migrate the fixed priced Asset', async () => {
    let response
    let account: Account
    try {
      response = await migration.migrateFixedRateAsset(
        did,
        factory721Address,
        nftName,
        nftSymbol,
        v3DtOwner,
        account,
        cap,
        rate,
        flags,
        marketFee,
        publishingMarketFeeAddress,
        publishingMarketTokenAddress,
        fixedRateAddress,
        baseTokenAddress,
        1,
        '0x123',
        providerUrl,
        metadataCacheUri,
        templateIndex,
        dtName,
        dtSymbol,
        network,
        marketURL
      )
    } catch (e) {
      console.log('Error', e)
    }

    expect(response.txReceipt.events.NFTCreated != null)
    expect(response.txReceipt.events.TokenCreated != null)
    expect(response.txReceipt.events.NewFixedRate != null)

    expect(response.txReceipt2.events.MetadataCreated != null)
  })

  it('should migrate the free Asset', async () => {
    let response
    let account: Account
    const dispenserData: DispenserData = {
      dispenserAddress: dispenserAddress,
      maxTokens: web3.utils.toWei('1'),
      maxBalance: web3.utils.toWei('1'),
      withMint: true,
      allowedSwapper: ZERO_ADDRESS
    }
    try {
      response = await migration.migrateFreeAsset(
        did,
        factory721Address,
        nftName,
        nftSymbol,
        v3DtOwner,
        account,
        cap,
        flags,
        publishingMarketFeeAddress,
        publishingMarketTokenAddress,
        1,
        '0x123',
        providerUrl,
        metadataCacheUri,
        templateIndex,
        dtName,
        dtSymbol,
        network,
        dispenserData
      )
    } catch (e) {
      console.log('Error', e)
    }

    expect(response.txReceipt.events.NFTCreated != null)
    expect(response.txReceipt.events.TokenCreated != null)
    expect(response.txReceipt.events.NewFixedRate != null)

    expect(response.txReceipt2.events.MetadataCreated != null)
  })
})
